import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

const fetchGoogleCalendar = async (accessToken: string, timeMin: string, timeMax: string) => {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Calendar API error: ${error}`);
  }

  return response.json();
};

export const getCalendarEvents = publicProcedure
  .input(z.object({
    userId: z.string(),
    timeMin: z.string().optional(),
    timeMax: z.string().optional(),
  }))
  .query(async ({ input }) => {
    const { userId, timeMin, timeMax } = input;

    console.log('[Google Calendar] Fetching events for user:', userId);

    try {
      const authResult = await query(`SELECT * FROM google_auth WHERE userId = $userId LIMIT 1`, { userId });

      if (!authResult || authResult.length === 0) {
        return {
          success: false,
          error: 'No Google authentication found. Please connect your Google account.',
          events: [],
        };
      }

      const auth = authResult[0];
      const now = new Date();
      const defaultTimeMin = timeMin || now.toISOString();
      const defaultTimeMax = timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const calendarData = await fetchGoogleCalendar(auth.accessToken, defaultTimeMin, defaultTimeMax);

      const events = (calendarData.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary || 'Untitled Event',
        description: event.description || '',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location || '',
        status: event.status,
        htmlLink: event.htmlLink,
      }));

      return {
        success: true,
        events,
        count: events.length,
      };
    } catch (error) {
      console.error('[Google Calendar] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        events: [],
      };
    }
  });

export const createCalendarEvent = publicProcedure
  .input(z.object({
    userId: z.string(),
    title: z.string(),
    description: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    location: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, title, description, startTime, endTime, location } = input;

    console.log('[Google Calendar] Creating event for user:', userId);

    try {
      const authResult = await query(`SELECT * FROM google_auth WHERE userId = $userId LIMIT 1`, { userId });

      if (!authResult || authResult.length === 0) {
        return {
          success: false,
          error: 'No Google authentication found. Please connect your Google account.',
        };
      }

      const auth = authResult[0];

      const eventData = {
        summary: title,
        description: description || '',
        location: location || '',
        start: {
          dateTime: startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime,
          timeZone: 'UTC',
        },
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create event: ${error}`);
      }

      const createdEvent = await response.json();

      return {
        success: true,
        event: {
          id: createdEvent.id,
          title: createdEvent.summary,
          htmlLink: createdEvent.htmlLink,
        },
      };
    } catch (error) {
      console.error('[Google Calendar] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

export default getCalendarEvents;
