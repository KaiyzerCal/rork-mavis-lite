import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View } from "react-native";

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from "@/contexts/AppContext";
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

function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <BackendSyncProvider>
        <NaviAPIProvider>
          <ProposalProvider>
            {children}
          </ProposalProvider>
        </NaviAPIProvider>
      </BackendSyncProvider>
    </AppProvider>
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
          <AppProviders>
            <View style={{ flex: 1 }}>
              <RootLayoutNav />
            </View>
          </AppProviders>
        </trpc.Provider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
