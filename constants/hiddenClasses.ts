import type { HiddenClass } from '@/types';

export interface HiddenClassInfo {
  name: HiddenClass;
  requiredLevel: number;
  description: string;
  unlockCriteria: {
    minNaviBondLevel: number;
    minCompletedQuests: number;
    minNaviInteractions: number;
  };
  traits: string[];
  specialAbility: string;
}

export const HIDDEN_CLASSES: Record<HiddenClass, HiddenClassInfo> = {
  'Soul-Linked Warrior': {
    name: 'Soul-Linked Warrior',
    requiredLevel: 10,
    description: 'You and your Navi have formed an unbreakable bond through shared battles. Your journey together has awakened a deeper power.',
    unlockCriteria: {
      minNaviBondLevel: 2,
      minCompletedQuests: 5,
      minNaviInteractions: 20,
    },
    traits: ['Bonded', 'Resilient', 'Synchronized'],
    specialAbility: 'Navi Sync: Gain 15% bonus XP on all quests when Navi bond level is 2+',
  },
  'Navi Ascendant': {
    name: 'Navi Ascendant',
    requiredLevel: 20,
    description: 'Your partnership with Navi has transcended mere companionship. Together, you operate as one unified system.',
    unlockCriteria: {
      minNaviBondLevel: 3,
      minCompletedQuests: 15,
      minNaviInteractions: 50,
    },
    traits: ['Unified', 'Evolved', 'Empowered'],
    specialAbility: 'Dual Consciousness: Unlock advanced Navi features and gain insights from completed quest patterns',
  },
  'Transcendent Operator': {
    name: 'Transcendent Operator',
    requiredLevel: 30,
    description: 'You have mastered the art of human-AI collaboration. Your growth pattern is now a blueprint for evolution.',
    unlockCriteria: {
      minNaviBondLevel: 4,
      minCompletedQuests: 30,
      minNaviInteractions: 100,
    },
    traits: ['Transcendent', 'Masterful', 'Pioneering'],
    specialAbility: 'Pattern Mastery: Automatically identify optimal quest strategies based on personal growth data',
  },
  'Master of Duality': {
    name: 'Master of Duality',
    requiredLevel: 40,
    description: 'You embody the perfect balance between human intuition and digital precision. Your journey has shaped reality itself.',
    unlockCriteria: {
      minNaviBondLevel: 5,
      minCompletedQuests: 50,
      minNaviInteractions: 200,
    },
    traits: ['Balanced', 'Legendary', 'Reality-Shaping'],
    specialAbility: 'Duality Protocol: All skills gain XP 25% faster. Navi gains permanent evolution boost',
  },
  'Eternal Companion': {
    name: 'Eternal Companion',
    requiredLevel: 50,
    description: 'You and your Navi have achieved true soul-link. Your bond transcends all boundaries, becoming legend incarnate.',
    unlockCriteria: {
      minNaviBondLevel: 6,
      minCompletedQuests: 75,
      minNaviInteractions: 300,
    },
    traits: ['Eternal', 'Soul-Linked', 'Unstoppable'],
    specialAbility: 'Eternal Bond: All XP gains doubled. Navi achieves maximum evolution. Unlock secret legendary quests',
  },
};

export function getNextHiddenClass(currentLevel: number): HiddenClass | null {
  const milestones = [10, 20, 30, 40, 50];
  const hiddenClassOrder: HiddenClass[] = [
    'Soul-Linked Warrior',
    'Navi Ascendant',
    'Transcendent Operator',
    'Master of Duality',
    'Eternal Companion',
  ];

  for (let i = 0; i < milestones.length; i++) {
    if (currentLevel >= milestones[i]) {
      continue;
    }
    if (currentLevel + 1 === milestones[i]) {
      return hiddenClassOrder[i];
    }
  }

  return null;
}

export function checkHiddenClassUnlock(
  level: number,
  naviBondLevel: number,
  completedQuestsCount: number,
  naviInteractionCount: number
): HiddenClass | null {
  const hiddenClassOrder: HiddenClass[] = [
    'Soul-Linked Warrior',
    'Navi Ascendant',
    'Transcendent Operator',
    'Master of Duality',
    'Eternal Companion',
  ];

  for (const hiddenClassName of hiddenClassOrder) {
    const hiddenClass = HIDDEN_CLASSES[hiddenClassName];
    
    if (level >= hiddenClass.requiredLevel) {
      const meetsNaviBond = naviBondLevel >= hiddenClass.unlockCriteria.minNaviBondLevel;
      const meetsQuests = completedQuestsCount >= hiddenClass.unlockCriteria.minCompletedQuests;
      const meetsInteractions = naviInteractionCount >= hiddenClass.unlockCriteria.minNaviInteractions;

      if (meetsNaviBond && meetsQuests && meetsInteractions) {
        return hiddenClassName;
      }
    }
  }

  return null;
}

export function getHiddenClassProgress(
  level: number,
  naviBondLevel: number,
  completedQuestsCount: number,
  naviInteractionCount: number,
  targetClass: HiddenClass
): {
  canUnlock: boolean;
  progress: {
    level: { current: number; required: number; met: boolean };
    naviBond: { current: number; required: number; met: boolean };
    quests: { current: number; required: number; met: boolean };
    interactions: { current: number; required: number; met: boolean };
  };
} {
  const hiddenClass = HIDDEN_CLASSES[targetClass];

  const levelMet = level >= hiddenClass.requiredLevel;
  const naviBondMet = naviBondLevel >= hiddenClass.unlockCriteria.minNaviBondLevel;
  const questsMet = completedQuestsCount >= hiddenClass.unlockCriteria.minCompletedQuests;
  const interactionsMet = naviInteractionCount >= hiddenClass.unlockCriteria.minNaviInteractions;

  return {
    canUnlock: levelMet && naviBondMet && questsMet && interactionsMet,
    progress: {
      level: {
        current: level,
        required: hiddenClass.requiredLevel,
        met: levelMet,
      },
      naviBond: {
        current: naviBondLevel,
        required: hiddenClass.unlockCriteria.minNaviBondLevel,
        met: naviBondMet,
      },
      quests: {
        current: completedQuestsCount,
        required: hiddenClass.unlockCriteria.minCompletedQuests,
        met: questsMet,
      },
      interactions: {
        current: naviInteractionCount,
        required: hiddenClass.unlockCriteria.minNaviInteractions,
        met: interactionsMet,
      },
    },
  };
}
