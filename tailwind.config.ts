import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // By링크 브랜드 컬러 (흑백 톤)
        primary: {
          DEFAULT: '#111111',
          dark: '#000000',
          soft: '#f4f4f5',
        },
        text: {
          DEFAULT: '#111111',
          2: '#5e6066',
          3: '#9b9da3',
        },
        border: {
          DEFAULT: '#e6e6e8',
        },
        // By링크 고유 톤: 먹색 + 체리(바이란미디어 포인트 레드)
        ink: '#171717',
        mist: '#f5f5f6',
        line: '#e6e6e8',
        cherry: {
          DEFAULT: '#fc1c49',
          soft: '#ffedf1',
          dark: '#d90f39',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
