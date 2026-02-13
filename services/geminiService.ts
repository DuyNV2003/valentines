import { GoogleGenAI } from "@google/genai";

export const generateLoveMessage = async (name: string = "người thương"): Promise<string> => {
  try {
    // Check key existence before initialization to avoid "Uncaught Error" crashing the UI
    if (!process.env.API_KEY) {
      console.error("API Key Not Found. Please set API_KEY in Vercel Environment Variables.");
      return "Hệ thống chưa tìm thấy chìa khóa vào vũ trụ (Thiếu API Key). Hãy kiểm tra cài đặt.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      }
    });

    return response.text || "Vũ trụ này rộng lớn, nhưng không bằng tình yêu anh dành cho em.";
  } catch (error) {
    console.error("Error generating message:", error);
    return "Dù các vì sao có tắt, tình yêu của chúng ta vẫn sẽ mãi sáng soi.";
  }
};