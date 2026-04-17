/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["pg", "@prisma/client", "@prisma/adapter-pg"],
  },
};


export default nextConfig;
