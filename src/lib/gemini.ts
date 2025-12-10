import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAnkmthgBT57AueLY5jN5b0tTbTXjDybqs';
const GEMINI_MODEL = 'gemini-2.0-flash';  // Using the gemini-2.0-flash model

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY);

export interface GeminiResponse {
  diagnosis: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
  requiresDoctor: boolean;
  confidence: number;
  additionalNotes?: string;
}

/** 
 * Analyzes patient symptoms using the Gemini AI model to provide medical assessment
 * @param symptoms - Description of patient symptoms
 * @param severity - Patient-reported severity level
 * @returns Promise<GeminiResponse> containing AI-generated medical assessment
 * @throws Error if API call fails or response parsing fails
 */
export async function analyzeSymptomsWithGemini(
  symptoms: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<GeminiResponse> {
  if (!symptoms?.trim()) {
    throw new Error('Symptoms description is required');
  }

  try {
    // Initialize the model with specific configuration
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const prompt = `
You are a medical AI assistant. Analyse the following patient symptoms and provide a professional medical assessment.

Patient Symptoms: ${symptoms}
Symptom Severity: ${severity}

Please provide your analysis in the following JSON format:
{
  "diagnosis": "Most likely condition or description",
  "recommendation": "Specific advice for the patient",
  "severity": "low/medium/high",
  "requiresDoctor": true/false,
  "confidence": 85,
  "additionalNotes": "Any additional important information"
}

Guidelines:
- Be professional and medical in your assessment
- Consider the severity level when making recommendations
- If symptoms are severe or potentially serious, recommend doctor consultation
- Provide practical, actionable advice
- Confidence should be between 60-95%
- Always include appropriate medical disclaimers in additionalNotes
- Focus on common conditions first, but don't dismiss serious possibilities
- Consider age-appropriate conditions
- Mention when immediate medical attention is needed

Important: This is for informational purposes only and should not replace professional medical advice.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // ---- JSON extraction ----
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        diagnosis: parsed.diagnosis ?? 'Unable to determine specific condition',
        recommendation: parsed.recommendation ?? 'Please consult with a healthcare provider',
        severity: parsed.severity ?? 'medium',
        requiresDoctor: parsed.requiresDoctor ?? false,
        confidence: parsed.confidence ?? 75,
        additionalNotes:
          parsed.additionalNotes ??
          'Please consult a healthcare provider for proper diagnosis and treatment.',
      };
    }

    // ---- Fallback if JSON parsing fails ----
    return {
      diagnosis: 'AI Analysis Complete',
      recommendation: text.substring(0, 200) + '...',
      severity: severity === 'severe' ? 'high' : severity === 'moderate' ? 'medium' : 'low',
      requiresDoctor: severity === 'severe',
      confidence: 70,
      additionalNotes: 'Please consult a healthcare provider for proper diagnosis and treatment.',
    };
  } catch (error) {
    console.error('Error analyzing symptoms with Gemini API:', error);

    // If it's a specific API error, provide more context
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('404')) {
      throw new Error('AI model currently unavailable. Please try again later.');
    }
    
    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      throw new Error('API authentication failed. Please check your API key configuration.');
    }

    // For other errors, throw a generic error message
    throw new Error(`Failed to analyze symptoms: ${errorMessage}`);
  }
}

/** 
 * General health advice helper using Gemini AI
 * @param question - The health-related question to be answered
 * @returns Promise<string> containing the AI-generated health advice
 * @throws Error if API call fails or question is invalid
 */
export async function getHealthAdviceWithGemini(question: string): Promise<string> {
  if (!question?.trim()) {
    throw new Error('Question is required');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
    });

    const prompt = `
You are a helpful medical AI assistant. Provide helpful, accurate health advice for the following question.

Question: ${question}

Guidelines:
- Provide clear, helpful advice
- Be professional and medical in tone
- Include appropriate disclaimers
- Focus on general health information
- Recommend consulting healthcare providers when appropriate
- Keep response concise but informative
- Always remind that this is not a substitute for professional medical advice

Response should be 2-3 paragraphs maximum.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error calling Gemini API for health advice:', error);
    return (
      "I apologise, but I'm unable to provide health advice at the moment. " +
      'Please consult with a healthcare provider for proper medical guidance.'
    );
  }
}

/** 
 * Generate a smart, contextual title for a conversation using Gemini AI
 * @param conversationText - Full conversation in text format
 * @returns Promise<string> containing the AI-generated conversation title
 * @throws Error if API call fails
 */
export async function generateConversationTitle(conversationText: string): Promise<string> {
  if (!conversationText?.trim()) {
    return 'Health Consultation';
  }

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { 
        temperature: 0.5, 
        maxOutputTokens: 50,
      },
    });

    const prompt = `
Based on the following medical conversation, generate a short, descriptive title (maximum 6-8 words) that captures the main health concern or topic discussed.

Conversation:
${conversationText}

Requirements:
- Maximum 8 words
- Be specific and descriptive
- Use medical terminology when appropriate
- Focus on the main symptom or condition
- Make it professional and clear
- Do not include quotation marks

Examples of good titles:
- "Persistent Headache and Vision Problems"
- "Chest Pain Assessment"
- "Digestive Issues After Meals"
- "Fever and Respiratory Symptoms"
- "Skin Rash on Arms and Legs"

Generate only the title, nothing else.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const title = response.text().trim().replace(/["']/g, '');
    
    // Ensure title is not too long
    if (title.length > 60) {
      return title.substring(0, 57) + '...';
    }
    
    return title || 'Health Consultation';
  } catch (error) {
    console.error('Error generating conversation title with Gemini:', error);
    // Fallback to a generic title
    return 'Health Consultation';
  }
}