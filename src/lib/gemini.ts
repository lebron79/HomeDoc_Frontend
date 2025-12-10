// Using Grok API via Supabase Edge Function
const SUPABASE_URL = 'https://vebmeyrvgkifagheaoib.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYm1leXJ2Z2tpZmFnaGVhb2liIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMDMxNTMsImV4cCI6MjA3NjU3OTE1M30.ZMiXpiErXyeYDJjwSo7R4rRcqopTYWWRa5RbvtNdneo';
const SUPABASE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/grok-ai`;

export interface GeminiResponse {
  diagnosis: string;
  recommendation: string;
  severity: 'low' | 'medium' | 'high';
  requiresDoctor: boolean;
  confidence: number;
  additionalNotes?: string;
}

/**
 * Helper function to call Grok API via Supabase Edge Function
 */
async function callGrokAPI(messages: Array<{role: string; content: string}>, temperature: number = 0.7, maxTokens: number = 1024): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    console.log('Calling Grok API via Edge Function...');
    
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    console.log('Edge Function response status:', response.status);

    if (!response.ok) {
      console.error('Edge Function error:', responseText);
      throw new Error(`Grok API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Edge Function response received');
    
    if (!data.content) {
      throw new Error('No content in response');
    }
    
    return data.content;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - AI taking too long to respond');
    }
    throw error;
  }
}

/** 
 * Analyzes patient symptoms using the Grok AI model to provide medical assessment
 */
export async function analyzeSymptomsWithGemini(
  symptoms: string,
  severity: 'mild' | 'moderate' | 'severe'
): Promise<GeminiResponse> {
  if (!symptoms?.trim()) {
    throw new Error('Symptoms description is required');
  }

  try {
    const prompt = `You are a medical AI assistant. Analyse the following patient symptoms and provide a professional medical assessment.

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

Important: This is for informational purposes only and should not replace professional medical advice.`;

    const text = await callGrokAPI([
      { role: 'user', content: prompt }
    ], 0.7, 1024);

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
    console.error('Error analyzing symptoms with Grok API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to analyze symptoms: ${errorMessage}`);
  }
}

/** 
 * General health advice helper using Grok AI
 */
export async function getHealthAdviceWithGemini(question: string): Promise<string> {
  if (!question?.trim()) {
    throw new Error('Question is required');
  }

  try {
    const prompt = `You are a helpful medical AI assistant. Provide helpful, accurate health advice for the following question.

Question: ${question}

Guidelines:
- Provide clear, helpful advice
- Be professional and medical in tone
- Include appropriate disclaimers
- Focus on general health information
- Recommend consulting healthcare providers when appropriate
- Keep response concise but informative
- Always remind that this is not a substitute for professional medical advice

Response should be 2-3 paragraphs maximum.`;

    const text = await callGrokAPI([
      { role: 'user', content: prompt }
    ], 0.6, 500);
    
    return text;
  } catch (error) {
    console.error('Error calling Grok API for health advice:', error);
    return (
      "I apologise, but I'm unable to provide health advice at the moment. " +
      'Please consult with a healthcare provider for proper medical guidance.'
    );
  }
}

/** 
 * Generate a smart, contextual title for a conversation using Grok AI
 */
export async function generateConversationTitle(conversationText: string): Promise<string> {
  if (!conversationText?.trim()) {
    return 'Health Consultation';
  }

  try {
    const prompt = `Based on the following medical conversation, generate a short, descriptive title (maximum 6-8 words) that captures the main health concern or topic discussed.

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
- Persistent Headache and Vision Problems
- Chest Pain Assessment
- Digestive Issues After Meals
- Fever and Respiratory Symptoms
- Skin Rash on Arms and Legs

Generate only the title, nothing else.`;

    const text = await callGrokAPI([
      { role: 'user', content: prompt }
    ], 0.5, 50);
    
    const title = text.trim().replace(/["']/g, '');
    
    if (title.length > 60) {
      return title.substring(0, 57) + '...';
    }
    
    return title || 'Health Consultation';
  } catch (error) {
    console.error('Error generating conversation title with Grok:', error);
    return 'Health Consultation';
  }
}
