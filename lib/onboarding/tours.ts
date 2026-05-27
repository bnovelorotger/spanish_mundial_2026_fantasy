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
      description: "Aquí ves cuánto queda para el próximo cierre de predicciones.",
      target: '[data-tour="countdown"]',
      title: "Tu cuenta atrás",
    },
    {
      description: "Cuando empiecen los partidos verás aquí tu puesto y la diferencia con el primero.",
      target: '[data-tour="ranking-pill"]',
      title: "Tu posición",
    },
    {
      description: "Salta entre Inicio, Predicciones, Partidos, Clasificación y Perfil.",
      target: '[data-tour="bottom-nav"]',
      title: "Navegación rápida",
    },
  ],
  matches: [
    {
      description: "Por fase y por grupo para encontrar el partido que te interesa.",
      target: '[data-tour="matches-filters"]',
      title: "Filtra el calendario",
    },
    {
      description: "Equipos, hora local y estado del partido en directo cuando ruede el balón.",
      target: '[data-tour="match-card"]',
      title: "Cada partido en su sitio",
    },
  ],
  predictions: [
    {
      description: "Ordena los grupos y, cuando se sorteen, los cruces de eliminatorias.",
      target: '[data-tour="tabs"]',
      title: "Dos tipos de pronóstico",
    },
    {
      description: "Pulsa A-L para ir al grupo sin tener que hacer scroll.",
      target: '[data-tour="group-navigator"]',
      title: "Salta entre grupos",
    },
    {
      description: "Cada grupo se guarda por separado antes de que se cierre la fase.",
      target: '[data-tour="save-button"]',
      title: "Guarda cada grupo",
    },
  ],
  profile: [
    {
      description: "Sube una foto o elige el escudo de tu equipo. Lo verán todos en la clasificación.",
      target: '[data-tour="avatar-section"]',
      title: "Tu avatar",
    },
    {
      description: "Aquí está siempre el botón de Cerrar sesión.",
      target: '[data-tour="logout"]',
      title: "Salir de la app",
    },
  ],
  ranking: [
    {
      description: "Los tres primeros viven aquí. Gold, silver, bronze.",
      target: '[data-tour="podium"]',
      title: "El podio",
    },
    {
      description: "Tu posición está destacada esté donde esté en la tabla.",
      target: '[data-tour="your-row"]',
      title: "Tu fila",
    },
    {
      description: "Puntos por grupos, eliminatorias y campeón. Cada acierto suma.",
      target: '[data-tour="ranking-breakdown"]',
      title: "Cómo se cuentan",
    },
  ],
};
