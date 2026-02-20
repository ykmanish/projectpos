// app/api/chat/split-bill/route.js

import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { customAlphabet } from 'nanoid';
import { getCurrencySymbol } from '@/constants/currencies';

const generateBillId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// GET - Fetch bills for a group (excluding cancelled bills)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const billId = searchParams.get('billId');

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const bills = db.collection('splitBills');

    let query = { 
      groupId,
      // Exclude cancelled bills - only show active or settled bills
      status: { $ne: 'cancelled' }
    };
    
    // If specific bill is requested
    if (billId) {
      query.id = billId;
      const bill = await bills.findOne(query);
      return NextResponse.json({
        success: true,
        bill
      });
    }

    // Get all bills for the group, sorted by newest first
    const groupBills = await bills
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      success: true,
      bills: groupBills
    });

  } catch (error) {
    console.error('Error fetching bills:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bills' },
      { status: 500 }
    );
  }
}

// POST - Create a new split bill
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      groupId,
      billTitle,
      totalAmount,
      currency = 'USD',
      paidBy,
      splits,
      createdBy
    } = body;

    if (!groupId || !billTitle || !totalAmount || !paidBy || !splits || !createdBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const bills = db.collection('splitBills');
    const groups = db.collection('groups');

    // Check if group exists
    const group = await groups.findOne({ groupId });
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Generate unique bill ID
    const id = `BILL_${generateBillId()}_${Date.now()}`;

    const bill = {
      id,
      groupId,
      title: billTitle,
      totalAmount,
      currency,
      paidBy,
      splits: splits.map(split => ({
        ...split,
        currency: split.currency || currency,
        status: split.userId === paidBy ? 'paid' : 'pending',
        updatedAt: new Date().toISOString()
      })),
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    const result = await bills.insertOne(bill);

    // Update group's last activity
    await groups.updateOne(
      { groupId },
      { 
        $set: { 
          lastActivity: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        $inc: { totalBills: 1 }
      }
    );

    console.log('✅ Split bill created:', id, 'Currency:', currency);

    return NextResponse.json({
      success: true,
      bill: { ...bill, _id: result.insertedId }
    });

  } catch (error) {
    console.error('Error creating split bill:', error);
    return NextResponse.json(
      { error: 'Failed to create split bill' },
      { status: 500 }
    );
  }
}

// PUT - Update an existing split bill
export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      billId,
      groupId,
      billTitle,
      totalAmount,
      currency = 'USD',
      paidBy,
      splits,
      updatedBy
    } = body;

    if (!billId || !groupId || !billTitle || !totalAmount || !paidBy || !splits || !updatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const bills = db.collection('splitBills');

    // Find the bill
    const existingBill = await bills.findOne({ id: billId });
    if (!existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (existingBill.createdBy !== updatedBy) {
      return NextResponse.json(
        { error: 'Only the bill creator can edit this bill' },
        { status: 403 }
      );
    }

    // Prepare updated bill
    const updatedBill = {
      ...existingBill,
      title: billTitle,
      totalAmount,
      currency,
      paidBy,
      splits: splits.map(split => ({
        ...split,
        currency: split.currency || currency,
        status: split.userId === paidBy ? 'paid' : split.status || 'pending',
        updatedAt: new Date().toISOString()
      })),
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    // Check if all splits are paid
    const allPaid = updatedBill.splits.every(split => split.status === 'paid');
    updatedBill.status = allPaid ? 'settled' : 'active';

    await bills.updateOne(
      { id: billId },
      { $set: updatedBill }
    );

    const finalBill = await bills.findOne({ id: billId });

    // ========== UPDATE CHAT MESSAGE WITH LATEST BILL DATA ==========
    try {
      const messages = db.collection('messages');
      
      // Find the original bill message
      const originalMessage = await messages.findOne({
        roomId: groupId,
        billId: billId
      });

      if (originalMessage) {
        // Calculate updated stats
        const paidCount = finalBill.splits.filter(s => s.status === 'paid').length;
        const totalCount = finalBill.splits.length;
        const paidAmount = finalBill.splits
          .filter(s => s.status === 'paid')
          .reduce((sum, s) => sum + s.amount, 0);
        const paidPercentage = finalBill.totalAmount > 0 ? (paidAmount / finalBill.totalAmount) * 100 : 0;

        // Get payer name
        const paidByMember = finalBill.splits.find(s => s.userId === finalBill.paidBy);
        const paidByName = paidByMember?.userName || 'Someone';

        const currencySymbol = getCurrencySymbol(finalBill.currency || 'USD');

        // Create updated bill message content
        const updatedBillMessage = `New Split Bill: ${finalBill.title}\n Total: ${currencySymbol}${finalBill.totalAmount.toFixed(2)}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

        // Update the message in database
        await messages.updateOne(
          { 
            roomId: groupId,
            billId: billId 
          },
          {
            $set: {
              content: updatedBillMessage,
              billData: {
                title: finalBill.title,
                totalAmount: finalBill.totalAmount,
                paidBy: finalBill.paidBy,
                paidByName: paidByName,
                paidCount,
                totalCount,
                pendingCount: totalCount - paidCount,
                paidPercentage,
                splits: finalBill.splits
              },
              updatedAt: new Date().toISOString()
            }
          }
        );

        console.log('📝 Chat message updated for bill edit:', billId);
      }
    } catch (msgError) {
      console.error('Error updating chat message:', msgError);
      // Don't fail the whole request if message update fails
    }

    console.log('✅ Split bill updated:', billId);

    return NextResponse.json({
      success: true,
      bill: finalBill
    });

  } catch (error) {
    console.error('Error updating split bill:', error);
    return NextResponse.json(
      { error: 'Failed to update split bill' },
      { status: 500 }
    );
  }
}

// PATCH - Update bill status (mark as paid, etc.)
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { billId, splitUserId, status, groupId } = body;

    if (!billId || !splitUserId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const bills = db.collection('splitBills');

    // Find the bill
    const bill = await bills.findOne({ id: billId });
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Update the specific split
    const updatedSplits = bill.splits.map(split => {
      if (split.userId === splitUserId) {
        return {
          ...split,
          status,
          updatedAt: new Date().toISOString()
        };
      }
      return split;
    });

    // Check if all splits are paid
    const allPaid = updatedSplits.every(split => split.status === 'paid');
    const billStatus = allPaid ? 'settled' : 'active';

    await bills.updateOne(
      { id: billId },
      {
        $set: {
          splits: updatedSplits,
          status: billStatus,
          updatedAt: new Date().toISOString()
        }
      }
    );

    const updatedBill = await bills.findOne({ id: billId });

    // ========== UPDATE CHAT MESSAGE WITH LATEST BILL DATA ==========
    try {
      const messages = db.collection('messages');
      
      // Find the original bill message
      const originalMessage = await messages.findOne({
        roomId: groupId,
        billId: billId
      });

      if (originalMessage) {
        // Calculate updated stats
        const paidCount = updatedBill.splits.filter(s => s.status === 'paid').length;
        const totalCount = updatedBill.splits.length;
        const paidAmount = updatedBill.splits
          .filter(s => s.status === 'paid')
          .reduce((sum, s) => sum + s.amount, 0);
        const paidPercentage = updatedBill.totalAmount > 0 ? (paidAmount / updatedBill.totalAmount) * 100 : 0;

        // Get payer name
        const paidByMember = updatedBill.splits.find(s => s.userId === updatedBill.paidBy);
        const paidByName = paidByMember?.userName || 'Someone';

        const currencySymbol = getCurrencySymbol(updatedBill.currency || 'USD');

        // Create updated bill message content
        const updatedBillMessage = `New Split Bill: ${updatedBill.title}\n Total: ${currencySymbol}${updatedBill.totalAmount.toFixed(2)}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

        // Update the message in database
        await messages.updateOne(
          { 
            roomId: groupId,
            billId: billId 
          },
          {
            $set: {
              content: updatedBillMessage,
              billData: {
                title: updatedBill.title,
                totalAmount: updatedBill.totalAmount,
                paidBy: updatedBill.paidBy,
                paidByName: paidByName,
                paidCount,
                totalCount,
                pendingCount: totalCount - paidCount,
                paidPercentage,
                splits: updatedBill.splits
              },
              updatedAt: new Date().toISOString()
            }
          }
        );

        console.log('📝 Chat message updated for bill:', billId);
      }
    } catch (msgError) {
      console.error('Error updating chat message:', msgError);
      // Don't fail the whole request if message update fails
    }

    return NextResponse.json({
      success: true,
      bill: updatedBill
    });

  } catch (error) {
    console.error('Error updating bill:', error);
    return NextResponse.json(
      { error: 'Failed to update bill' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bill (creator only) - HARD DELETE
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const billId = searchParams.get('billId');
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

    if (!billId || !userId || !groupId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const bills = db.collection('splitBills');
    const groups = db.collection('groups');

    // Find the bill
    const bill = await bills.findOne({ id: billId });
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator
    if (bill.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the bill creator can delete this bill' },
        { status: 403 }
      );
    }

    // HARD DELETE - completely remove from database
    await bills.deleteOne({ id: billId });

    // ========== UPDATE CHAT MESSAGE TO REMOVE BILL REFERENCE ==========
    try {
      const messages = db.collection('messages');
      
      // Either mark as deleted or remove the bill reference
      await messages.updateOne(
        { 
          roomId: groupId,
          billId: billId 
        },
        {
          $set: {
            billDeleted: true,
            deletedBy: userId,
            deletedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      );
    } catch (msgError) {
      console.error('Error updating deleted bill message:', msgError);
    }

    console.log('✅ Bill permanently deleted:', billId);

    return NextResponse.json({
      success: true,
      message: 'Bill deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}