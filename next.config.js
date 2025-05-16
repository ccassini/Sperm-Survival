/** @type {import('next').NextConfig} */
const nextConfig = {
  // ESLint configuration
  eslint: {
    // Ignore warnings during builds
    ignoreDuringBuilds: true,
  },
  // TypeScript error handling
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable React strict mode
  reactStrictMode: false,
  // Add support for images from any domain for development
  images: {
    domains: ['localhost', 'spermgame.vercel.app', 'spermfarcaster-app.vercel.app'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  // Optimize for better performance
  poweredByHeader: false,
  // Handle .well-known directory correctly
  async rewrites() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: '/api/well-known/farcaster',
      },
    ];
  }
};

module.exports = nextConfig;