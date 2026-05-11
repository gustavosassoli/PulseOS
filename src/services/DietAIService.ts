import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalCalories: { type: Type.NUMBER },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER }
            },
            required: ["protein", "carbs", "fats"]
          },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                time: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fats: { type: Type.NUMBER },
                items: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      quantity: { type: Type.STRING },
                      calories: { type: Type.NUMBER }
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
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to generate diet from AI");
  }

  return JSON.parse(response.text) as GeneratedDiet;
}
