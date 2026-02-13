import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLoveMessage = async (name: string = "người thương"): Promise<string> => {
  try {
    const prompt = `
      Hãy viết một lời chúc Valentine cực kỳ lãng mạn, ngắn gọn (dưới 60 từ) bằng tiếng Việt.
      Chủ đề là "Vũ trụ và Tình yêu vĩnh cửu". 
      Hãy so sánh người ấy (tên là "${name}" nếu có, hoặc chỉ là "em"/"anh") với các vì sao, thiên hà, hoặc điều gì đó huyền diệu.
      Giọng văn chân thành, ngọt ngào, và hơi mơ mộng.
      Không cần tiêu đề, chỉ cần nội dung lời chúc.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.8,
        maxOutputTokens: 100,
      }
    });

    return response.text || "Vũ trụ này rộng lớn, nhưng không bằng tình yêu anh dành cho em.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Dù các vì sao có tắt, tình yêu của chúng ta vẫn sẽ mãi sáng soi.";
  }
};
