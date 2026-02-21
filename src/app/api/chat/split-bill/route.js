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
      status: { $ne: 'cancelled' }
    };
    
    if (billId) {
      query.id = billId;
      const bill = await bills.findOne(query);
      return NextResponse.json({
        success: true,
        bill
      });
    }

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
// app/api/chat/split-bill/route.js - Update the POST method

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
    const messages = db.collection('messages');

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
    const now = new Date().toISOString();

    const bill = {
      id,
      groupId,
      title: billTitle,
      totalAmount: parseFloat(totalAmount),
      currency,
      paidBy,
      splits: splits.map(split => ({
        ...split,
        userId: split.userId,
        userName: split.userName,
        amount: parseFloat(split.amount),
        currency: split.currency || currency,
        status: split.userId === paidBy ? 'paid' : 'pending',
        updatedAt: now
      })),
      createdBy,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    const result = await bills.insertOne(bill);

    // Calculate stats for chat message
    const paidCount = bill.splits.filter(s => s.status === 'paid').length;
    const totalCount = bill.splits.length;
    const paidAmount = bill.splits
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + s.amount, 0);
    const paidPercentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    // Get payer name
    const paidByMember = bill.splits.find(s => s.userId === paidBy);
    const paidByName = paidByMember?.userName || 'Someone';

    const currencySymbol = getCurrencySymbol(currency);

    // Create the bill message content
    const billMessage = `New Split Bill: ${billTitle}\nTotal: ${currencySymbol}${totalAmount.toFixed(2)}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

    // Create message data for chat with complete bill data
    const messageData = {
      roomId: groupId,
      senderId: createdBy,
      senderName: paidByName,
      receiverId: "group",
      isGroupMessage: true,
      content: billMessage,
      encryptedContent: null,
      attachments: [],
      replyTo: null,
      timestamp: now,
      delivered: false,
      deliveredAt: null,
      read: false,
      readBy: [createdBy],
      reactions: [],
      isEncrypted: false,
      billId: id,
      billCurrency: currency,
      billData: {
        id: id,
        title: billTitle,
        totalAmount: parseFloat(totalAmount),
        paidBy: paidBy,
        paidByName: paidByName,
        paidCount: paidCount,
        totalCount: totalCount,
        pendingCount: totalCount - paidCount,
        paidPercentage: paidPercentage,
        splits: bill.splits,
        currency: currency,
        createdAt: now,
        createdBy: createdBy,
        status: 'active'
      },
      billCreatedAt: now,
      billCreatedBy: createdBy,
      billStatus: 'active'
    };

    // Save the message to database
    await messages.insertOne(messageData);

    // Update group's last activity
    await groups.updateOne(
      { groupId },
      { 
        $set: { 
          lastActivity: now,
          updatedAt: now
        },
        $inc: { totalBills: 1 }
      }
    );

    console.log('✅ Split bill created and message saved:', id);

    // Emit socket event for real-time update (if socket.io is available)
    // This should be handled by your socket server separately
    // The socket server should listen for database changes or you can call it from here
    // For now, we'll just return the bill and let the frontend handle it

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
    const messages = db.collection('messages');

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

    const now = new Date().toISOString();

    // Prepare updated bill
    const updatedBill = {
      ...existingBill,
      title: billTitle,
      totalAmount: parseFloat(totalAmount),
      currency,
      paidBy,
      splits: splits.map(split => ({
        ...split,
        userId: split.userId,
        userName: split.userName,
        amount: parseFloat(split.amount),
        currency: split.currency || currency,
        status: split.userId === paidBy ? 'paid' : (split.status || 'pending'),
        updatedAt: now
      })),
      updatedAt: now,
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
    const updatedBillMessage = `New Split Bill: ${finalBill.title}\nTotal: ${currencySymbol}${finalBill.totalAmount.toFixed(2)}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

    // Update the message in database with complete bill data
    await messages.updateOne(
      { 
        roomId: groupId,
        billId: billId 
      },
      {
        $set: {
          content: updatedBillMessage,
          billData: {
            id: finalBill.id,
            title: finalBill.title,
            totalAmount: finalBill.totalAmount,
            paidBy: finalBill.paidBy,
            paidByName: paidByName,
            paidCount,
            totalCount,
            pendingCount: totalCount - paidCount,
            paidPercentage,
            splits: finalBill.splits,
            currency: finalBill.currency,
            createdAt: finalBill.createdAt,
            createdBy: finalBill.createdBy,
            status: finalBill.status
          },
          billCurrency: finalBill.currency,
          billStatus: finalBill.status,
          updatedAt: now
        }
      }
    );

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
    const messages = db.collection('messages');

    // Find the bill
    const bill = await bills.findOne({ id: billId });
    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    // Update the specific split
    const updatedSplits = bill.splits.map(split => {
      if (split.userId === splitUserId) {
        return {
          ...split,
          status,
          updatedAt: now
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
          updatedAt: now
        }
      }
    );

    const updatedBill = await bills.findOne({ id: billId });

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
    const updatedBillMessage = `New Split Bill: ${updatedBill.title}\nTotal: ${currencySymbol}${updatedBill.totalAmount.toFixed(2)}\nPaid by: ${paidByName}\nPending payments: ${totalCount - paidCount} people\n\nUse /split to view or pay bills`;

    // Update the message in database with complete bill data
    await messages.updateOne(
      { 
        roomId: groupId,
        billId: billId 
      },
      {
        $set: {
          content: updatedBillMessage,
          billData: {
            id: updatedBill.id,
            title: updatedBill.title,
            totalAmount: updatedBill.totalAmount,
            paidBy: updatedBill.paidBy,
            paidByName: paidByName,
            paidCount,
            totalCount,
            pendingCount: totalCount - paidCount,
            paidPercentage,
            splits: updatedBill.splits,
            currency: updatedBill.currency,
            createdAt: updatedBill.createdAt,
            createdBy: updatedBill.createdBy,
            status: updatedBill.status
          },
          billCurrency: updatedBill.currency,
          billStatus: updatedBill.status,
          updatedAt: now
        }
      }
    );

    console.log('✅ Split bill updated:', billId);

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
    const messages = db.collection('messages');

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

    // Update the message to show it's deleted
    await messages.updateOne(
      { 
        roomId: groupId,
        billId: billId 
      },
      {
        $set: {
          billDeleted: true,
          billCancelled: true,
          cancelledBy: userId,
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );

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