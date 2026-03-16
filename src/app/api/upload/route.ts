import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth-utils';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('access_token')?.value;

        if (!token) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const payload = await verifyJWT(token);
        if (!payload || !payload.userId) {
            return NextResponse.json({ success: false, message: 'Invalid Token' }, { status: 401 });
        }

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
