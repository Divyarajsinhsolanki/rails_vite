/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./app/javascript/**/*.{js,jsx,ts,tsx}",
    "./app/views/**/*.html.erb",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          DEFAULT: "rgb(var(--theme-color-rgb) / <alpha-value>)",
          secondary: "rgb(var(--theme-secondary-rgb) / <alpha-value>)",
        },
        shell: {
          bg: "var(--shell-bg)",
          deep: "var(--shell-bg-deep)",
          surface: "var(--shell-surface)",
          strong: "var(--shell-surface-strong)",
          soft: "var(--shell-surface-soft)",
          border: "var(--shell-border)",
          text: "var(--shell-text)",
          muted: "var(--shell-muted)",
        },
      },
      boxShadow: {
        "shell-sm": "var(--shell-shadow-sm)",
        "shell-md": "var(--shell-shadow-md)",
        "shell-lg": "var(--shell-shadow-lg)",
      },
      borderRadius: {
        "shell-xs": "var(--shell-radius-xs)",
        "shell-sm": "var(--shell-radius-sm)",
        "shell-md": "var(--shell-radius-md)",
        "shell-lg": "var(--shell-radius-lg)",
      },
      transitionTimingFunction: {
        shell: "cubic-bezier(0.22, 1, 0.36, 1)",
        "shell-soft": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backdropBlur: {
        shell: "20px",
      },
      backgroundImage: {
        "shell-primary": "linear-gradient(135deg, rgb(var(--theme-color-rgb) / 0.96), rgb(var(--theme-secondary-rgb) / 0.88))",
        "shell-soft": "linear-gradient(135deg, rgb(255 255 255 / 0.92), rgb(235 242 255 / 0.74))",
        "shell-dark": "linear-gradient(135deg, rgba(7,17,32,0.96), rgba(30,41,59,0.92))",
      },
    },
  },
  plugins: [],
};
