import { z } from 'zod';
import { publicProcedure } from '@/backend/trpc/create-context';
import { query } from '@/backend/trpc/db-client';

export default publicProcedure
  .input(z.object({
    userId: z.string(),
    identityToken: z.string(),
    authorizationCode: z.string(),
    email: z.string().optional(),
    fullName: z.object({
      givenName: z.string().optional(),
      familyName: z.string().optional(),
    }).optional(),
    scopes: z.array(z.string()).optional(),
  }))
  .mutation(async ({ input }) => {
    const { userId, identityToken, authorizationCode, email, fullName, scopes } = input;
    const timestamp = new Date().toISOString();

    console.log('[Apple Auth] Storing tokens for user:', userId);

    try {
      const existing = await query(`SELECT * FROM apple_auth WHERE userId = $userId LIMIT 1`, { userId });

      const authData = {
        userId,
        identityToken,
        authorizationCode,
        email: email || '',
        givenName: fullName?.givenName || '',
        familyName: fullName?.familyName || '',
        scopes: JSON.stringify(scopes || []),
        updatedAt: timestamp,
      };

      if (!existing || existing.length === 0) {
        await query(`INSERT INTO apple_auth (userId, identityToken, authorizationCode, email, givenName, familyName, scopes, createdAt, updatedAt) VALUES ($userId, $identityToken, $authorizationCode, $email, $givenName, $familyName, $scopes, $updatedAt, $updatedAt)`, { ...authData, createdAt: timestamp });
      } else {
        await query(`UPDATE apple_auth SET identityToken = $identityToken, authorizationCode = $authorizationCode, email = $email, givenName = $givenName, familyName = $familyName, scopes = $scopes, updatedAt = $updatedAt WHERE userId = $userId`, authData);
      }

      return {
        success: true,
        timestamp,
        email,
        fullName,
      };
    } catch (error) {
      console.error('[Apple Auth] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
