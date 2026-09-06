/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          // Somaiya-inspired maroon palette
          primary: '#A51C30',
          'primary-dark': '#8F1728',
          'primary-light': '#F5E7EA',
          // Institutional info (Somaiya blue)
          blue: '#3B6EA5',
          // Neutral surfaces
          surface: '#F7F7F7',
          'light-bg': '#FFFFFF',
          'light-card': '#FFFFFF',
          'light-card-hover': '#FAFAFA',
          'light-border': '#E5E5E5',
          'light-border-strong': '#C8C8C8',
          // Status colors (institutional)
          green: '#16855B',
          yellow: '#B7791F',
          red: '#B42318',
          // Dark mode surfaces (preserved)
          dark: '#0a0a0a',
          darker: '#050505',
          card: '#1a1a2a',
        },
        // Override default Tailwind blue → Somaiya maroon (brand primary)
        blue: {
          50: '#FDE2E4',
          100: '#F9CFCF',
          200: '#F0A1A7',
          300: '#E07A7A',
          400: '#A51C30',
          500: '#8F1728',
          600: '#7A1419',
          700: '#640D10',
          800: '#4D0709',
          900: '#350203',
        },
        // Override default Tailwind purple → neutral gray (secondary accents)
        purple: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          200: '#D1D5DB',
          300: '#9CA3AF',
          400: '#6B7280',
          500: '#4B5563',
          600: '#6B7280',
          700: '#4B5563',
          800: '#374151',
          900: '#1F2937',
        },
        // Override default Tailwind green → institutional success
        green: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#4ADE80',
          500: '#16855B',
          600: '#0E6942',
          700: '#0C5A36',
          800: '#0D4D34',
          900: '#0A3D2B',
        },
        // Override default Tailwind emerald → institutional success
        emerald: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#4ADE80',
          500: '#16855B',
          600: '#0E6942',
          700: '#0C5A36',
          800: '#0D4D34',
          900: '#0A3D2B',
        },
        // Override default Tailwind amber → institutional warning
        amber: {
          50: '#FFF8E1',
          100: '#FFF3E0',
          200: '#FFE0B2',
          300: '#FFC107',
          400: '#FFA726',
          500: '#B7791F',
          600: '#F18907',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#FF6F00',
        },
        // Override default Tailwind yellow → institutional warning
        yellow: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FACC15',
          400: '#EAB308',
          500: '#B7791F',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#783A09',
        },
        // Override default Tailwind red → institutional error
        red: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#B42318',
          600: '#991C1B',
          700: '#7F1D1D',
          800: '#6B1411',
          900: '#590B0B',
        },
        // Override default Tailwind pink → neutral
        pink: {
          50: '#FFF5F5',
          100: '#FFE4E4',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#FB6C6C',
          500: '#B42318',
          600: '#991C1B',
          700: '#7F1D1D',
          800: '#6B1411',
          900: '#590B0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
