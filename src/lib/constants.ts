export const APP_URL = process.env.NEXT_PUBLIC_URL || "https://spermgame.vercel.app";
export const APP_NAME = "Sperm Game";
export const APP_DESCRIPTION = "The most epic sperm survival game on Farcaster!";
export const APP_PRIMARY_CATEGORY = "Games";
export const APP_TAGS = ["game", "arcade", "survival"];
export const APP_ICON_URL = `${APP_URL}/icon.png`;

// Cache busting ile image URL fonksiyonu 
export const getOGImageUrl = () => {
  const cacheBuster = new Date().getTime();
  return `${APP_URL}/image.png?v=${cacheBuster}`;
};

export const APP_OG_IMAGE_URL = `${APP_URL}/image.png`;
export const APP_SPLASH_URL = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR = "#eeccff"; // Updated to match manifest
export const APP_BUTTON_TEXT = "Check this out";

// Mini App specific URL to prevent black screen
export const MINI_APP_URL = `${APP_URL}/mini-app`;

export const APP_WEBHOOK_URL = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID 
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;
