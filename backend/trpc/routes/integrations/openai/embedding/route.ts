import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

export default publicProcedure
  .input(z.object({
    text: z.string().min(1),
    model: z.string().optional().default('text-embedding-3-small'),
  }))
  .mutation(async ({ input }) => {
    const { text, model } = input;
    const timestamp = new Date().toISOString();

    console.log('[OpenAI Embedding] Creating embedding, model:', model, 'text length:', text.length);

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
          timestamp,
        };
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Embedding creation failed');
      }

      return {
        success: true,
        embedding: data.data?.[0]?.embedding || [],
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        timestamp,
      };
    } catch (error) {
      console.error('[OpenAI Embedding] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  });
