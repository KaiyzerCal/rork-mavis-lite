import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export default publicProcedure
  .input(z.object({
    messages: z.array(messageSchema),
    model: z.string().optional().default('gpt-4o-mini'),
    temperature: z.number().min(0).max(2).optional().default(0.7),
    maxTokens: z.number().min(1).max(4096).optional().default(1024),
    systemPrompt: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { messages, model, temperature, maxTokens, systemPrompt } = input;
    const timestamp = new Date().toISOString();

    console.log('[OpenAI Chat] Processing request, model:', model, 'messages:', messages.length);

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        console.log('[OpenAI Chat] API key not configured');
        return {
          success: false,
          error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.',
          timestamp,
        };
      }

      const fullMessages = systemPrompt 
        ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
        : messages;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: fullMessages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API request failed');
      }

      const assistantMessage = data.choices?.[0]?.message?.content || '';

      return {
        success: true,
        message: assistantMessage,
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
        finishReason: data.choices?.[0]?.finish_reason,
        timestamp,
      };
    } catch (error) {
      console.error('[OpenAI Chat] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  });
