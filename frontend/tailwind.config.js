/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vigil: {
          bg: '#010204',
          cyan: '#00F2FF',
          amethyst: '#7000FF',
          crimson: '#FF3131',
          blood: '#FF4500',
          glass: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      animation: {
        'scanline': 'scanline 8s linear infinite',
        'breathe-cyan': 'breathe-cyan 3s ease-in-out infinite',
        'dim-pulse': 'dim-pulse 4s ease-in-out infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'breathe-cyan': {
          '0%, 100%': { boxShadow: '0 0 5px 0px rgba(0, 242, 255, 0.05)' },
          '50%': { boxShadow: '0 0 15px 2px rgba(0, 242, 255, 0.2)' },
        },
        'dim-pulse': {
          '0%, 100%': { opacity: 0.3, textShadow: '0 0 0px rgba(0, 242, 255, 0)' },
          '50%': { opacity: 0.8, textShadow: '0 0 8px rgba(0, 242, 255, 0.5)' },
        }
      }
    },
  },
  plugins: [],
}
