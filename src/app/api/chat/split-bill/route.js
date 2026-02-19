// app/api/chat/split-bill/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { customAlphabet } from 'nanoid';

const generateBillId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// GET - Fetch bills for a group
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

    let query = { groupId };
    
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
      paidBy,
      splits: splits.map(split => ({
        ...split,
        status: split.userId === paidBy ? 'paid' : 'pending',
        updatedAt: new Date().toISOString()
      })),
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active' // 'active', 'settled', 'cancelled'
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

    console.log('✅ Split bill created:', id);

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

    // Emit socket event for real-time update (if needed)
    try {
      const { getIO } = require('@/lib/socket');
      const io = getIO();
      if (io && groupId) {
        io.to(groupId).emit('bill-updated', {
          billId,
          splitUserId,
          status,
          bill: updatedBill,
          timestamp: new Date().toISOString()
        });
      }
    } catch (socketError) {
      console.log('Socket.io not available:', socketError);
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

// DELETE - Delete a bill (admin only)
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

    // Check if user is admin or bill creator
    const group = await groups.findOne({ groupId });
    const isAdmin = group?.members?.some(m => m.userId === userId && m.role === 'admin');
    
    if (!isAdmin && bill.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this bill' },
        { status: 403 }
      );
    }

    // Soft delete - mark as cancelled
    await bills.updateOne(
      { id: billId },
      {
        $set: {
          status: 'cancelled',
          cancelledBy: userId,
          cancelledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Bill cancelled successfully'
    });

  } catch (error) {
    console.error('Error deleting bill:', error);
    return NextResponse.json(
      { error: 'Failed to delete bill' },
      { status: 500 }
    );
  }
}