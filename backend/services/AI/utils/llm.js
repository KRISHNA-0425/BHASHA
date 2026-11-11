import { ChatOpenRouter } from '@langchain/openrouter';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
    console.warn('[WARN] OPENROUTER_API_KEY is not defined in environment variables.');
}

const modelName = process.env.OPENROUTER_MODEL;
if (!modelName) {
    console.warn('[WARN] OPENROUTER_MODEL is not defined in environment variables.');
}

const fallbackModels = (process.env.OPENROUTER_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);

// OpenRouter allows at most 3 items in the models array
const activeModels = Array.from(
    new Set([modelName, ...fallbackModels].filter(Boolean))
).slice(0, 3);

// Cost-controlled OpenRouter LLM configuration driven strictly by .env variables
const llm = new ChatOpenRouter({
    apiKey,
    model: modelName,
    temperature: 0.1,
    maxTokens: Number(process.env.MAX_TOKENS) || 4096,
    maxRetries: 0,
    timeout: 60000,
    modelKwargs: {
        ...(activeModels.length > 0 ? { models: activeModels } : {}),
        provider: {
            allow_fallbacks: activeModels.length > 1,
            max_price: {
                prompt: 0,
                completion: 0
            }
        }
    }
});

export default llm;
