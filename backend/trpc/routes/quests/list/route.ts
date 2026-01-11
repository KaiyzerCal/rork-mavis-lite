import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const listQuestsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(['pending', 'active', 'completed', 'declined']).optional(),
    }).optional()
  )
  .query(async ({ input }: { input?: { status?: 'pending' | 'active' | 'completed' | 'declined' } }) => {
    console.log('[Quests] Listing quests with filter:', input);
    
    return [];
  });

export default listQuestsProcedure;
