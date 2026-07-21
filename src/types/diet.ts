export interface DietMealBase {
  nome: string;
  quantidade: string;
  calorias: number;
}

export interface DietMeal {
  id: string;
  nome: string;
  horario: string;
  calorias: number;
  alimentos: DietMealBase[];
  isBaseItem: true;
}

export interface DietExtraItem {
  id: string;
  nome: string;
  horario: string;
  calorias: number;
  alimentos: DietMealBase[];
  isBaseItem: false;
  date: string;
}

export interface DietBase {
  id: string;
  createdAt: string;
  updatedAt: string;
  generatedByAI: boolean;
  profile: {
    objetivo: string;
    metaCalorica: number;
    totalRefeicoes: number;
    restricoes: string;
  };
  macros: {
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
  refeicoes: DietMeal[];
}

export interface DietDayProgress {
  date: string;
  refeicoesConcluidas: string[];
  caloriasConsumidas: number;
  macrosConsumidos: {
    proteina: number;
    carboidrato: number;
    gordura: number;
  };
  extrasDoDia: DietExtraItem[];
}
