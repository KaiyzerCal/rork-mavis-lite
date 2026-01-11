import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const listProposalsProcedure = protectedProcedure
  .input(
    z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'applied']).optional(),
      limit: z.number().optional(),
    }).optional()
  )
  .query(async ({ input }: { input?: { status?: 'pending' | 'approved' | 'rejected' | 'applied'; limit?: number } }) => {
    console.log('[Proposals] Listing proposals with filter:', input);
    
    return [];
  });

export default listProposalsProcedure;
