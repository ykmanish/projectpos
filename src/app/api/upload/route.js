import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
    const validTypes = [...validImageTypes, ...validVideoTypes];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and videos are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const originalName = file.name;
    const fileExtension = path.extname(originalName);
    const fileName = `${uuidv4()}${fileExtension}`;
    
    // Create user-specific directory
    const uploadDir = path.join(process.cwd(), 'public/uploads', userId);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Determine file type category
    let fileCategory = 'other';
    if (validImageTypes.includes(file.type)) fileCategory = 'image';
    if (validVideoTypes.includes(file.type)) fileCategory = 'video';

    // Return the public URL
    const fileUrl = `/uploads/${userId}/${fileName}`;

    console.log('✅ File uploaded successfully:', {
      url: fileUrl,
      type: file.type,
      category: fileCategory,
      size: file.size
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      type: file.type,
      category: fileCategory,
      name: originalName,
      size: file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file: ' + error.message },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};