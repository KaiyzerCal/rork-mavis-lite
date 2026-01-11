import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const applyProposalProcedure = protectedProcedure
  .input(
    z.object({
      proposalId: z.string(),
    })
  )
  .mutation(async ({ input }: { input: { proposalId: string } }) => {
    console.log('[Proposals] Applying proposal:', input.proposalId);
    
    return {
      id: input.proposalId,
      status: 'applied' as const,
      appliedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

export default applyProposalProcedure;
