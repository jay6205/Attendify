import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const generateQuestions = async (courseName, topic, difficulty, questionSchema) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct the prompt based on the schema
    let schemaDescription = "";
    questionSchema.forEach((item, index) => {
      schemaDescription += `${index + 1}. ${item.count} questions of type '${item.type}' worth ${item.marks} marks each.\n`;
    });

    const prompt = `
      You are an expert teacher and question paper setter.
      Create a question paper for the course "${courseName}" on the topic: "${topic}".
      Difficulty Level: ${difficulty}.

      The question paper MUST follow this exact structure:
      ${schemaDescription}

      Return the output as a strictly valid JSON object. Do not include markdown formatting (like \`\`\`json).
      The JSON structure must be:
      {
        "title": "A suitable title for the paper",
        "questions": [
          {
            "questionText": "The question content",
            "questionType": "One of [MCQ, SHORT, LONG, NUMERICAL]",
            "marks": Number,
            "options": ["Option A", "Option B", "Option C", "Option D"] // Only include this array if questionType is MCQ. Provide 4 options.
          }
        ]
      }
      
      Ensure the total number of questions and marks per question matches the structure exactly.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up markdown if Gemini decides to add it despite instructions
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const data = JSON.parse(text);
      return data;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Invalid JSON response from AI");
    }

  } catch (error) {
    console.error("Gemini Generation Error Detailed:", error);
    if (error.response) {
      console.error("API Response Error:", error.response.data);
    }
    throw new Error("Failed to generate questions: " + (error.message || "Unknown error"));
  }
};
