export interface DietUserProfile {
  objective: string;
  activityLevel: string;
  restrictions: string;
  calorieGoal: number;
  mealsPerDay: number;
}

export interface GeneratedDiet {
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: {
    id: string;
    name: string;
    time: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    items: {
      name: string;
      quantity: string;
      calories: number;
    }[];
  }[];
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

export async function generateDietWithAI(profile: DietUserProfile, customRequest?: string): Promise<GeneratedDiet> {
  const prompt = `Você é um nutricionista especializado. Monte uma dieta diária completa para um usuário com o seguinte perfil:
- Objetivo: ${profile.objective}
- Nível de atividade: ${profile.activityLevel}
- Restrições: ${profile.restrictions || 'Nenhuma'}
- Meta calórica: ${profile.calorieGoal} kcal/dia
- Número de refeições: ${profile.mealsPerDay}
- Pedido específico do usuário: ${customRequest || 'Nenhum'}

Retorne APENAS um JSON válido, sem texto adicional, no seguinte formato:
{
  "totalCalories": 2000,
  "macros": { "protein": 150, "carbs": 200, "fats": 65 },
  "meals": [
    {
      "id": "1",
      "name": "Café da Manhã",
      "time": "07:00",
      "calories": 420,
      "protein": 30,
      "carbs": 40,
      "fats": 15,
      "items": [
        { "name": "Ovos mexidos", "quantity": "3 unidades", "calories": 210 },
        { "name": "Pão integral", "quantity": "2 fatias", "calories": 140 }
      ]
    }
  ]
}`;

  const schema = {
    type: "OBJECT",
    properties: {
      totalCalories: { type: "NUMBER" },
      macros: {
        type: "OBJECT",
        properties: {
          protein: { type: "NUMBER" },
          carbs: { type: "NUMBER" },
          fats: { type: "NUMBER" }
        },
        required: ["protein", "carbs", "fats"]
      },
      meals: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            id: { type: "STRING" },
            name: { type: "STRING" },
            time: { type: "STRING" },
            calories: { type: "NUMBER" },
            protein: { type: "NUMBER" },
            carbs: { type: "NUMBER" },
            fats: { type: "NUMBER" },
            items: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  quantity: { type: "STRING" },
                  calories: { type: "NUMBER" }
                },
                required: ["name", "quantity", "calories"]
              }
            }
          },
          required: ["id", "name", "time", "calories", "items"]
        }
      }
    },
    required: ["totalCalories", "macros", "meals"]
  };

  const result = await callGemini(prompt, schema);
  return result as GeneratedDiet;
}
