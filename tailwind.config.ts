import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "sans-serif",
        ],
      },
      keyframes: {
        // ✨ [New] 투명했다가 아래서부터 색이 차오르는 애니메이션
        waterFill: {
          "0%": { backgroundPosition: "0% 0%" }, // 위쪽(투명)을 보여줌
          "100%": { backgroundPosition: "0% 100%" }, // 아래쪽(색상)으로 이동
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        // 1.5초 동안 물이 차오름
        "water-fill": "waterFill 1.5s ease-out forwards",
        "fade-in": "fadeIn 1s ease-out forwards",
        "fade-out": "fadeOut 0.5s ease-in forwards",
      },
    },
  },
  plugins: [],
};
export default config;
