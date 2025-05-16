// layout.tsx - Server Component
import type { Metadata, Viewport } from "next";
import "~/app/globals.css";
import { Providers } from "./providers";
import { APP_URL, APP_NAME, APP_DESCRIPTION, MINI_APP_URL, getOGImageUrl } from "~/lib/constants";

// Generate timestamp for cache busting
const cacheBuster = new Date().getTime();

// Separate viewport export for Next.js 15
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
  userScalable: false,
  viewportFit: "cover"
};

// Metadata objesi
export const metadata: Metadata = {
  title: "Sperm Game",
  description: "The most epic casual game on Farcaster"
};

// Mini App embed için JSON yapısı - basitleştirilmiş
const frameEmbed = {
  appId: "spermgame",
  url: MINI_APP_URL,
  version: "1"
};

// Server Component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {  
  // Secure URL with cache busting
  const secureOGImage = getOGImageUrl();
  
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content={secureOGImage} />
        <meta property="fc:frame:button:1" content="Check this out" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content={MINI_APP_URL} />
        <meta property="fc:frame:post_url" content={`${APP_URL}/api/frames`} />
        <meta property="og:image" content={secureOGImage} />
        <meta property="og:title" content={APP_NAME} />
        <meta property="og:description" content={APP_DESCRIPTION} />
        <meta property="fc:frame:embed" content={JSON.stringify(frameEmbed)} />
      </head>
      <body style={{ 
        background: "linear-gradient(to bottom, #f472b6, #fb7bb5)",
        margin: 0,
        padding: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "fixed",
        width: "100%",
        height: "100%"
      }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
