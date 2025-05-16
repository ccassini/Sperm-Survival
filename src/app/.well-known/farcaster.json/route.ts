import { NextResponse } from 'next/server';

export async function GET() {
  // Farcaster frame manifest with updated signature
  const farcasterManifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    frame: {
      version: "1",
      name: "Sperm Game",
      iconUrl: "https://spermgame.vercel.app/icon.png",
      homeUrl: "https://spermgame.vercel.app",
      imageUrl: "https://spermgame.vercel.app/image.png",
      buttonTitle: "Check this out",
      splashImageUrl: "https://spermgame.vercel.app/splash.png",
      splashBackgroundColor: "#eeccff",
      webhookUrl: "https://spermgame.vercel.app/api/webhook",
      redirect_uris: ["https://spermfarcaster-app.vercel.app"]
    }
  };

  return NextResponse.json(farcasterManifest);
}
