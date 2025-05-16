import { NextRequest, NextResponse } from 'next/server';
import { APP_URL, APP_NAME, APP_DESCRIPTION, APP_OG_IMAGE_URL, MINI_APP_URL, getOGImageUrl } from '~/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const buttonIndex = formData.get('untrustedData.buttonIndex');
    const fid = formData.get('trustedData.messageBytes') ? 'authenticated' : 'unauthenticated';
    
    // Cache busting ile güvenli image URL'i
    const secureImageUrl = getOGImageUrl();
    
    // Define actions based on button index
    let redirectUrl = MINI_APP_URL; // Use MINI_APP_URL for better Mini App preview handling
    let buttonText = "Open";
    let image = secureImageUrl;
    let message = "Let's play!";
    
    if (buttonIndex === '1') {
      // Instead of returning a 302 redirect, we use post_redirect action
      // This is important for Mini App Preview to work correctly
      return new Response(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>${APP_NAME}</title>
            <meta property="og:title" content="${APP_NAME}" />
            <meta property="og:description" content="${APP_DESCRIPTION}" />
            <meta property="og:image" content="${image}" />
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${image}" />
            <meta property="fc:frame:button:1" content="${buttonText}" />
            <meta property="fc:frame:post_url" content="${APP_URL}/api/frames" />
            <meta property="fc:frame:button:1:action" content="post_redirect" />
            <meta property="fc:frame:button:1:target" content="${redirectUrl}" />
            <meta property="fc:frame:embed" content='{"appId":"spermgame","url":"${MINI_APP_URL}","version":"vNext"}' />
          </head>
          <body>
            <h1>${APP_NAME}</h1>
            <p>${message}</p>
            <script>
              // Auto-redirect for web browsers
              window.location.href = "${redirectUrl}";
            </script>
          </body>
        </html>`,
        {
          headers: {
            'Content-Type': 'text/html',
          },
        }
      );
    } else if (buttonIndex === '2') {
      // Leaderboard button
      redirectUrl = `${APP_URL}/leaderboard`;
      buttonText = "Open";
      message = "Check out the leaderboard!";
    }
    
    // Return HTML with proper frame meta tags
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>${APP_NAME}</title>
          <meta property="og:title" content="${APP_NAME}" />
          <meta property="og:description" content="${APP_DESCRIPTION}" />
          <meta property="og:image" content="${image}" />
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${image}" />
          <meta property="fc:frame:button:1" content="${buttonText}" />
          <meta property="fc:frame:post_url" content="${APP_URL}/api/frames" />
          <meta property="fc:frame:button:1:action" content="post_redirect" />
          <meta property="fc:frame:button:1:target" content="${redirectUrl}" />
          <meta property="fc:frame:embed" content='{"appId":"spermgame","url":"${MINI_APP_URL}","version":"vNext"}' />
        </head>
        <body>
          <h1>${APP_NAME}</h1>
          <p>${message}</p>
        </body>
      </html>`,
      {
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    console.error('Error in frames route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  // Cache busting ile güvenli image URL'i
  const secureImageUrl = getOGImageUrl();
  
  // Basic HTML structure for a Frame with proper meta tags
  return new Response(
    `<!DOCTYPE html>
    <html>
      <head>
        <title>${APP_NAME}</title>
        <meta property="og:title" content="${APP_NAME}" />
        <meta property="og:description" content="${APP_DESCRIPTION}" />
        <meta property="og:image" content="${secureImageUrl}" />
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${secureImageUrl}" />
        <meta property="fc:frame:button:1" content="Open" />
        <meta property="fc:frame:button:1:action" content="post_redirect" />
        <meta property="fc:frame:button:1:target" content="${MINI_APP_URL}" />
        <meta property="fc:frame:button:2" content="Leaderboard" />
        <meta property="fc:frame:post_url" content="${APP_URL}/api/frames" />
        <meta property="fc:frame:embed" content='{"appId":"spermgame","url":"${MINI_APP_URL}","version":"vNext"}' />
      </head>
      <body>
        <h1>${APP_NAME}</h1>
        <p>This is a Farcaster Frame for the ${APP_NAME} game.</p>
      </body>
    </html>`,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
} 