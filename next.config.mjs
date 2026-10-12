/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  // byranmedia.com/bylink 아래에서 돌아가도록 (바이란미디어 서버가 /bylink/* 를 이 앱으로 넘겨줌)
  basePath,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['byranmedia.com', 'www.byranmedia.com', 'bylink.me', 'localhost:4999'],
    },
  },
};

export default nextConfig;
