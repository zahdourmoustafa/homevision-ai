import { users } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";

interface ClerkUser {
  primaryEmailAddress: {
    emailAddress: string;
  };
  fullName?: string;
  profileImageUrl?: string;
}

export async function POST(req: Request) {
  console.log("POST request received");
  const { user }: { user: ClerkUser } = await req.json();
  console.log("Received user data:", user);

  try {
    // Check if user exists
    const userInfo = await db
      .select()
      .from(users)
      .where(eq(users.email, user.primaryEmailAddress.emailAddress));
    console.log("Database query result:", userInfo);

    if (userInfo?.length === 0) {
      console.log("Creating new user");
      const SaveResult = await db
        .insert(users)
        .values({
          email: user.primaryEmailAddress.emailAddress,
          name: user.fullName || "",
          imageurl: user.profileImageUrl || "",
        })
        .returning({
          email: users.email,
          name: users.name,
          imageurl: users.imageurl,
        });

      console.log("New user created:", SaveResult[0]);
      return NextResponse.json(
        {
          status: "success",
          result: SaveResult[0],
        },
        {
          status: 201,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("Existing user found:", userInfo[0]);
    return NextResponse.json(
      {
        status: "success",
        result: userInfo[0],
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.error("Error occurred:", e);
    return NextResponse.json(
      {
        status: "error",
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
