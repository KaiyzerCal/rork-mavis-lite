import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const approveProposalProcedure = protectedProcedure
  .input(
    z.object({
      proposalId: z.string(),
    })
  )
  .mutation(async ({ input }: { input: { proposalId: string } }) => {
    console.log('[Proposals] Approving proposal:', input.proposalId);
    
    return {
      id: input.proposalId,
      status: 'approved' as const,
      updatedAt: new Date().toISOString(),
    };
  });

export default approveProposalProcedure;
