/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      runtime: 'experimental-edge',
    },
    reactStrictMode: true,
    swcMinify: true,
  };

export default nextConfig;
