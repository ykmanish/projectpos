// app/api/chat/itinerary/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET - Fetch itineraries for a group
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const itineraryId = searchParams.get('itineraryId');

    const client = await clientPromise;
    const db = client.db('positivity');
    const itineraries = db.collection('itineraries');

    if (itineraryId) {
      // Fetch specific itinerary
      const itinerary = await itineraries.findOne({ 
        _id: new ObjectId(itineraryId) 
      });
      
      if (!itinerary) {
        return NextResponse.json(
          { success: false, error: 'Itinerary not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        itinerary: {
          id: itinerary._id.toString(),
          ...itinerary,
          _id: undefined
        }
      });
    }

    // Fetch all itineraries for group
    const groupItineraries = await itineraries
      .find({ groupId })
      .sort({ startDate: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      itineraries: groupItineraries.map(i => ({
        id: i._id.toString(),
        ...i,
        _id: undefined
      }))
    });

  } catch (error) {
    console.error('Error fetching itineraries:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new itinerary
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      groupId, 
      title, 
      startDate, 
      endDate, 
      location,
      activities,
      createdBy,
      participants,
      notes,
      budget,
      currency
    } = body;

    if (!groupId || !title || !startDate || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const itineraries = db.collection('itineraries');

    const now = new Date().toISOString();

    const itinerary = {
      groupId,
      title,
      startDate,
      endDate: endDate || startDate,
      location: location || '',
      activities: activities || [],
      participants: participants || [],
      createdBy,
      notes: notes || '',
      budget: budget || null,
      currency: currency || 'USD',
      status: 'planned', // planned, ongoing, completed, cancelled
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      cancelledAt: null
    };

    const result = await itineraries.insertOne(itinerary);

    return NextResponse.json({
      success: true,
      itinerary: {
        id: result.insertedId.toString(),
        ...itinerary,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error creating itinerary:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an itinerary
export async function PUT(request) {
  try {
    const body = await request.json();
    const { 
      itineraryId, 
      title, 
      startDate, 
      endDate, 
      location,
      activities,
      participants,
      notes,
      budget,
      currency,
      status,
      updatedBy
    } = body;

    if (!itineraryId) {
      return NextResponse.json(
        { success: false, error: 'Itinerary ID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const itineraries = db.collection('itineraries');

    const updateData = {
      ...(title && { title }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(location !== undefined && { location }),
      ...(activities && { activities }),
      ...(participants && { participants }),
      ...(notes !== undefined && { notes }),
      ...(budget !== undefined && { budget }),
      ...(currency && { currency }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString();
    }

    const result = await itineraries.updateOne(
      { _id: new ObjectId(itineraryId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const updatedItinerary = await itineraries.findOne({ 
      _id: new ObjectId(itineraryId) 
    });

    return NextResponse.json({
      success: true,
      itinerary: {
        id: updatedItinerary._id.toString(),
        ...updatedItinerary,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error updating itinerary:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update itinerary status
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { itineraryId, status, userId } = body;

    if (!itineraryId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const itineraries = db.collection('itineraries');

    const updateData = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString();
    }

    const result = await itineraries.updateOne(
      { _id: new ObjectId(itineraryId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    const updatedItinerary = await itineraries.findOne({ 
      _id: new ObjectId(itineraryId) 
    });

    return NextResponse.json({
      success: true,
      itinerary: {
        id: updatedItinerary._id.toString(),
        ...updatedItinerary,
        _id: undefined
      }
    });

  } catch (error) {
    console.error('Error updating itinerary status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete an itinerary
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itineraryId = searchParams.get('itineraryId');
    const groupId = searchParams.get('groupId');
    const userId = searchParams.get('userId');

    if (!itineraryId) {
      return NextResponse.json(
        { success: false, error: 'Itinerary ID required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const itineraries = db.collection('itineraries');

    const result = await itineraries.deleteOne({ 
      _id: new ObjectId(itineraryId) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Itinerary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Itinerary deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting itinerary:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}