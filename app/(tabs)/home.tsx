import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkle, MessageCircle, Target, TrendingUp } from 'lucide-react-native';
import { router } from 'expo-router';

import { useApp } from '@/contexts/AppContext';

export default function Home() {
  const { state, isLoaded, calculateLevel } = useApp();
  const insets = useSafeAreaInsets();

  const totalXP = state.leaderboard.find(l => l.id === 'me')?.xp || 0;
  const playerLevel = calculateLevel(totalXP);
  const naviProfile = state.settings.navi.profile;
  const activeQuests = state.quests.filter(q => q.status === 'active');




  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = useMemo(() => getGreeting(), []);

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting}, Operator</Text>
            <Text style={styles.subGreeting}>Let&apos;s level up today</Text>
          </View>
          <View style={styles.levelBadge}>
            <TrendingUp size={16} color="#ffffff" />
            <Text style={styles.levelText}>Lv {playerLevel}</Text>
          </View>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

          <TouchableOpacity
            style={styles.naviCard}
            onPress={() => router.push('/mavis')}
            activeOpacity={0.8}
          >
            <View style={styles.naviAvatarContainer}>
              <Sparkle size={40} color="#6366f1" fill="#6366f1" />
            </View>
            <View style={styles.naviContent}>
              <Text style={styles.naviLabel}>Your Net-Navi</Text>
              <Text style={styles.naviName}>{naviProfile.name}</Text>
              <View style={styles.naviBondBadge}>
                <Text style={styles.naviBondText}>Bond Lv {naviProfile.bondLevel}</Text>
              </View>
            </View>
            <MessageCircle size={24} color="#6366f1" />
          </TouchableOpacity>




          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/mavis')}
                activeOpacity={0.7}
              >
                <MessageCircle size={32} color="#6366f1" />
                <Text style={styles.actionLabel}>Talk to Navi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/quests')}
                activeOpacity={0.7}
              >
                <Target size={32} color="#10b981" />
                <Text style={styles.actionLabel}>View Quests</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/character')}
                activeOpacity={0.7}
              >
                <TrendingUp size={32} color="#f59e0b" />
                <Text style={styles.actionLabel}>Progress</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => router.push('/vault')}
                activeOpacity={0.7}
              >
                <Sparkle size={32} color="#8b5cf6" />
                <Text style={styles.actionLabel}>Vault</Text>
              </TouchableOpacity>
            </View>
          </View>



          <View style={styles.statsPreview}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXP}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activeQuests.length}</Text>
              <Text style={styles.statLabel}>Active Quests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.skills.length}</Text>
              <Text style={styles.statLabel}>Skills</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subGreeting: {
    fontSize: 18,
    color: '#64748b',
    marginTop: 4,
  },
  levelBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 120,
    flexGrow: 1,
  },
  checkInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#c7d2fe',
    gap: 12,
  },
  checkInBannerContent: {
    flex: 1,
  },
  checkInBannerTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#4338ca',
    marginBottom: 2,
  },
  checkInBannerText: {
    fontSize: 14,
    color: '#6366f1',
  },
  naviCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  naviAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  naviContent: {
    flex: 1,
  },
  naviLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  naviName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 6,
  },
  naviBondBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  naviBondText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#6366f1',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  statusDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  mainGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  mainGoalText: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600' as const,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#6366f1',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  mainQuestCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#fbbf24',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mainQuestIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainQuestContent: {
    flex: 1,
  },
  mainQuestType: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  mainQuestTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 6,
  },
  mainQuestDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 8,
  },
  mainQuestReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainQuestRewardText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#f59e0b',
  },
  quickActions: {
    marginBottom: 24,
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginTop: 12,
    textAlign: 'center',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600' as const,
  },
  taskXP: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskXPText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600' as const,
  },
  statsPreview: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 'auto',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#6366f1',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  modalForm: {
    maxHeight: 400,
  },
  sliderGroup: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  sliderValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
});
