import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';
import aspectRatio from '@tailwindcss/aspect-ratio';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1E293B', // Darker color for text
        background: '#FFFFFF', // White background
        border: '#D1D5DB', // Light gray for borders
      },
    },
  },
  corePlugins: {
    aspectRatio: false,
  },
  plugins: [
    typography,
    forms,
    aspectRatio,
  ],
}
