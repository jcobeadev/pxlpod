// @poplab/tokens
// Tailwind preset generated from Poplab's design system (design-system.zip).
// Mobile reads the plain-data twin of this file: ./tokens.json
//
// Colour groups from the design file are given semantic names rather than
// raw hex names:
//   - ink / amber / canvas / ground: single brand + base colours
//   - surface: elevated-surface scale (surface, surface-2 .. surface-6)
//   - muted / faint / hairline: text & divider grey scale, each DEFAULT + 2

const tokens = require("./tokens.json");

/** @type {import("tailwindcss").Config} */
const preset = {
  theme: {
    extend: {
      colors: {
        ink: tokens.color.ink,
        amber: tokens.color.amber,
        canvas: tokens.color.canvas,
        surface: tokens.color.surface,
        muted: tokens.color.muted,
        faint: tokens.color.faint,
        hairline: tokens.color.hairline,
        ground: tokens.color.ground,
      },
      fontFamily: {
        body: [tokens.font.body, "sans-serif"],
        display: [tokens.font.display, "sans-serif"],
      },
    },
  },
};

module.exports = preset;
