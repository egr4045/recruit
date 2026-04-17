/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  },
};

export default nextConfig;
