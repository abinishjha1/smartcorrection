# Free APIs Integration Guide

This document explains how to set up and use the free APIs integrated into the Community Corrections RAG system.

## Available Free APIs

### 1. Hugging Face API
- **Purpose**: Text embeddings, sentiment analysis
- **Free Tier**: 30,000 requests/month
- **Setup**: Get API key from [Hugging Face](https://huggingface.co/settings/tokens)
- **Models Used**: 
  - `sentence-transformers/all-MiniLM-L6-v2` for embeddings
  - `cardiffnlp/twitter-roberta-base-sentiment-latest` for sentiment

### 2. Cohere API
- **Purpose**: Text generation, embeddings
- **Free Tier**: 100 requests/minute, 1000 requests/month
- **Setup**: Get API key from [Cohere](https://dashboard.cohere.ai/api-keys)
- **Model**: `command-light` (free tier)

### 3. Groq API
- **Purpose**: Fast inference with open-source models
- **Free Tier**: 14,400 requests/day
- **Setup**: Get API key from [Groq](https://console.groq.com/keys)
- **Model**: `llama3-8b-8192`

### 4. Together AI
- **Purpose**: Open-source LLMs (Llama, Mistral, etc.)
- **Free Tier**: $25 credit
- **Setup**: Get API key from [Together AI](https://api.together.xyz/settings/api-keys)
- **Model**: `togethercomputer/llama-2-7b-chat`

### 5. Google Gemini API
- **Purpose**: Text generation and embeddings
- **Free Tier**: 60 requests/minute
- **Setup**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Model**: `gemini-pro`

### 6. NewsAPI
- **Purpose**: Current news about community corrections
- **Free Tier**: 1000 requests/day
- **Setup**: Get API key from [NewsAPI](https://newsapi.org/register)

### 7. JSONBin
- **Purpose**: Store configuration and templates
- **Free Tier**: 10K requests/month
- **Setup**: Get API key from [JSONBin](https://jsonbin.io/)

## Setup Instructions

1. **Get API Keys**: Visit each service and create free accounts to get API keys
2. **Update .env file**: Add your API keys to the `.env` file
3. **Test APIs**: The system will automatically fallback between APIs

## API Fallback Strategy

The system uses a smart fallback strategy:

1. **Primary**: OpenAI (if available)
2. **Fallback 1**: Groq (fastest free option)
3. **Fallback 2**: Google Gemini
4. **Fallback 3**: Cohere
5. **Fallback 4**: Together AI
6. **Final Fallback**: Content analysis (no API required)

## Usage Examples

### Text Generation with Multiple APIs
```typescript
import { EnhancedRAGService } from './server/services/enhancedRagService';

const response = await EnhancedRAGService.processQueryWithFallbacks(
  "What did Nathan say about work stress?"
);
```

### Sentiment Analysis
```typescript
import { FreeApiService } from './server/services/freeApiService';

const sentiment = await FreeApiService.analyzeSentiment(
  "I'm feeling stressed about the property taxes"
);
// Returns: { label: 'NEGATIVE', score: 0.8 }
```

### Get Community Corrections News
```typescript
const news = await FreeApiService.getCommunityCorrectionsNews();
// Returns array of recent news articles
```

## Benefits

1. **Cost Reduction**: Significantly reduces API costs
2. **Reliability**: Multiple fallbacks ensure system always works
3. **Performance**: Some free APIs (like Groq) are faster than paid options
4. **Features**: Additional capabilities like sentiment analysis and news
5. **Scalability**: Higher rate limits across multiple services

## Rate Limits Management

The system automatically handles rate limits by:
- Trying APIs in order of preference
- Falling back when rate limits are hit
- Using content analysis when all APIs are exhausted
- Caching responses to reduce API calls

## Monitoring

Monitor API usage through:
- Console logs showing which API was used
- Error handling for rate limit exceeded
- Automatic fallback notifications
- Usage tracking in the reasoning field of responses

## Best Practices

1. **Set up multiple APIs** for better reliability
2. **Monitor usage** to stay within free tiers
3. **Use caching** to reduce API calls
4. **Implement retry logic** for temporary failures
5. **Keep API keys secure** in environment variables