import { NextResponse } from "next/server";
import { rooms } from "@/db/schema";
import { db } from "@/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageurl, roomtype, designtype, additionalreq, userEmail } = body;

    const newRoom = await db
      .insert(rooms)
      .values({
        image_url: imageurl,
        transformed_image_url: "",
        room_type: roomtype,
        design_type: designtype,
        additional_requirements: additionalreq,
        user_email: userEmail,
      })
      .returning();

    return NextResponse.json(newRoom[0]);
  } catch (error) {
    console.error("Failed to create room", error);
    return NextResponse.json(
      { message: "Failed to create room" },
      { status: 500 }
    );
  }
}
