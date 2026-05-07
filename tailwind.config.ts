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
        // 오토링크 브랜드 컬러
        primary: {
          DEFAULT: '#f97316',
          dark: '#ea580c',
          soft: '#fff7ed',
        },
        text: {
          DEFAULT: '#111111',
          2: '#5e6066',
          3: '#9b9da3',
        },
        border: {
          DEFAULT: '#e5e5e7',
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
