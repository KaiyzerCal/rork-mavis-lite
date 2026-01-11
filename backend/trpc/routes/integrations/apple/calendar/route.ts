import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export const getAppleCalendarEvents = publicProcedure
  .input(z.object({
    userId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { userId, startDate, endDate } = input;

    console.log('[Apple Calendar] Fetching events for user:', userId);

    try {
      const authResult = await query(`SELECT * FROM apple_auth WHERE userId = $userId LIMIT 1`, { userId });

      if (!authResult || authResult.length === 0) {
        return {
          success: false,
          error: 'No Apple authentication found. Please connect your Apple account.',
          events: [],
        };
      }

      const now = new Date();
      const defaultStartDate = startDate || now.toISOString();
      const defaultEndDate = endDate || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const eventsResult = await query(`
        SELECT * FROM apple_calendar_events 
        WHERE userId = $userId 
        AND startTime >= $startDate 
        AND startTime <= $endDate
        ORDER BY startTime ASC
      `, { userId, startDate: defaultStartDate, endDate: defaultEndDate });

      const events = (eventsResult || []).map((event: any) => ({
        id: event.id,
        title: event.title || 'Untitled Event',
        description: event.description || '',
        startTime: event.startTime,
        endTime: event.endTime,
        location: event.location || '',
        isAllDay: event.isAllDay || false,
        calendarId: event.calendarId,
      }));

      return {
        success: true,
        events,
        count: events.length,
      };
    } catch (error) {
      console.error('[Apple Calendar] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events: [],
      };
    }
  });

export const createAppleCalendarEvent = publicProcedure
  .input(z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().optional(),
    isAllDay: z.boolean().optional(),
    calendarId: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, title, description, startTime, endTime, location, isAllDay, calendarId } = input;
    const eventId = `apple-event-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date().toISOString();

    console.log('[Apple Calendar] Creating event for user:', userId);

    try {
      const authResult = await query(`SELECT * FROM apple_auth WHERE userId = $userId LIMIT 1`, { userId });

      if (!authResult || authResult.length === 0) {
        return {
          success: false,
          error: 'No Apple authentication found. Please connect your Apple account.',
        };
      }

      await query(`INSERT INTO apple_calendar_events (id, userId, title, description, startTime, endTime, location, isAllDay, calendarId, createdAt, updatedAt) VALUES ($id, $userId, $title, $description, $startTime, $endTime, $location, $isAllDay, $calendarId, $createdAt, $updatedAt)`, {
        id: eventId,
        userId,
        title,
        description: description || '',
        startTime,
        endTime,
        location: location || '',
        isAllDay: isAllDay || false,
        calendarId: calendarId || 'default',
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      return {
        success: true,
        event: {
          id: eventId,
          title,
          startTime,
          endTime,
        },
      };
    } catch (error) {
      console.error('[Apple Calendar] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

export const syncAppleCalendar = publicProcedure
  .input(z.object({
    userId: z.string(),
    events: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      startTime: z.string(),
      endTime: z.string(),
      location: z.string().optional(),
      isAllDay: z.boolean().optional(),
      calendarId: z.string().optional(),
    })),
  }))
  .mutation(async ({ input }) => {
    const { userId, events } = input;
    const timestamp = new Date().toISOString();

    console.log('[Apple Calendar] Syncing', events.length, 'events for user:', userId);

    try {
      let synced = 0;
      for (const event of events) {
        const existing = await query(`SELECT * FROM apple_calendar_events WHERE id = $id LIMIT 1`, { id: event.id });
        
        if (!existing || existing.length === 0) {
          await query(`INSERT INTO apple_calendar_events (id, userId, title, description, startTime, endTime, location, isAllDay, calendarId, createdAt, updatedAt) VALUES ($id, $userId, $title, $description, $startTime, $endTime, $location, $isAllDay, $calendarId, $createdAt, $updatedAt)`, {
            id: event.id,
            userId,
            title: event.title,
            description: event.description || '',
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location || '',
            isAllDay: event.isAllDay || false,
            calendarId: event.calendarId || 'default',
            createdAt: timestamp,
            updatedAt: timestamp,
          });
        } else {
          await query(`UPDATE apple_calendar_events SET title = $title, description = $description, startTime = $startTime, endTime = $endTime, location = $location, isAllDay = $isAllDay, updatedAt = $updatedAt WHERE id = $id`, {
            id: event.id,
            title: event.title,
            description: event.description || '',
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location || '',
            isAllDay: event.isAllDay || false,
            updatedAt: timestamp,
          });
        }
        synced++;
      }

      return {
        success: true,
        syncedCount: synced,
        timestamp,
      };
    } catch (error) {
      console.error('[Apple Calendar] Sync Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

export default getAppleCalendarEvents;
