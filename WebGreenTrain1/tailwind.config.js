/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'train': {
          '50': '#f0f7f0',
          '100': '#e0efe0',
          '200': '#c1dfc1',
          '300': '#a2cfa2',
          '400': '#83bf83',
          '500': '#64af64',
          '600': '#4caf50',
          '700': '#3d8b40',
          '800': '#2e7d32',
          '900': '#1b5e20',
          '950': '#0d3817',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      animation: {
        'train-move': 'train-move 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'train-move': {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(10px)' },
        },
      },
      backgroundImage: {
        'train-gradient': 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #4caf50 100%)',
      },
    },
  },
  plugins: [],
};

