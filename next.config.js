/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Disable prerendering completely to avoid context issues
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async generateBuildId() {
    return "build-" + Date.now();
  },
  // allowedDevOrigins: [
  //   "b622dc178809418abc65fe2ebec69108-b88d5d526d3548389438554db.fly.dev",
  // ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
    ],
  },
  // Dev optimizations to reduce overlay errors
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
  // Reduce fast refresh sensitivity
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce HMR update frequency to prevent abort errors
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 300,
        poll: 1000,
      };
    }
    return config;
  },
  async rewrites() {
    // Use Next.js API routes - no external backend needed
    return [];
  },
};

module.exports = nextConfig;
