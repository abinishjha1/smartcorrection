import fetch from 'node-fetch';

export class FreeApiService {
  
  // Hugging Face API for embeddings (free alternative to OpenAI)
  static async generateHuggingFaceEmbeddings(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('Hugging Face API key not configured');

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: texts,
            options: { wait_for_model: true }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Hugging Face embedding error:', error);
      throw error;
    }
  }

  // Cohere API for text generation (free alternative to OpenAI)
  static async generateCohereResponse(prompt: string, context: string): Promise<string> {
    const apiKey = process.env.COHERE_API_KEY;
    if (!apiKey) throw new Error('Cohere API key not configured');

    try {
      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'command-light', // Free tier model
          prompt: `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`,
          max_tokens: 500,
          temperature: 0.1,
          stop_sequences: ['\n\n']
        }),
      });

      if (!response.ok) {
        throw new Error(`Cohere API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.generations[0]?.text?.trim() || 'No response generated';
    } catch (error) {
      console.error('Cohere generation error:', error);
      throw error;
    }
  }

  // Groq API for fast inference (free tier)
  static async generateGroqResponse(prompt: string, context: string): Promise<string> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('Groq API key not configured');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192', // Free tier model
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant specialized in Community Corrections data analysis. Answer questions based on the provided context.`
            },
            {
              role: 'user',
              content: `Context: ${context}\n\nQuestion: ${prompt}`
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('Groq generation error:', error);
      throw error;
    }
  }

  // Together AI for open-source models
  static async generateTogetherResponse(prompt: string, context: string): Promise<string> {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) throw new Error('Together API key not configured');

    try {
      const response = await fetch('https://api.together.xyz/inference', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'togethercomputer/llama-2-7b-chat',
          prompt: `Context: ${context}\n\nQuestion: ${prompt}\n\nAnswer:`,
          max_tokens: 500,
          temperature: 0.1,
          stop: ['\n\n']
        }),
      });

      if (!response.ok) {
        throw new Error(`Together API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.output?.choices[0]?.text?.trim() || 'No response generated';
    } catch (error) {
      console.error('Together generation error:', error);
      throw error;
    }
  }

  // Google Gemini API for text generation
  static async generateGeminiResponse(prompt: string, context: string): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error('Google API key not configured');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an AI assistant specialized in Community Corrections data analysis. 

Context: ${context}

Question: ${prompt}

Please provide a detailed answer based on the context provided.`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    } catch (error) {
      console.error('Google Gemini generation error:', error);
      throw error;
    }
  }

  // Sentiment analysis using Hugging Face
  static async analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('Hugging Face API key not configured');

    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: text }),
        }
      );

      if (!response.ok) {
        throw new Error(`Hugging Face sentiment API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data[0] || { label: 'NEUTRAL', score: 0.5 };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return { label: 'NEUTRAL', score: 0.5 };
    }
  }

  // Get current news about community corrections
  static async getCommunityCorrectionsNews(): Promise<any[]> {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) throw new Error('News API key not configured');

    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q="community corrections" OR "probation" OR "parole"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`News API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.articles || [];
    } catch (error) {
      console.error('News API error:', error);
      return [];
    }
  }

  // Store configuration in JSONBin
  static async storeConfiguration(config: any): Promise<string> {
    const apiKey = process.env.JSONBIN_API_KEY;
    if (!apiKey) throw new Error('JSONBin API key not configured');

    try {
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': apiKey,
          'X-Bin-Name': 'community-corrections-config'
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`JSONBin API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.metadata.id;
    } catch (error) {
      console.error('JSONBin storage error:', error);
      throw error;
    }
  }

  // Retrieve configuration from JSONBin
  static async getConfiguration(binId: string): Promise<any> {
    const apiKey = process.env.JSONBIN_API_KEY;
    if (!apiKey) throw new Error('JSONBin API key not configured');

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
        headers: {
          'X-Master-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`JSONBin API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.record;
    } catch (error) {
      console.error('JSONBin retrieval error:', error);
      throw error;
    }
  }
}