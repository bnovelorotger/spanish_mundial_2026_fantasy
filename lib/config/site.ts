export const siteConfig = {
  name: "World Cup 2026 Pick'em",
  badge: "Private Tournament Mode",
  stats: [
    {
      value: "12",
      label: "Groups in play",
      description: "A to L, structured for the full tournament slate.",
    },
    {
      value: "104",
      label: "Matches to track",
      description: "Calendar, predictions, and scoring land in later phases.",
    },
    {
      value: "Top 10",
      label: "Ranking spotlight",
      description: "Built to keep the friends-only table front and center.",
    },
  ],
  features: [
    {
      title: "Brandbook-first foundation",
      description:
        "Tailwind v4 tokens, premium dark surfaces, pill CTAs, and the stadium-light gradient are wired from day one.",
    },
    {
      title: "Mobile scoreboard feel",
      description:
        "The layout starts on 360px screens with strong contrast, card hierarchy, and Space Grotesk reserved for numbers.",
    },
    {
      title: "Phase-safe architecture",
      description:
        "Folders for auth, protected routes, services, providers, scripts, tests, and Supabase are prepared without shipping future features early.",
    },
  ],
  stack: [
    "Next.js App Router with strict TypeScript",
    "Tailwind CSS v4 tokens from the brandbook",
    "shadcn/ui baseline configured for future components",
    "Vitest ready for service and validation tests",
  ],
} as const;
