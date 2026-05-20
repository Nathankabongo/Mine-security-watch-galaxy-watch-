/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  basePath: '/Mine-security-watch-galaxy-watch-',
  assetPrefix: '/Mine-security-watch-galaxy-watch-',
}

export default nextConfig
