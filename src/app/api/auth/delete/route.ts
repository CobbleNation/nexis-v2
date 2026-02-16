import { NextResponse } from 'next/server';

export async function POST() {
    // In a real app, delete user from DB.
    return NextResponse.json({ success: true });
}
