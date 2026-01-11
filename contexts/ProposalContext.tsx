import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';

import { trpc } from '@/lib/trpc';
import { useApp } from './AppContext';
import type { Quest } from '@/types';

export interface Proposal {
  id: string;
  type: 'create_quest' | 'update_stats' | 'add_memory' | 'log_vault' | 'update_navi_profile';
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  payload: Record<string, any>;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  appliedAt?: string;
}

export const [ProposalProvider, useProposals] = createContextHook(() => {
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const { addQuest, addMemoryItem, addVaultEntry, updateCharacterClassXP, updateNaviProfile } = useApp();
  
  const createProposalMutation = trpc.proposals.create.useMutation();
  const approveProposalMutation = trpc.proposals.approve.useMutation();
  const rejectProposalMutation = trpc.proposals.reject.useMutation();
  const applyProposalMutation = trpc.proposals.apply.useMutation();
  
  const createProposal = useCallback(async (
    type: Proposal['type'],
    payload: Record<string, any>,
    reason?: string
  ): Promise<Proposal> => {
    console.log('[ProposalContext] Creating proposal:', { type, payload, reason });
    
    const result = await createProposalMutation.mutateAsync({
      type,
      payload,
      reason,
    });
    
    const proposal: Proposal = {
      ...result,
      status: 'pending',
    };
    
    setPendingProposals(prev => [...prev, proposal]);
    
    return proposal;
  }, [createProposalMutation]);
  
  const approveProposal = useCallback(async (proposalId: string) => {
    console.log('[ProposalContext] Approving proposal:', proposalId);
    
    const proposal = pendingProposals.find(p => p.id === proposalId);
    if (!proposal) {
      console.error('[ProposalContext] Proposal not found:', proposalId);
      return;
    }
    
    await approveProposalMutation.mutateAsync({ proposalId });
    
    setPendingProposals(prev => 
      prev.map(p => p.id === proposalId ? { ...p, status: 'approved' as const } : p)
    );
  }, [pendingProposals, approveProposalMutation]);
  
  const rejectProposal = useCallback(async (proposalId: string, reason?: string) => {
    console.log('[ProposalContext] Rejecting proposal:', proposalId, reason);
    
    await rejectProposalMutation.mutateAsync({ proposalId, reason });
    
    setPendingProposals(prev => 
      prev.filter(p => p.id !== proposalId)
    );
  }, [rejectProposalMutation]);
  
  const applyProposal = useCallback(async (proposalId: string) => {
    console.log('[ProposalContext] Applying proposal:', proposalId);
    
    const proposal = pendingProposals.find(p => p.id === proposalId);
    if (!proposal) {
      console.error('[ProposalContext] Proposal not found:', proposalId);
      return;
    }
    
    try {
      switch (proposal.type) {
        case 'create_quest': {
          const questData = proposal.payload as Omit<Quest, 'id' | 'createdAt' | 'status'>;
          addQuest(questData);
          console.log('[ProposalContext] Quest created:', questData.title);
          break;
        }
        
        case 'add_memory': {
          const memoryData = proposal.payload;
          addMemoryItem({
            type: memoryData.type || 'insight',
            content: memoryData.content,
            importanceScore: memoryData.importanceScore || 5,
            sourceTags: memoryData.sourceTags || [],
          });
          console.log('[ProposalContext] Memory added');
          break;
        }
        
        case 'log_vault': {
          const vaultData = proposal.payload;
          addVaultEntry({
            title: vaultData.title,
            content: vaultData.content,
            type: vaultData.type || 'reflection',
            tags: vaultData.tags || [],
            mood: vaultData.mood,
          });
          console.log('[ProposalContext] Vault entry created');
          break;
        }
        
        case 'update_stats': {
          const statsData = proposal.payload;
          if (statsData.xp) {
            updateCharacterClassXP(statsData.xp);
            console.log('[ProposalContext] Stats updated, XP:', statsData.xp);
          }
          break;
        }
        
        case 'update_navi_profile': {
          const profileData = proposal.payload;
          updateNaviProfile(profileData);
          console.log('[ProposalContext] Navi profile updated');
          break;
        }
      }
      
      await applyProposalMutation.mutateAsync({ proposalId });
      
      setPendingProposals(prev => 
        prev.filter(p => p.id !== proposalId)
      );
      
      console.log('[ProposalContext] Proposal applied successfully');
    } catch (error) {
      console.error('[ProposalContext] Failed to apply proposal:', error);
      throw error;
    }
  }, [pendingProposals, addQuest, addMemoryItem, addVaultEntry, updateCharacterClassXP, updateNaviProfile, applyProposalMutation]);
  
  const approveAndApplyProposal = useCallback(async (proposalId: string) => {
    await approveProposal(proposalId);
    await applyProposal(proposalId);
  }, [approveProposal, applyProposal]);
  
  return {
    pendingProposals,
    createProposal,
    approveProposal,
    rejectProposal,
    applyProposal,
    approveAndApplyProposal,
  };
});
