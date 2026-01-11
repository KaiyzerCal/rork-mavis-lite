import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

import { useApp } from '@/contexts/AppContext';

export default function Stats() {
  const { state, isLoaded } = useApp();
  const insets = useSafeAreaInsets();

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const maxStatValue = 100;

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Player Stats</Text>
          <Text style={styles.subtitle}>Monitor your growth</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.overviewCard}>
            <Text style={styles.overviewTitle}>Life Balance Overview</Text>
            <Text style={styles.overviewSubtitle}>
              Track your progress across all areas of life
            </Text>

            <View style={styles.radarContainer}>
              {state.stats.map((stat, statIdx) => {
                const angle = (statIdx / state.stats.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 80;
                const x = Math.cos(angle) * radius * (stat.value / maxStatValue);
                const y = Math.sin(angle) * radius * (stat.value / maxStatValue);

                return (
                  <View
                    key={`radar-point-${stat.id}-${statIdx}`}
                    style={[
                      styles.radarPoint,
                      {
                        left: '50%',
                        top: '50%',
                        transform: [
                          { translateX: x },
                          { translateY: y },
                          { translateX: -4 },
                          { translateY: -4 },
                        ],
                      },
                    ]}
                  />
                );
              })}
              {state.stats.map((stat, statLabelIdx) => {
                const angle = (statLabelIdx / state.stats.length) * 2 * Math.PI - Math.PI / 2;
                const radius = 100;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <View
                    key={`radar-label-${stat.id}-${statLabelIdx}`}
                    style={[
                      styles.radarLabel,
                      {
                        left: '50%',
                        top: '50%',
                        transform: [
                          { translateX: x },
                          { translateY: y },
                        ],
                      },
                    ]}
                  >
                    <Text style={styles.radarLabelText}>{stat.name}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.statsGrid}>
            {state.stats.map((stat, sIdx) => (
              <View key={`stat-card-${stat.id}-${sIdx}`} style={styles.statCard}>
                <View style={styles.statHeader}>
                  <Text style={styles.statName}>{stat.name}</Text>
                  <View
                    style={[
                      styles.deltaBadge,
                      {
                        backgroundColor:
                          stat.delta > 0
                            ? '#dcfce7'
                            : stat.delta < 0
                              ? '#fee2e2'
                              : '#f1f5f9',
                      },
                    ]}
                  >
                    {stat.delta > 0 ? (
                      <TrendingUp size={12} color="#10b981" strokeWidth={2.5} />
                    ) : stat.delta < 0 ? (
                      <TrendingDown size={12} color="#ef4444" strokeWidth={2.5} />
                    ) : null}
                    <Text
                      style={[
                        styles.deltaText,
                        {
                          color:
                            stat.delta > 0
                              ? '#10b981'
                              : stat.delta < 0
                                ? '#ef4444'
                                : '#64748b',
                        },
                      ]}
                    >
                      {stat.delta > 0 ? '+' : ''}{stat.delta}
                    </Text>
                  </View>
                </View>

                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statMax}>/ 100</Text>
                </View>

                <View style={styles.statBarContainer}>
                  <View
                    style={[
                      styles.statBar,
                      {
                        width: `${stat.value}%`,
                        backgroundColor:
                          stat.value >= 75
                            ? '#10b981'
                            : stat.value >= 50
                              ? '#f59e0b'
                              : '#ef4444',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
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
    paddingVertical: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
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
  overviewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
  },
  radarContainer: {
    height: 280,
    position: 'relative',
    marginVertical: 20,
  },
  radarPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366f1',
  },
  radarLabel: {
    position: 'absolute',
  },
  radarLabelText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#0f172a',
    textAlign: 'center',
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  deltaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  deltaText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#0f172a',
  },
  statMax: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#94a3b8',
    marginLeft: 4,
  },
  statBarContainer: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
  },
});
