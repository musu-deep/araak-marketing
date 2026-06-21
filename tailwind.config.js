/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Tajawal"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['"Tajawal"', '"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ألوان علامة أراك - درجات الأزرق المخضر (Teal) الفاخرة
        araak: {
          50: '#f0fbfc',
          100: '#daf5f8',
          200: '#b8ebf1',
          300: '#84dcdf',
          400: '#45c1c8',
          500: '#1ba6b0',
          600: '#0e8494',
          700: '#0e6a78',
          800: '#115462',
          900: '#134653',
          950: '#042c36',
        },
        gold: {
          50: '#fbf8ef',
          100: '#f6efd6',
          200: '#ecdfac',
          300: '#e0ca78',
          400: '#d4b44e',
          500: '#c89c2e',
          600: '#a87a23',
          700: '#875c1f',
          800: '#714a1f',
          900: '#603e1d',
          950: '#38200d',
        },
        sand: {
          50: '#fbf8f3',
          100: '#f4ede0',
          200: '#e9d8bd',
          300: '#dcbe92',
          400: '#cfa064',
          500: '#c68848',
          600: '#bb6e3b',
          700: '#9b5533',
          800: '#7d4530',
          900: '#673a2a',
          950: '#381d16',
        },
        navy: {
          50: '#f2f6fa',
          100: '#e6eef4',
          200: '#c5d8e3',
          300: '#95b8cc',
          400: '#5e93b1',
          500: '#3e7597',
          600: '#2f5d7d',
          700: '#284c66',
          800: '#263f54',
          900: '#233546',
          950: '#172330',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(15, 76, 92, 0.12)',
        'glass-lg': '0 20px 60px rgba(15, 76, 92, 0.18)',
        glow: '0 0 40px rgba(27, 166, 176, 0.35)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.18)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh': 'radial-gradient(at 0% 0%, rgba(14,132,148,0.25) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(200,156,46,0.12) 0px, transparent 50%), radial-gradient(at 90% 100%, rgba(35,53,70,0.3) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(14,132,148,0.15) 0px, transparent 50%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(27,166,176,0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(27,166,176,0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        countUp: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
