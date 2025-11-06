import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  // Compression
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,

  // Trailing slash for better SEO
  trailingSlash: false,

  // Strict mode for better React practices
  reactStrictMode: true,

  // PoweredBy header removal for security
  poweredByHeader: false,

  // Enable experimental features
  experimental: {
    optimizeCss: true, // Optimize CSS loading
  },
};

export default nextConfig;
