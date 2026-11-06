// The pages load Tailwind from the CDN, which has no shadcn tokens and no v4
// syntax, so the island ships its own compiled stylesheet. Preflight is off:
// the CDN already supplies the reset on every page.
const token = (name) => `rgb(var(--ksb-${name}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  corePlugins: { preflight: false },
  theme: {
    // Matches the <=768px mobile query in animated-sidebar.tsx.
    screens: { md: "769px" },
    extend: {
      colors: {
        background: token("bg"),
        foreground: token("fg"),
        muted: token("muted"),
        "muted-foreground": token("muted-fg"),
        border: token("border"),
        ring: token("ring"),
      },
    },
  },
};
