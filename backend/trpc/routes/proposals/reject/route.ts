import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const rejectProposalProcedure = protectedProcedure
  .input(
    z.object({
      proposalId: z.string(),
      reason: z.string().optional(),
    })
  )
  .mutation(async ({ input }: { input: { proposalId: string; reason?: string } }) => {
    console.log('[Proposals] Rejecting proposal:', input.proposalId, 'reason:', input.reason);
    
    return {
      id: input.proposalId,
      status: 'rejected' as const,
      updatedAt: new Date().toISOString(),
    };
  });

export default rejectProposalProcedure;
