import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider, useApp } from "@/contexts/AppContext";
import { NaviAPIProvider } from "@/contexts/NaviAPIContext";
import { ProposalProvider } from "@/contexts/ProposalContext";
import { BackendSyncProvider } from "@/contexts/BackendSyncContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AppContent() {
  const { isLoaded } = useApp();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <BackendSyncProvider>
      <NaviAPIProvider>
        <ProposalProvider>
          <View style={{ flex: 1 }}>
            <RootLayoutNav />
          </View>
        </ProposalProvider>
      </NaviAPIProvider>
    </BackendSyncProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
