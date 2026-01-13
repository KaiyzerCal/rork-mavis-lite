import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';

export default publicProcedure
  .input(z.object({
    text: z.string().min(1).max(4096),
    voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional().default('nova'),
    model: z.enum(['tts-1', 'tts-1-hd']).optional().default('tts-1'),
    speed: z.number().min(0.25).max(4.0).optional().default(1.0),
  }))
  .mutation(async ({ input }) => {
    const { text, voice, model, speed } = input;
    const timestamp = new Date().toISOString();

    console.log('[TTS] Generating speech, voice:', voice, 'model:', model, 'text length:', text.length);

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured for TTS. Please add OPENAI_API_KEY to environment variables.',
          timestamp,
        };
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          speed,
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `TTS failed with status ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');

      return {
        success: true,
        audio: {
          base64Data: base64Audio,
          mimeType: 'audio/mpeg',
          format: 'mp3',
        },
        voice,
        model,
        textLength: text.length,
        timestamp,
      };
    } catch (error) {
      console.error('[TTS] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  });
