import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // the video pages (public/videos/<id>/) are plain HTML + scripts that run on their own clock; they are served as-is
  images: {
    // thumbnails and site previews are already WebP (npm run webp); next/image only resizes them for the cards
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  // addresses of the earlier static version (index.html / watch.html?v=<id>)
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/watch.html', has: [{ type: 'query', key: 'v', value: '(?<v>[a-z0-9-]+)' }], destination: '/watch/:v', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        // the video pages and their snapshots / assets never change between deploys of the same build
        source: '/videos/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' }],
      },
    ];
  },
};

export default nextConfig;
