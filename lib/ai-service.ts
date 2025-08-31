// AI service using local Ollama model
const OLLAMA_BASE_URL = 'http://localhost:11434';

interface OllamaResponse {
  response: string;
  done: boolean;
}

async function callOllama(prompt: string): Promise<string> {
  // Get selected model from localStorage
  const selectedModel = localStorage.getItem('selectedOllamaModel') || 'llama2';
  
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        prompt: prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data: OllamaResponse = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error calling Ollama:', error);
    throw new Error('Failed to connect to Ollama. Make sure Ollama is running on localhost:11434');
  }
}

export async function generateNotes(content: string, style: 'bullet' | 'detailed' | 'condensed'): Promise<string> {
  const styleInstructions = {
    bullet: `Create concise bullet-point study notes from the following content. Use clear headings and organize information hierarchically with bullet points. Focus on key concepts, important details, and main takeaways. Format with markdown headers and bullet points.`,
    detailed: `Create comprehensive, detailed study notes from the following content. Include thorough explanations, examples, and context. Organize with clear sections and subsections. Provide in-depth coverage of all important concepts with supporting details and explanations.`,
    condensed: `Create an ultra-condensed summary from the following content. Focus only on the most essential information. Use minimal text while capturing all critical points. Format as a brief, scannable summary with key facts and takeaways.`
  };

  const prompt = `${styleInstructions[style]}

Content to process:
${content}

Please generate well-structured study notes in the requested style:`;

  return await callOllama(prompt);
}

export async function generateFlashcards(content: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Array<{front: string; back: string}>> {
  const difficultyInstructions = {
    easy: 'Create simple, straightforward flashcards focusing on basic facts and definitions.',
    medium: 'Create moderately challenging flashcards that require some analysis and understanding.',
    hard: 'Create advanced flashcards that require critical thinking, synthesis, and deep understanding.'
  };

  const prompt = `Create exactly 5 flashcards from the following content. ${difficultyInstructions[difficulty]}

Format your response as a JSON array with objects containing "front" and "back" properties. Each flashcard should have a clear question or prompt on the front and a comprehensive answer on the back.

Content:
${content}

Respond with only the JSON array, no additional text:`;

  try {
    const response = await callOllama(prompt);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback: parse the response manually if JSON extraction fails
    const lines = response.split('\n').filter(line => line.trim());
    const flashcards = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      if (lines[i] && lines[i + 1]) {
        flashcards.push({
          front: lines[i].replace(/^\d+\.\s*/, '').trim(),
          back: lines[i + 1].trim()
        });
      }
    }
    
    return flashcards.slice(0, 5);
  } catch (error) {
    console.error('Error parsing flashcards:', error);
    // Return fallback flashcards
    return [
      {
        front: "What is the main topic of the provided content?",
        back: "The content covers key concepts and information that can be studied and reviewed."
      },
      {
        front: "What are the key takeaways from this material?",
        back: "The material provides important insights and knowledge for understanding the subject matter."
      }
    ];
  }
}

export async function generateMCQs(content: string, difficulty: 'easy' | 'medium' | 'hard'): Promise<Array<{
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}>> {
  const difficultyInstructions = {
    easy: 'Create straightforward multiple-choice questions focusing on basic facts and recall.',
    medium: 'Create moderately challenging questions that require understanding and application.',
    hard: 'Create advanced questions requiring analysis, synthesis, and critical thinking.'
  };

  const prompt = `Create exactly 3 multiple-choice questions from the following content. ${difficultyInstructions[difficulty]}

Format your response as a JSON array with objects containing:
- "question": the question text
- "options": array of 4 possible answers
- "correctAnswer": index (0-3) of the correct answer
- "explanation": explanation of why the answer is correct

Content:
${content}

Respond with only the JSON array, no additional text:`;

  try {
    const response = await callOllama(prompt);
    
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback questions if parsing fails
    return [
      {
        question: "Based on the provided content, what is the main focus?",
        options: [
          "Key concepts and important information",
          "Irrelevant details",
          "Random facts",
          "Unrelated topics"
        ],
        correctAnswer: 0,
        explanation: "The content focuses on key concepts and important information relevant to the subject matter."
      },
      {
        question: "What can be learned from studying this material?",
        options: [
          "Nothing useful",
          "Important knowledge and insights",
          "Only basic facts",
          "Confusing information"
        ],
        correctAnswer: 1,
        explanation: "The material provides important knowledge and insights that enhance understanding of the topic."
      }
    ];
  } catch (error) {
    console.error('Error parsing MCQs:', error);
    // Return fallback questions
    return [
      {
        question: "What is the primary purpose of this study material?",
        options: [
          "To provide educational content",
          "To confuse students",
          "To waste time",
          "To provide entertainment"
        ],
        correctAnswer: 0,
        explanation: "The primary purpose is to provide educational content for learning and understanding."
      }
    ];
  }
}

// Function to check if Ollama is running
export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to get available models
export async function getAvailableModels(): Promise<string[]> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!response.ok) {
      throw new Error('Failed to fetch models');
    }
    
    const data = await response.json();
    return data.models?.map((model: any) => model.name) || [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return ['llama2']; // Default fallback
  }
}