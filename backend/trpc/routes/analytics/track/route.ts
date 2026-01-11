import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    eventType: z.string(),
    eventData: z.record(z.string(), z.any()).optional(),
    screen: z.string().optional(),
    sessionId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, eventType, eventData, screen, sessionId } = input;
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    console.log('[Analytics] Tracking event:', eventType, 'for user:', userId);

    try {
      await query(`INSERT INTO analytics_events (id, userId, eventType, eventData, screen, sessionId, timestamp) VALUES ($id, $userId, $eventType, $eventData, $screen, $sessionId, $timestamp)`, {
        id: eventId,
        userId,
        eventType,
        eventData: JSON.stringify(eventData || {}),
        screen: screen || '',
        sessionId: sessionId || '',
        timestamp,
      });

      return {
        success: true,
        eventId,
        timestamp,
      };
    } catch (error) {
      console.error('[Analytics] Error tracking event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
