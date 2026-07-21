import { AgendaItem, UserProfile, WorkoutDay } from "../types";

export interface ExerciseSuggestion {
  name: string;
  muscles: string;
  setsReps: string;
  gifUrl: string;
  execution: string;
}

export interface WorkoutInsight {
  tip: string;
  exercises: ExerciseSuggestion[];
}

async function callGemini(prompt: string, schema?: any) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, schema })
  });
  if (!res.ok) {
    throw new Error(`Failed: ${res.status}`);
  }
  return res.json();
}

export async function suggestWorkoutAdjustment(
  profile: Pick<UserProfile, 'trainingFocus' | 'gender' | 'currentWeight' | 'targetWeight'>,
  currentPlan: WorkoutDay[]
): Promise<WorkoutInsight> {
  const planSummary = currentPlan.map(day => `${day.day}: ${day.title} (${day.exercises.length} exercícios)`).join("; ");
  
  const prompt = `
    Como um personal trainer de elite da PulseOS, analise o perfil do usuário:
    - Foco: ${profile.trainingFocus === 'lose' ? 'Perder Peso' : 'Ganhar Músculo'}
    - Gênero: ${profile.gender === 'male' ? 'Masculino' : 'Feminino'}
    - Peso Atual: ${profile.currentWeight}kg
    - Peso Alvo: ${profile.targetWeight}kg
    - Plano Atual: [${planSummary}]

    1. Forneça uma breve dica (máximo 2 sentenças) de como o usuário pode otimizar seu treino hoje.
    2. Sugira 3 exercícios de musculação complementares ou específicos para o objetivo dele hoje.
    
    Para cada exercício, retorne:
    - name: Nome do exercício em português.
    - muscles: Músculos alvo.
    - setsReps: Séries e repetições sugeridas (ex: 3x12).
    - gifUrl: Use uma URL de placeholder de imagem de alta qualidade se não tiver um GIF direto, ou tente encontrar um link público estável. Use preferencialmente: https://fitnessprogramer.com/wp-content/uploads/2021/02/[NOME-DO-EXERCICIO-EM-INGLES-COM-HIFEN].gif
    - execution: Uma frase curta explicando a execução correta.

    Retorne APENAS um objeto JSON.
  `;

  try {
    const schema = {
      type: "OBJECT",
      properties: {
        tip: { type: "STRING" },
        exercises: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              muscles: { type: "STRING" },
              setsReps: { type: "STRING" },
              gifUrl: { type: "STRING" },
              execution: { type: "STRING" },
            },
            required: ["name", "muscles", "setsReps", "gifUrl", "execution"]
          }
        }
      },
      required: ["tip", "exercises"]
    };

    return await callGemini(prompt, schema);
  } catch (error) {
    console.error("Erro ao sugerir ajuste de treino:", error);
    return {
      tip: profile.trainingFocus === 'lose' 
        ? "Mantenha a frequência cardíaca elevada e foque em repetições maiores para maximizar a queima calórica."
        : "Foque na sobrecarga progressiva e garanta um descanso adequado entre as séries para hipertrofia.",
      exercises: [
        {
          name: "Supino Reto",
          muscles: "Peitoral, Tríceps",
          setsReps: "3x10",
          gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-BENCH-PRESS.gif",
          execution: "Mantenha as escápulas retraídas e desça a barra até o peito de forma controlada."
        }
      ]
    };
  }
}

export async function generateFullWorkoutPlan(
  profile: Pick<UserProfile, 'trainingFocus' | 'gender' | 'currentWeight' | 'targetWeight' | 'height' | 'age'>
): Promise<WorkoutDay[]> {
  const prompt = `
    Como um personal trainer de elite da PulseOS, crie um PLANO DE TREINO SEMANAL COMPLETO (exatamente 7 dias) focado EXCLUSIVAMENTE em musculação executada em ACADEMIA.
    
    Perfil:
    - Foco: ${profile.trainingFocus === 'lose' ? 'Perder Peso / Definição' : 'Ganhar Massa Magra / Hipertrofia'}
    - Gênero: ${profile.gender === 'male' ? 'Masculino' : 'Feminino'}
    - Peso: ${profile.currentWeight}kg, Altura: ${profile.height}cm, Idade: ${profile.age} anos.
    
    Regras:
    1. O array retornado DEVE conter exatamente 7 objetos (um para cada dia da semana).
    2. Importante: Use EXATAMENTE estes valores para o campo "day": "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo".
    3. Se for dia de descanso, coloque exercícios [] mas inclua o objeto no array com o título "Descanso".
    4. Exercícios: 4 a 8 por dia. Apenas musculação (máquinas, halteres, barras).
    5. Cada exercício deve possuir: name, sets, reps, muscles, gifUrl, executionTip, caloriesBurned.
    6. gifUrl: https://fitnessprogramer.com/wp-content/uploads/2021/02/[NOME-DO-EXERCICIO-EM-INGLES-COM-HIFEN].gif
    
    Retorne APENAS o array JSON.
  `;

  try {
    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: { type: "STRING" },
          title: { type: "STRING" },
          exercises: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                name: { type: "STRING" },
                sets: { type: "NUMBER" },
                reps: { type: "STRING" },
                muscles: { type: "STRING" },
                gifUrl: { type: "STRING" },
                executionTip: { type: "STRING" },
                caloriesBurned: { type: "NUMBER" },
              },
              required: ["name", "sets", "reps", "muscles", "gifUrl", "executionTip", "caloriesBurned"]
            }
          }
        },
        required: ["day", "title", "exercises"]
      }
    };

    const plan: WorkoutDay[] = await callGemini(prompt, schema);
    
    const dayOrder = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    // Normalize day names from AI just in case
    const normalizedPlan = plan.map(day => {
      const foundIdx = dayOrder.findIndex(d => 
        day.day.toLowerCase().includes(d.toLowerCase())
      );
      return {
        ...day,
        day: foundIdx !== -1 ? dayOrder[foundIdx] : day.day
      };
    });

    // Ensure we have all 7 days even if AI missed some
    const finalPlan: WorkoutDay[] = dayOrder.map(dayName => {
      const existing = normalizedPlan.find(p => p.day === dayName);
      if (existing) return existing;
      return { day: dayName, title: 'Descanso', exercises: [] };
    });

    return finalPlan.map(day => ({
      ...day,
      exercises: day.exercises.map(ex => ({
        ...ex,
        id: Math.random().toString(36).substr(2, 9),
        completed: false
      }))
    }));
  } catch (error) {
    console.error("Erro ao gerar plano completo:", error);
    return [];
  }
}

export async function suggestProductivityTask(currentAgenda: AgendaItem[]): Promise<Omit<AgendaItem, 'id'>> {
  const agendaTitles = currentAgenda.map(item => item.title).join(", ");
  
  const prompt = `
    Com base na agenda atual do usuário: [${agendaTitles}], sugira uma nova tarefa de produtividade para hoje.
    A tarefa deve ser algo que melhore a produtividade, foco ou bem-estar no trabalho.
    Retorne apenas um objeto JSON com os seguintes campos:
    - title: Título curto e motivador da tarefa.
    - category: Uma das seguintes: 'Trabalho', 'Saúde', 'Pessoal'.
    - time: Horário sugerido no formato HH:MM.
    - location: Local sugerido (ex: 'Escritório', 'Casa', 'Academia').
    - duration: Duração sugerida (ex: '30min', '1h').
    - icon: Um dos seguintes: 'laptop', 'dumbbell', 'home', 'sparkles'.
  `;

  try {
    const schema = {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        category: { type: "STRING" },
        time: { type: "STRING" },
        location: { type: "STRING" },
        duration: { type: "STRING" },
        icon: { type: "STRING" },
      },
      required: ["title", "category", "time", "location", "duration", "icon"],
    };

    const result = await callGemini(prompt, schema);
    return {
      ...result,
      completed: false,
      categoryColor: result.category === 'Trabalho' ? 'primary' : result.category === 'Saúde' ? 'secondary' : 'tertiary'
    };
  } catch (error) {
    console.error("Erro ao sugerir tarefa com IA:", error);
    // Fallback task if AI fails
    return {
      title: 'Pausa para Foco',
      category: 'Pessoal',
      time: '15:00',
      location: 'Qualquer lugar',
      completed: false,
      duration: '15min',
      categoryColor: 'tertiary',
      icon: 'sparkles'
    };
  }
}
