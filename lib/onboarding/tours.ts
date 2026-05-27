export type OnboardingTourId =
  | "home"
  | "predictions"
  | "matches"
  | "ranking"
  | "profile";

export interface OnboardingStep {
  description: string;
  target: string;
  title: string;
}

export const ONBOARDING_TOURS: Record<OnboardingTourId, OnboardingStep[]> = {
  home: [
    {
      description: "Aquí ves cuánto falta para el próximo cierre de predicciones.",
      target: '[data-tour="countdown"]',
      title: "Tu cuenta atrás",
    },
    {
      description:
        "Cuando empiecen los partidos verás aquí tu puesto y cuánto te separa del liderato.",
      target: '[data-tour="ranking-pill"]',
      title: "Tu posición",
    },
    {
      description:
        "Desde aquí saltas al calendario o a tus predicciones para no llegar tarde al cierre.",
      target: '[data-tour="bottom-nav"]',
      title: "Tu siguiente jugada",
    },
  ],
  matches: [
    {
      description:
        "Recorta por fase o por grupo hasta encontrar el partido que buscas.",
      target: '[data-tour="matches-filters"]',
      title: "Filtra el calendario",
    },
    {
      description:
        "Aquí ves equipos, hora local y estado real del cruce sin salir del torneo.",
      target: '[data-tour="match-card"]',
      title: "Cada partido en su sitio",
    },
  ],
  predictions: [
    {
      description:
        "Primero ordenas los grupos; después cerrarás las eliminatorias ronda a ronda.",
      target: '[data-tour="tabs"]',
      title: "Dos tipos de pronóstico",
    },
    {
      description: "Pulsa A-L para ir directo al grupo que quieras mover.",
      target: '[data-tour="group-navigator"]',
      title: "Salta entre grupos",
    },
    {
      description:
        "Cada grupo se guarda por separado antes de que el cierre te deje fuera.",
      target: '[data-tour="save-button"]',
      title: "Guarda cada grupo",
    },
  ],
  profile: [
    {
      description:
        "Sube una foto o ponte el escudo de tu selección. Así te reconocerán en la clasificación.",
      target: '[data-tour="avatar-section"]',
      title: "Tu avatar",
    },
    {
      description:
        "Cuando termines de ajustar avatar y nombre, sales de la app desde aquí.",
      target: '[data-tour="logout"]',
      title: "Cierras cuando quieras",
    },
  ],
  ranking: [
    {
      description: "Los tres primeros mandan aquí. Oro, plata y bronce.",
      target: '[data-tour="podium"]',
      title: "El podio",
    },
    {
      description: "Tu posición queda destacada estés donde estés en la tabla.",
      target: '[data-tour="your-row"]',
      title: "Tu fila",
    },
    {
      description: "Puntos por grupos, eliminatorias y campeón. Cada acierto cuenta.",
      target: '[data-tour="ranking-breakdown"]',
      title: "Cómo se cuentan",
    },
  ],
};
