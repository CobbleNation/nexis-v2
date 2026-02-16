import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure uploads directory exists
        const uploadDir = join(process.cwd(), 'public/uploads');
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore error if directory exists
        }

        // Generate unique filename
        const originalName = file.name;
        const extension = originalName.split('.').pop();
        const fileName = `${uuidv4()}.${extension}`;
        const filePath = join(uploadDir, fileName);

        // Write file
        await writeFile(filePath, buffer);

        // Calculate size in KB/MB
        const sizeBytes = file.size;
        let sizeStr = '';
        if (sizeBytes < 1024 * 1024) {
            sizeStr = `${Math.round(sizeBytes / 1024)} KB`;
        } else {
            sizeStr = `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
        }

        const url = `/uploads/${fileName}`;

        return NextResponse.json({
            success: true,
            url,
            size: sizeStr,
            message: 'File uploaded successfully'
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
    }
}
