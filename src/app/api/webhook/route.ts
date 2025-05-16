import { NextRequest, NextResponse } from "next/server";
import { APP_URL, APP_OG_IMAGE_URL } from "~/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Received webhook:", body);
    
    // Handle frame action from Farcaster
    // The button could be "Start Game" or similar
    
    return NextResponse.json(
      {
        message: "Success",
        frame: {
          image: APP_OG_IMAGE_URL,
          version: "vNext",
          buttons: [
            {
              label: "Open",
              action: "link",
              target: APP_URL
            }
          ]
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
