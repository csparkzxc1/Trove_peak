/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: '#FAF6EE', dark: '#F2EBDD' },
        navy: { DEFAULT: '#0F2E4C', dark: '#082139' },
        gold: { DEFAULT: '#C9A961', dark: '#B8954E' },
        ink: '#1A1A1A',
        stone: { DEFAULT: '#8A8475', light: '#B8AF9A' },
        line: 'rgba(15, 46, 76, 0.12)',
      },
      fontFamily: {
        serifKr: ['NotoSerifKR-Medium'],
        serifKrBold: ['NotoSerifKR-Bold'],
        serifEn: ['CormorantGaramond-Medium'],
        serifEnItalic: ['CormorantGaramond-MediumItalic'],
        sans: ['Pretendard-Regular'],
        sansMedium: ['Pretendard-Medium'],
        mono: ['JetBrainsMono-Regular'],
        monoMedium: ['JetBrainsMono-Medium'],
      },
      letterSpacing: {
        label: '0.2em',
        wide: '0.3em',
      },
    },
  },
  plugins: [],
};
