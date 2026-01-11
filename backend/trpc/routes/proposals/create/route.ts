import { z } from "zod";
import { protectedProcedure } from "../../../create-context";

export const createProposalProcedure = protectedProcedure
  .input(
    z.object({
      type: z.enum(['create_quest', 'update_stats', 'add_memory', 'log_vault', 'update_navi_profile']),
      payload: z.record(z.string(), z.any()),
      reason: z.string().optional(),
      threadId: z.string().optional(),
    })
  )
  .mutation(async ({ input }: { input: { type: 'create_quest' | 'update_stats' | 'add_memory' | 'log_vault' | 'update_navi_profile'; payload: Record<string, any>; reason?: string; threadId?: string } }) => {
    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const proposal = {
      id: proposalId,
      userId: 'default-user',
      threadId: input.threadId,
      type: input.type,
      status: 'pending' as const,
      payload: input.payload,
      reason: input.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('[Proposals] Created proposal:', proposal);
    
    return proposal;
  });

export default createProposalProcedure;
