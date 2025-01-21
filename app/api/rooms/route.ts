import { NextResponse } from 'next/server';
import { rooms } from '@/db/schema';
import { db } from '@/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageurl, roomtype, designtype, additionalreq } = body;

    const newRoom = await db.insert(rooms).values({
      imageurl,
      roomtype,
      designtype,
      additionalreq,
    }).returning();

    return NextResponse.json(newRoom[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}