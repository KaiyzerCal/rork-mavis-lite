import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Settings as SettingsIcon, User, Shield, Trash2, FileText, Sparkle, Palette, ChevronRight, ImageIcon, Cloud, CloudOff, RefreshCw, Calendar, Link2, RotateCcw, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';

import { useApp } from '@/contexts/AppContext';
import { useBackendSync } from '@/contexts/BackendSyncContext';
import NaviAvatar from '@/components/NaviAvatar';

import type { NaviPersonalityPreset, NaviSkin, NaviMode, NaviAvatarStyle } from '@/types';
import { NAVI_PERSONALITIES, NAVI_SKINS } from '@/constants/naviPersonalities';

const PERSONALITY_PRESETS: {
  id: NaviPersonalityPreset;
  name: string;
  tagline: string;
}[] = Object.values(NAVI_PERSONALITIES).map(p => ({
  id: p.id as NaviPersonalityPreset,
  name: p.name,
  tagline: p.description.split('.')[0]
}));

const SKIN_PRESETS: {
  id: NaviSkin;
  name: string;
  description: string;
}[] = NAVI_SKINS.map(s => ({
  id: s.id as NaviSkin,
  name: s.name,
  description: s.name
}));

export default function Settings() {
  const { state, isLoaded, clearChatHistory, updateNaviProfile, updateNaviPersonality, updateNaviSkin, updateNaviMode, updateNaviAvatar, deleteMemoryItem, updateNaviName, resetCharacterClass } = useApp();
  const { isSyncing, lastSyncTime, syncError, isOnline, forceSync } = useBackendSync();
  const insets = useSafeAreaInsets();
  const naviProfile = state.settings.navi.profile;

  const [personalityModalVisible, setPersonalityModalVisible] = useState<boolean>(false);
  const [skinModalVisible, setSkinModalVisible] = useState<boolean>(false);
  const [modeModalVisible, setModeModalVisible] = useState<boolean>(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState<boolean>(false);
  const [naviNameModalVisible, setNaviNameModalVisible] = useState<boolean>(false);
  const [tempNaviName, setTempNaviName] = useState<string>(naviProfile.name || 'Navi');

  if (!isLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const handleClearChatHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all chat history with Navi.EXE? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearChatHistory();
            Alert.alert('Chat History Cleared', 'All chat history has been cleared.');
          },
        },
      ]
    );
  };

  const handleClearMemory = () => {
    Alert.alert(
      'Clear Navi.EXE Memory',
      `This will clear all ${state.memoryItems.length} stored memories. Chat history will remain intact. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            state.memoryItems.forEach(item => deleteMemoryItem(item.id));
            Alert.alert('Memory Cleared', 'All Navi.EXE memories have been cleared.');
          },
        },
      ]
    );
  };

  const toggleMemoryEnabled = () => {
    updateNaviProfile({ 
      memoryEnabled: !naviProfile.memoryEnabled 
    });
  };

  return (
    <View style={styles.backgroundWrapper}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <SettingsIcon size={28} color="#6366f1" />
          <View style={styles.headerText}>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>Manage your profile and app preferences</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingIconContainer}>
                <Shield size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Character Class</Text>
                <Text style={styles.settingDescription}>
                  {state.user.characterClass 
                    ? `${state.user.characterClass.archetype} (${state.user.characterClass.mbti})` 
                    : 'Not yet determined'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => {
                Alert.alert(
                  'Retake Assessment',
                  'This will reset your current character class and take you through the 16 Personalities assessment again. Your quests and progress will remain.\n\nAre you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Retake Assessment',
                      style: 'destructive',
                      onPress: () => {
                        resetCharacterClass();
                        router.push('/dashboard');
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#fef3c7' }]}>
                <RotateCcw size={24} color="#d97706" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Retake Character Assessment</Text>
                <Text style={styles.settingDescription}>Redo the 16 Personalities quiz</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <User size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Player Name</Text>
                <Text style={styles.settingDescription}>{state.user.name}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Navi Customization</Text>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => {
                setTempNaviName(naviProfile.name || 'Navi');
                setNaviNameModalVisible(true);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#dcfce7' }]}>
                <Edit3 size={24} color="#16a34a" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Navi Name</Text>
                <Text style={styles.settingDescription}>
                  {naviProfile.name || 'Navi'}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => setPersonalityModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Sparkle size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Personality</Text>
                <Text style={styles.settingDescription}>
                  {PERSONALITY_PRESETS.find(p => p.id === naviProfile.personalityPreset)?.name || 'Unknown'}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => setSkinModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <Palette size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Skin/Theme</Text>
                <Text style={styles.settingDescription}>
                  {SKIN_PRESETS.find(s => s.id === naviProfile.skinId)?.name || 'Unknown'}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => setModeModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <SettingsIcon size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Current Mode</Text>
                <Text style={styles.settingDescription}>
                  {naviProfile.currentMode === 'auto' ? 'Auto' : 
                   naviProfile.currentMode === 'life_os' ? 'Life-OS' :
                   naviProfile.currentMode === 'work_os' ? 'Work-OS' :
                   naviProfile.currentMode === 'social_os' ? 'Social-OS' :
                   'Metaverse-OS'}
                </Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => setAvatarModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.settingIconContainer}>
                <ImageIcon size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Avatar Appearance</Text>
                <Text style={styles.settingDescription}>
                  Customize icon, colors & shape
                </Text>
              </View>
              <View style={styles.avatarPreview}>
                <NaviAvatar
                  style={naviProfile.avatar.style || 'classic'}
                  primaryColor={naviProfile.avatar.primaryColor}
                  secondaryColor={naviProfile.avatar.secondaryColor}
                  backgroundColor={naviProfile.avatar.backgroundColor}
                  size={40}
                  glowEnabled={false}
                />
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Memory & Data</Text>
            
            <View style={styles.settingCard}>
              <View style={styles.settingIconContainer}>
                <Shield size={24} color="#6366f1" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Enable Navi.EXE Memory</Text>
                <Text style={styles.settingDescription}>
                  {naviProfile.memoryEnabled ? 'Memory is ON' : 'Memory is OFF'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={toggleMemoryEnabled}
                style={[
                  styles.toggle,
                  naviProfile.memoryEnabled && styles.toggleActive
                ]}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.toggleThumb,
                  naviProfile.memoryEnabled && styles.toggleThumbActive
                ]} />
              </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
              <FileText size={20} color="#64748b" />
              <Text style={styles.infoText}>
                {state.memoryItems.length} stored memories
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.settingCard}
              onPress={handleClearMemory}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, styles.dangerIconContainer]}>
                <Trash2 size={24} color="#dc2626" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Clear Navi.EXE Memory</Text>
                <Text style={styles.settingDescription}>
                  Remove stored memories (keeps chat history)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={handleClearChatHistory}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, styles.dangerIconContainer]}>
                <Trash2 size={24} color="#dc2626" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Clear Chat History</Text>
                <Text style={styles.settingDescription}>
                  Remove all conversations with Navi.EXE
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cloud Sync & Integrations</Text>
            
            <View style={styles.syncStatusCard}>
              <View style={styles.syncStatusHeader}>
                {isOnline ? (
                  <Cloud size={24} color="#10b981" />
                ) : (
                  <CloudOff size={24} color="#f59e0b" />
                )}
                <View style={styles.syncStatusInfo}>
                  <Text style={styles.syncStatusTitle}>
                    {isOnline ? 'Connected to Backend' : 'Offline Mode'}
                  </Text>
                  <Text style={styles.syncStatusSubtitle}>
                    {lastSyncTime 
                      ? `Last sync: ${new Date(lastSyncTime).toLocaleTimeString()}`
                      : 'Not synced yet'}
                  </Text>
                </View>
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#6366f1" />
                ) : (
                  <TouchableOpacity
                    onPress={forceSync}
                    style={styles.syncButton}
                    activeOpacity={0.7}
                  >
                    <RefreshCw size={20} color="#6366f1" />
                  </TouchableOpacity>
                )}
              </View>
              {syncError && (
                <View style={styles.syncErrorBanner}>
                  <Text style={styles.syncErrorText}>Sync error: {syncError}</Text>
                </View>
              )}
              <View style={styles.syncStats}>
                <View style={styles.syncStatItem}>
                  <Text style={styles.syncStatValue}>{state.quests.length}</Text>
                  <Text style={styles.syncStatLabel}>Quests</Text>
                </View>
                <View style={styles.syncStatItem}>
                  <Text style={styles.syncStatValue}>{state.skills.length}</Text>
                  <Text style={styles.syncStatLabel}>Skills</Text>
                </View>
                <View style={styles.syncStatItem}>
                  <Text style={styles.syncStatValue}>{state.memoryItems.length}</Text>
                  <Text style={styles.syncStatLabel}>Memories</Text>
                </View>
                <View style={styles.syncStatItem}>
                  <Text style={styles.syncStatValue}>
                    {state.chatHistory.reduce((acc, t) => acc + t.messages.length, 0)}
                  </Text>
                  <Text style={styles.syncStatLabel}>Messages</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => {
                Alert.alert(
                  'Google Calendar Integration',
                  'Connect your Google Calendar to sync events with your quests and schedule.\n\nThis feature requires Google OAuth setup. Contact support for API key configuration.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Learn More', onPress: () => {} },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Calendar size={24} color="#2563eb" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Google Calendar</Text>
                <Text style={styles.settingDescription}>Sync events & deadlines</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => {
                Alert.alert(
                  'API Integrations',
                  'Connect external services to enhance your Mavis-Lite experience:\n\n• Google Calendar\n• Gmail notifications\n• Task managers\n• Fitness trackers\n\nAPI configuration available in backend settings.',
                  [{ text: 'OK' }]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Link2 size={24} color="#d97706" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>API Integrations</Text>
                <Text style={styles.settingDescription}>Connect external services</Text>
              </View>
              <ChevronRight size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.infoCard}>
              <FileText size={20} color="#64748b" />
              <Text style={styles.infoText}>Mavis-Lite v1.0</Text>
            </View>
            <Text style={styles.aboutText}>
              A personal growth operating system that helps you level up through goals, quests, skills, and AI coaching.
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={personalityModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPersonalityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Personality</Text>
                <TouchableOpacity onPress={() => setPersonalityModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {PERSONALITY_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.optionCard,
                      naviProfile.personalityPreset === preset.id && styles.optionCardSelected
                    ]}
                    onPress={() => {
                      updateNaviPersonality(preset.id);
                      setPersonalityModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionName}>{preset.name}</Text>
                      <Text style={styles.optionDescription}>{preset.tagline}</Text>
                    </View>
                    {naviProfile.personalityPreset === preset.id && (
                      <Sparkle size={20} color="#6366f1" fill="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={skinModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSkinModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Skin</Text>
                <TouchableOpacity onPress={() => setSkinModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {SKIN_PRESETS.map((skin) => (
                  <TouchableOpacity
                    key={skin.id}
                    style={[
                      styles.optionCard,
                      naviProfile.skinId === skin.id && styles.optionCardSelected
                    ]}
                    onPress={() => {
                      updateNaviSkin(skin.id);
                      setSkinModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionName}>{skin.name}</Text>
                      <Text style={styles.optionDescription}>{skin.description}</Text>
                    </View>
                    {naviProfile.skinId === skin.id && (
                      <Sparkle size={20} color="#6366f1" fill="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={avatarModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContentLarge}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Customize Avatar</Text>
                <TouchableOpacity onPress={() => setAvatarModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarPreviewSection}>
                  <NaviAvatar
                    style={naviProfile.avatar.style || 'classic'}
                    primaryColor={naviProfile.avatar.primaryColor}
                    secondaryColor={naviProfile.avatar.secondaryColor}
                    backgroundColor={naviProfile.avatar.backgroundColor}
                    size={120}
                    glowEnabled={naviProfile.avatar.glowEnabled !== false}
                  />
                  <Text style={styles.avatarPreviewName}>
                    {(naviProfile.avatar.style || 'classic').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>⚔️ Humanoid Characters</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'warrior_male', name: 'Warrior (M)' },
                    { id: 'warrior_female', name: 'Warrior (F)' },
                    { id: 'assassin', name: 'Assassin' },
                    { id: 'paladin', name: 'Paladin' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>🤖 Tech & Mecha</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'mecha_unit', name: 'Mecha Unit' },
                    { id: 'cyber', name: 'Cyber' },
                    { id: 'sentinel', name: 'Sentinel' },
                    { id: 'nexus', name: 'Nexus' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>🐺 Beasts & Creatures</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'beast_wolf', name: 'Wolf' },
                    { id: 'beast_dragon', name: 'Dragon' },
                    { id: 'slime_cute', name: 'Slime' },
                    { id: 'golem_stone', name: 'Golem' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>👼 Mystical & Ethereal</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'angel_seraph', name: 'Seraph' },
                    { id: 'demon_lord', name: 'Demon' },
                    { id: 'spirit_flame', name: 'Fire Spirit' },
                    { id: 'spirit_ice', name: 'Ice Spirit' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>👽 Alien & Cosmic</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'alien_grey', name: 'Grey Alien' },
                    { id: 'alien_nova', name: 'Nova Alien' },
                    { id: 'oracle', name: 'Oracle' },
                    { id: 'prism', name: 'Prism' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>🐾 Animals - Sea & Sky</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'animal_dolphin', name: 'Dolphin' },
                    { id: 'animal_seahorse', name: 'Seahorse' },
                    { id: 'animal_turtle', name: 'Turtle' },
                    { id: 'animal_shark', name: 'Shark' },
                    { id: 'animal_butterfly', name: 'Butterfly' },
                    { id: 'animal_dragonfly', name: 'Dragonfly' },
                    { id: 'animal_phoenix', name: 'Phoenix' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>🦁 Animals - Land</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'animal_fox', name: 'Fox' },
                    { id: 'animal_lion', name: 'Lion' },
                    { id: 'animal_tiger', name: 'Tiger' },
                    { id: 'animal_bear', name: 'Bear' },
                    { id: 'animal_bull', name: 'Bull' },
                    { id: 'animal_snake', name: 'Snake' },
                    { id: 'animal_tarantula', name: 'Tarantula' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>✨ Classic Styles</Text>
                <View style={styles.characterGrid}>
                  {([
                    { id: 'classic', name: 'Classic' },
                    { id: 'guardian', name: 'Guardian' },
                    { id: 'sage', name: 'Sage' },
                    { id: 'phantom', name: 'Phantom' },
                    { id: 'nova', name: 'Nova' },
                  ] as { id: NaviAvatarStyle; name: string }[]).map((char) => (
                    <TouchableOpacity
                      key={char.id}
                      style={[
                        styles.characterOption,
                        naviProfile.avatar.style === char.id && styles.characterOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ style: char.id })}
                      activeOpacity={0.7}
                    >
                      <NaviAvatar
                        style={char.id}
                        primaryColor={naviProfile.avatar.primaryColor}
                        secondaryColor={naviProfile.avatar.secondaryColor}
                        backgroundColor={naviProfile.avatar.backgroundColor}
                        size={60}
                        glowEnabled={false}
                      />
                      <Text style={styles.characterName}>{char.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>🎨 Color Theme</Text>
                <View style={styles.colorGrid}>
                  {[
                    { name: 'Indigo', primary: '#6366f1', secondary: '#a5b4fc', bg: '#eef2ff' },
                    { name: 'Emerald', primary: '#10b981', secondary: '#6ee7b7', bg: '#d1fae5' },
                    { name: 'Rose', primary: '#f43f5e', secondary: '#fb7185', bg: '#ffe4e6' },
                    { name: 'Amber', primary: '#f59e0b', secondary: '#fbbf24', bg: '#fef3c7' },
                    { name: 'Violet', primary: '#8b5cf6', secondary: '#a78bfa', bg: '#ede9fe' },
                    { name: 'Cyan', primary: '#06b6d4', secondary: '#67e8f9', bg: '#cffafe' },
                    { name: 'Crimson', primary: '#dc2626', secondary: '#f87171', bg: '#fee2e2' },
                    { name: 'Dark', primary: '#1f2937', secondary: '#6b7280', bg: '#f3f4f6' },
                    { name: 'Midnight', primary: '#312e81', secondary: '#6366f1', bg: '#1e1b4b' },
                    { name: 'Forest', primary: '#166534', secondary: '#4ade80', bg: '#14532d' },
                    { name: 'Sunset', primary: '#ea580c', secondary: '#fdba74', bg: '#431407' },
                    { name: 'Ocean', primary: '#0891b2', secondary: '#22d3ee', bg: '#164e63' },
                  ].map((scheme) => (
                    <TouchableOpacity
                      key={scheme.name}
                      style={[
                        styles.colorOption,
                        naviProfile.avatar.primaryColor === scheme.primary && styles.colorOptionSelected
                      ]}
                      onPress={() => updateNaviAvatar({ 
                        primaryColor: scheme.primary, 
                        secondaryColor: scheme.secondary, 
                        backgroundColor: scheme.bg 
                      })}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.colorSwatch, { backgroundColor: scheme.primary }]}>
                        <View style={[styles.colorSwatchInner, { backgroundColor: scheme.secondary }]} />
                      </View>
                      <Text style={styles.colorName}>{scheme.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>⚡ Effects</Text>
                <TouchableOpacity
                  style={styles.glowToggle}
                  onPress={() => updateNaviAvatar({ glowEnabled: !naviProfile.avatar.glowEnabled })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.glowToggleText}>Glow Effect</Text>
                  <View style={[
                    styles.toggle,
                    naviProfile.avatar.glowEnabled && styles.toggleActive
                  ]}>
                    <View style={[
                      styles.toggleThumb,
                      naviProfile.avatar.glowEnabled && styles.toggleThumbActive
                    ]} />
                  </View>
                </TouchableOpacity>

                <View style={styles.bottomSpacer} />
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={modeModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Choose Mode</Text>
                <TouchableOpacity onPress={() => setModeModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.optionsList}>
                {([{id: 'auto', name: 'Auto'}, {id: 'life_os', name: 'Life-OS'}, {id: 'work_os', name: 'Work-OS'}, {id: 'social_os', name: 'Social-OS'}, {id: 'metaverse_os', name: 'Metaverse-OS'}] as {id: NaviMode | 'auto'; name: string}[]).map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[
                      styles.optionCard,
                      naviProfile.currentMode === mode.id && styles.optionCardSelected
                    ]}
                    onPress={() => {
                      updateNaviMode(mode.id);
                      setModeModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionContent}>
                      <Text style={styles.optionName}>{mode.name}</Text>
                    </View>
                    {naviProfile.currentMode === mode.id && (
                      <Sparkle size={20} color="#6366f1" fill="#6366f1" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={naviNameModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setNaviNameModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.naviNameModalOverlay}
          >
            <TouchableOpacity 
              style={styles.naviNameModalBackdrop} 
              activeOpacity={1} 
              onPress={() => setNaviNameModalVisible(false)}
            />
            <View style={styles.naviNameModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Change Navi Name</Text>
                <TouchableOpacity onPress={() => setNaviNameModalVisible(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.naviNameHint}>
                Give your AI companion a custom name. They will refer to themselves by this name.
              </Text>
              <TextInput
                style={styles.naviNameInput}
                value={tempNaviName}
                onChangeText={setTempNaviName}
                placeholder="Enter a name..."
                placeholderTextColor="#94a3b8"
                maxLength={20}
                autoFocus
              />
              <View style={styles.naviNameButtons}>
                <TouchableOpacity
                  style={styles.naviNameCancelButton}
                  onPress={() => setNaviNameModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.naviNameCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.naviNameSaveButton,
                    (!tempNaviName.trim()) && styles.naviNameSaveButtonDisabled
                  ]}
                  onPress={() => {
                    if (tempNaviName.trim()) {
                      updateNaviName(tempNaviName.trim());
                      setNaviNameModalVisible(false);
                      Alert.alert('Name Updated', `Your AI companion is now called "${tempNaviName.trim()}"`);
                    }
                  }}
                  disabled={!tempNaviName.trim()}
                  activeOpacity={0.7}
                >
                  <Text style={styles.naviNameSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 34,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 17,
    color: '#64748b',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#475569',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  dangerIconContainer: {
    backgroundColor: '#fee2e2',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 19,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 4,
  },
  dangerText: {
    color: '#dc2626',
  },
  settingDescription: {
    fontSize: 17,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
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
  infoText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  aboutText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
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
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#0f172a',
  },
  modalClose: {
    fontSize: 24,
    color: '#64748b',
  },
  optionsList: {
    maxHeight: 400,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  optionContent: {
    flex: 1,
  },
  optionName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 15,
    color: '#64748b',
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#cbd5e1',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#6366f1',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  avatarPreview: {
    marginLeft: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#475569',
    marginTop: 16,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  avatarGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 8,
  },
  avatarOption: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  shapeGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 8,
  },
  shapeOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center' as const,
    minWidth: '22%',
  },
  shapeOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  shapeName: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  colorSchemeList: {
    gap: 12,
    marginBottom: 16,
  },
  colorSchemeOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  colorSchemeOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  colorSchemeName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#0f172a',
    flex: 1,
  },
  modalContentLarge: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  avatarPreviewSection: {
    alignItems: 'center' as const,
    marginBottom: 24,
    paddingVertical: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
  },
  avatarPreviewName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#0f172a',
    marginTop: 12,
  },
  characterGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  characterOption: {
    width: '23%',
    aspectRatio: 0.85,
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  characterOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  characterName: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  colorGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: '23%',
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center' as const,
  },
  colorOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  colorSwatchInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  colorName: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  glowToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  glowToggleText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  bottomSpacer: {
    height: 40,
  },
  syncStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
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
  syncStatusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  syncStatusInfo: {
    flex: 1,
    marginLeft: 12,
  },
  syncStatusTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#0f172a',
  },
  syncStatusSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  syncButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  syncErrorBanner: {
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  syncErrorText: {
    fontSize: 13,
    color: '#dc2626',
  },
  syncStats: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  syncStatItem: {
    alignItems: 'center' as const,
  },
  syncStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#6366f1',
  },
  syncStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  naviNameHint: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 22,
  },
  naviNameInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#0f172a',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  naviNameButtons: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  naviNameCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center' as const,
  },
  naviNameCancelText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#64748b',
  },
  naviNameSaveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center' as const,
  },
  naviNameSaveButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  naviNameSaveText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: '#ffffff',
  },
  naviNameModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  naviNameModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  naviNameModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
