import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresAt: z.string(),
    scopes: z.array(z.string()),
  }))
  .mutation(async ({ input }) => {
    const { userId, accessToken, refreshToken, expiresAt, scopes } = input;
    const timestamp = new Date().toISOString();

    console.log('[Google Auth] Storing tokens for user:', userId);

    try {
      const existing = await query(`SELECT * FROM google_auth WHERE userId = $userId LIMIT 1`, { userId });

      const authData = {
        userId,
        accessToken,
        refreshToken: refreshToken || '',
        expiresAt,
        scopes: JSON.stringify(scopes),
        updatedAt: timestamp,
      };

      if (!existing || existing.length === 0) {
        await query(`INSERT INTO google_auth (userId, accessToken, refreshToken, expiresAt, scopes, createdAt, updatedAt) VALUES ($userId, $accessToken, $refreshToken, $expiresAt, $scopes, $updatedAt, $updatedAt)`, { ...authData, createdAt: timestamp });
      } else {
        await query(`UPDATE google_auth SET accessToken = $accessToken, refreshToken = $refreshToken, expiresAt = $expiresAt, scopes = $scopes, updatedAt = $updatedAt WHERE userId = $userId`, authData);
      }

      return {
        success: true,
        timestamp,
        scopes,
      };
    } catch (error) {
      console.error('[Google Auth] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
