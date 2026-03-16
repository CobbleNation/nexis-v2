import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ filename: string }> }
) {
    try {
        const { filename } = await params;
        if (!filename) return new NextResponse('Not Found', { status: 404 });

        // Security check to prevent directory traversal
        if (filename.includes('/') || filename.includes('..')) {
            return new NextResponse('Invalid filename', { status: 400 });
        }

        const filePath = join(process.cwd(), 'public/uploads', filename);

        if (!existsSync(filePath)) {
            return new NextResponse('Not Found', { status: 404 });
        }

        const buffer = await readFile(filePath);

        // Determine content type
        const ext = filename.split('.').pop()?.toLowerCase();
        const contentTypes: Record<string, string> = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'webp': 'image/webp',
            'gif': 'image/gif',
        };
        const contentType = contentTypes[ext || ''] || 'application/octet-stream';

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400, immutable',
            },
        });
    } catch (e) {
        console.error('Error serving file:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
