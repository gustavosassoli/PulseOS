export interface ScoreInputs {
  agenda: { total: number; concluidas: number };
  treino: { treinouHoje: boolean };
  dieta: { refeicoesHoje: number };
  habitos: { total: number; concluidos: number };
  bemEstar: {
    registrouHumor: boolean;
    registrouReflexao: boolean;
    registrouLazer: boolean;
    checkinPoints?: number;
  };
  financas: { registrouHoje: boolean };
}

export interface ScoreResult {
  total: number;
  breakdown: {
    agenda: { pontos: number; maximo: 30 };
    treino: { pontos: number; maximo: 20 };
    dieta: { pontos: number; maximo: 20 };
    habitos: { pontos: number; maximo: 15 };
    bemEstar: { pontos: number; maximo: 10 };
    financas: { pontos: number; maximo: 5 };
  };
}

export function calculateLifeScore(inputs: ScoreInputs): ScoreResult {
  // Agenda (máx 30)
  const pAgenda = inputs.agenda.total > 0
    ? Math.round((inputs.agenda.concluidas / inputs.agenda.total) * 30)
    : 0;

  // Treino (máx 20)
  const pTreino = inputs.treino.treinouHoje ? 20 : 0;

  // Dieta (máx 20)
  let pDieta = 0;
  if (inputs.dieta.refeicoesHoje === 1) pDieta = 7;
  else if (inputs.dieta.refeicoesHoje === 2) pDieta = 13;
  else if (inputs.dieta.refeicoesHoje === 3) pDieta = 17;
  else if (inputs.dieta.refeicoesHoje >= 4) pDieta = 20;

  // Hábitos (máx 15)
  const pHabitos = inputs.habitos.total > 0
    ? Math.round((inputs.habitos.concluidos / inputs.habitos.total) * 15)
    : 0;

  // Bem-Estar (máx 10)
  let pBemEstar = 0;
  if (inputs.bemEstar.registrouHumor) pBemEstar += 5;
  if (inputs.bemEstar.registrouReflexao) pBemEstar += 3;
  if (inputs.bemEstar.registrouLazer) pBemEstar += 2;
  if (inputs.bemEstar.checkinPoints) pBemEstar += inputs.bemEstar.checkinPoints;
  if (pBemEstar > 10) pBemEstar = 10;

  // Finanças (máx 5)
  const pFinancas = inputs.financas.registrouHoje ? 5 : 0;

  // Total (máx 100)
  let total = pAgenda + pTreino + pDieta + pHabitos + pBemEstar + pFinancas;
  if (total > 100) total = 100;
  if (total < 0) total = 0; // Just in case, though math doesn't allow it here

  return {
    total,
    breakdown: {
      agenda: { pontos: pAgenda, maximo: 30 },
      treino: { pontos: pTreino, maximo: 20 },
      dieta: { pontos: pDieta, maximo: 20 },
      habitos: { pontos: pHabitos, maximo: 15 },
      bemEstar: { pontos: pBemEstar, maximo: 10 },
      financas: { pontos: pFinancas, maximo: 5 }
    }
  };
}
