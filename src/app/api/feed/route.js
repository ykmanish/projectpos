import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');
    const users = db.collection('users');

    // Get posts from last 30 days, sorted by newest first
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const posts = await feedPosts
      .find({
        timestamp: { $gte: thirtyDaysAgo }
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    // Get all unique user IDs from posts
    const userIds = [...new Set(posts.map(post => post.userId))];
    
    // Fetch user data for all these users to get usernames and additional info
    const userData = await users.find(
      { userId: { $in: userIds } },
      { 
        projection: { 
          userId: 1, 
          username: 1,
          name: 1,
          avatar: 1,
          history: 1,
          createdAt: 1 
        } 
      }
    ).toArray();
    
    // Create maps for user data
    const usernameMap = {};
    const userStatsMap = {};
    
    userData.forEach(user => {
      usernameMap[user.userId] = user.username;
      
      // Calculate user stats
      const totalReflections = user.history?.filter(h => h.type === 'daily').length || 0;
      const daysOnPlatform = Math.ceil(
        (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
      ) || 1;
      
      userStatsMap[user.userId] = {
        totalReflections,
        daysOnPlatform
      };
    });

    // Format posts for response with correct usernames and attachments
    const formattedPosts = posts.map(post => {
      // Get username from the map, or use the post's userUsername, or null
      const username = usernameMap[post.userId] || post.userUsername || null;
      const userStats = userStatsMap[post.userId] || { totalReflections: 0, daysOnPlatform: 1 };
      
      // Process attachments to ensure they're properly formatted
      const processedAttachments = (post.attachments || []).map(att => {
        // Ensure each attachment has the correct structure
        return {
          id: att.id || `${Date.now()}-${Math.random()}`,
          type: att.type || 'link',
          url: att.url || '',
          name: att.name || null,
          mimeType: att.mimeType || null,
          preview: att.preview || null,
          uploadedAt: att.uploadedAt || post.timestamp
        };
      });

      // Process comments to ensure they have all fields
      const processedComments = (post.comments || []).map(comment => ({
        ...comment,
        id: comment.id || `${Date.now()}-${Math.random()}`,
        likes: comment.likes || [],
        likeCount: comment.likes?.length || 0,
        replies: (comment.replies || []).map(reply => ({
          ...reply,
          id: reply.id || `${Date.now()}-${Math.random()}`,
          likes: reply.likes || [],
          likeCount: reply.likes?.length || 0
        }))
      }));

      return {
        ...post,
        _id: post._id.toString(),
        userUsername: username,
        userTotalReflections: userStats.totalReflections,
        userDaysOnPlatform: userStats.daysOnPlatform,
        attachments: processedAttachments,
        comments: processedComments,
        likes: post.likes || [],
        likeCount: post.likes?.length || 0,
        commentCount: post.commentCount || processedComments.length || 0,
      };
    });

    return NextResponse.json({
      success: true,
      posts: formattedPosts
    });

  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { 
      userId, 
      reflection, 
      goodDeed, 
      userName, 
      userUsername, 
      userAvatar,
      attachments // New field for attachments
    } = await request.json();

    // Validate required fields
    if (!userId || !reflection || !goodDeed) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');
    const users = db.collection('users');

    // Get the user's current data from the users collection
    const user = await users.findOne(
      { userId },
      { 
        projection: { 
          username: 1, 
          name: 1,
          avatar: 1,
          history: 1,
          createdAt: 1 
        } 
      }
    );

    // Parse avatar if it's a string
    let parsedAvatar = userAvatar;
    if (userAvatar && typeof userAvatar === 'string') {
      try {
        parsedAvatar = JSON.parse(userAvatar);
      } catch (e) {
        console.error('Failed to parse avatar in feed POST:', e);
      }
    }

    // Process attachments to ensure they're properly formatted
    const processedAttachments = (attachments || []).map(att => {
      // Validate each attachment
      if (!att.type || !att.url) {
        console.warn('Invalid attachment skipped:', att);
        return null;
      }

      // For links, ensure preview data is present
      if (att.type === 'link' && !att.preview) {
        att.preview = {
          title: att.url,
          url: att.url
        };
      }

      return {
        id: att.id || `${Date.now()}-${Math.random()}`,
        type: att.type,
        url: att.url,
        name: att.name || null,
        mimeType: att.mimeType || null,
        preview: att.preview || null,
        uploadedAt: new Date().toISOString()
      };
    }).filter(Boolean); // Remove any null entries

    // Calculate user stats for the post
    const totalReflections = user?.history?.filter(h => h.type === 'daily').length || 0;
    const daysOnPlatform = Math.ceil(
      (new Date() - new Date(user?.createdAt || Date.now())) / (1000 * 60 * 60 * 24)
    ) || 1;

    // Use the username from the database if available, otherwise use the provided one
    const finalUsername = user?.username || userUsername || null;

    // Create the new post object
    const newPost = {
      userId,
      userName: userName || user?.name || 'Anonymous',
      userUsername: finalUsername,
      userAvatar: parsedAvatar || user?.avatar || null,
      reflection: reflection.trim(),
      goodDeed,
      attachments: processedAttachments,
      likes: [],
      comments: [],
      timestamp: new Date(),
      createdAt: new Date(),
      userTotalReflections: totalReflections,
      userDaysOnPlatform: daysOnPlatform
    };

    // Insert the post into the database
    const result = await feedPosts.insertOne(newPost);

    // Format the response
    const formattedPost = {
      ...newPost,
      _id: result.insertedId.toString(),
      likeCount: 0,
      commentCount: 0,
      attachments: processedAttachments
    };

    return NextResponse.json({
      success: true,
      post: formattedPost
    });

  } catch (error) {
    console.error('Error creating feed post:', error);
    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE endpoint for removing posts (optional)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const userId = searchParams.get('userId');

    if (!postId || !userId) {
      return NextResponse.json(
        { error: 'postId and userId required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');

    // Only allow users to delete their own posts
    const result = await feedPosts.deleteOne({
      _id: new ObjectId(postId),
      userId: userId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PATCH endpoint for updating posts (optional)
export async function PATCH(request) {
  try {
    const { postId, userId, updates } = await request.json();

    if (!postId || !userId || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('positivity');
    const feedPosts = db.collection('feedPosts');

    // Only allow users to update their own posts
    const result = await feedPosts.updateOne(
      { _id: new ObjectId(postId), userId: userId },
      { 
        $set: {
          ...updates,
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch and return the updated post
    const updatedPost = await feedPosts.findOne({ _id: new ObjectId(postId) });

    return NextResponse.json({
      success: true,
      post: {
        ...updatedPost,
        _id: updatedPost._id.toString()
      }
    });

  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}