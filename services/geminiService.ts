
import { GoogleGenAI, Type } from "@google/genai";
import { AiGeneratedContent } from "../types";

export const generateLessonContent = async (
  title: string,
  driveUrl: string,
  images: string[]
): Promise<AiGeneratedContent> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    以下の授業資料をもとに、授業内容を自動で文字起こし・解析し、休んだ生徒が内容を理解できるように情報を整理してください。
    
    【授業タイトル】
    ${title}
    
    【提供されたGoogle Drive資料URL】
    ${driveUrl}
    
    【画像データ】
    （添付された黒板やスライドの画像も解析に含めてください）
    
    以下の手順で処理してください：
    1. URL先のドキュメントまたは動画の内容を推論・解析し、重要な発言や説明を抽出する。
    2. 画像内の文字や図表を読み取り、テキスト情報と統合する。
    3. 以下のJSON形式で出力する：
    
    - summary: 中高生向けに噛み砕いた、授業全体のわかりやすい要約（200〜400文字程度）。
    - keyPoints: 重要なポイントを3〜5つの箇条書き形式。
    - exercises: 授業内容の理解を確認するための例題を3問。
      - question: 問題文。
      - answer: 正解（単語や短い文章）。
      - explanation: なぜその答えになるのか、丁寧な解説。
  `;

  const imageParts = images.map(img => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: img.split(',')[1] || img 
    }
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: prompt },
          ...imageParts
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question", "answer", "explanation"]
              }
            }
          },
          required: ["summary", "keyPoints", "exercises"]
        }
      }
    });

    const text = response.text || "";
    if (!text) {
      throw new Error("AI returned empty content");
    }
    
    const result = JSON.parse(text.trim());
    
    return {
      ...result,
      exercises: result.exercises.map((ex: any, idx: number) => ({
        ...ex,
        id: `ex-${idx}-${Date.now()}`
      }))
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
};
