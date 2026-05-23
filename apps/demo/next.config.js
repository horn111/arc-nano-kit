/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['viem'],
  },
};

module.exports = nextConfig;
