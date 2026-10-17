// Funcionalidades ligadas/desligadas por ambiente (frontend/.env.local).
// O código das desligadas continua no projeto; só some da interface e das rotas.
export const FEATURES = {
  /** Assistente de IA Ruach: desligado até a funcionalidade ser revista. Ligar com VITE_FEATURE_RUACH=true. */
  ruach: import.meta.env.VITE_FEATURE_RUACH === 'true',
} as const;
