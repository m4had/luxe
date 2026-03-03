/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['images.unsplash.com', 'via.placeholder.com'] },
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: 'http://localhost:4000/api/v1/:path*' }];
  },
};
module.exports = nextConfig;
