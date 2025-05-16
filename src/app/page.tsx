import { Metadata, Viewport } from "next";
import ClientWrapper from "~/components/ClientWrapper";
import { APP_NAME, APP_DESCRIPTION, APP_URL, MINI_APP_URL, getOGImageUrl } from "~/lib/constants";

export const revalidate = 300;

// Add separate viewport export for Next.js 15
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  // Güvenli HTTPS URL ile OG Image ve cache busting
  const ogImageUrl = getOGImageUrl();
  
  return {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    openGraph: {
      title: APP_NAME,
      description: APP_DESCRIPTION,
      images: [ogImageUrl],
    },
    other: {
      // Farcaster Frame meta etiketleri
      "fc:frame": "vNext",
      "fc:frame:image": ogImageUrl,
      "fc:frame:button:1": "Open",
      "fc:frame:button:1:action": "post_redirect", 
      "fc:frame:button:1:target": MINI_APP_URL,
      "fc:frame:post_url": `${APP_URL}/api/frames`,
      
      // Mini App embed için gerekli etiket - doğru format
      "fc:frame:embed": JSON.stringify({
        appId: "spermgame",
        url: MINI_APP_URL,
        version: "1"
      }),
      
      // Temel OG etiketleri
      "og:title": APP_NAME,
      "og:description": APP_DESCRIPTION,
      "og:image": ogImageUrl
    },
  };
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <ClientWrapper />
    </main>
  );
}
