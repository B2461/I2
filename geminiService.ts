import { GoogleGenAI, Modality } from "@google/genai";
import { DivinationType, UserInput, Reading, Place } from './types';

/**
 * Utility to convert a file to base64 for Gemini
 */
const fileToGenerativePart = async (file: File) => {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

/**
 * Generates an AI response based on the tool type and user input.
 */
export const generateReading = async (type: DivinationType, input: UserInput): Promise<Reading> => {
    // Initialization using pre-configured process.env.API_KEY directly as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let prompt = `You are an expert spiritual consultant and Vedic scholar specializing in ${type}. 
    Based on the following details, provide a deep, accurate, and culturally resonant response in HINDI:
    - User Name: ${input.name || 'Anonymous'}
    - Question/Context: ${input.question || 'Overall life guidance'}
    ${input.dob ? `- Birth Date: ${input.dob}` : ''}
    ${input.timeOfBirth ? `- Birth Time: ${input.timeOfBirth}` : ''}
    ${input.placeOfBirth ? `- Birth Place: ${input.placeOfBirth}` : ''}

    You MUST strictly return your answer in three distinct JSON fields:
    1. "past": Analysis of the past background.
    2. "present": Current opportunities/energies.
    3. "future": Predictive outlook and actionable advice.

    Response Format: { "past": "...", "present": "...", "future": "..." }`;

    try {
        let contents: any = { parts: [{ text: prompt }] };

        if (input.image) {
            const imagePart = await fileToGenerativePart(input.image);
            contents = { parts: [imagePart, { text: prompt }] };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: { responseMimeType: "application/json" }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        const jsonResponse = JSON.parse(text);
        return {
            past: jsonResponse.past || "जानकारी उपलब्ध नहीं है।",
            present: jsonResponse.present || "जानकारी उपलब्ध नहीं है।",
            future: jsonResponse.future || "जानकारी उपलब्ध नहीं है.",
            result: ""
        };
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("भविष्यवाणी प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।");
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
    // Initialization using pre-configured process.env.API_KEY directly as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    
    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (audioData) return audioData;
    throw new Error("Speech generation failed");
};

export const findLocalExperts = async (query: string): Promise<Place[]> => {
    // Initialization using pre-configured process.env.API_KEY directly as required
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `Find 5 popular ${query}. Return ONLY a JSON array of objects with 'name' and 'address' fields.` }] }],
        config: {
            tools: [{ googleSearch: {} }]
        }
    });

    try {
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};