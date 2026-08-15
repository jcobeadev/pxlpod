import { createContext, useContext, useEffect, useState } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createPoplabClient, ensureAnonymousSession, type PoplabClient } from "@poplab/api";

import { authStorage } from "../src/lib/authStorage";

import "../global.css";
import { colors, fontAssets } from "../src/theme";

// Hold the native splash screen up until fonts are loaded, so the app never
// flashes fallback system type on cold start (the design links Archivo from
// the Google Fonts CDN — wrong for a mobile app, see src/theme/fontAssets.ts).
void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// One client for the whole app. Created once, outside React, the same way the
// web console does — there is exactly one Supabase project this build talks to
// (EXPO_PUBLIC_* is baked in at build time), so there is nothing to swap it for
// at runtime.
//
// The session is persisted to sqlite rather than held in memory. Without that,
// every cold start mints a NEW anonymous user, and since print_jobs and
// share_links are scoped by RLS to created_by = auth.uid(), a guest who closes
// the app loses the print pass they just paid for. AsyncStorage or SecureStore
// would be the conventional choice, but both ship native code absent from the
// development build already on the device; expo-sqlite is linked there today.
const poplabClient = createPoplabClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storage: authStorage,
});

const PoplabClientContext = createContext<PoplabClient>(poplabClient);

/** The one Supabase client every screen reads/writes through. */
export function usePoplabClient(): PoplabClient {
  return useContext(PoplabClientContext);
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  useEffect(() => {
    // Fire-and-forget: guest reads don't need identity, but print passes and
    // share links are RLS-scoped to auth.uid(), so this must run once up
    // front rather than lazily on first write.
    ensureAnonymousSession(poplabClient).catch((error) => {
      console.warn("[app] ensureAnonymousSession failed:", error);
    });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <PoplabClientContext.Provider value={poplabClient}>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.canvas },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="permissions" />
            <Stack.Screen name="(tabs)" />
            {/* The capture flow — presented over the tabs so the tab bar is
                hidden while shooting; the session store outlives each screen. */}
            <Stack.Screen name="session" options={{ presentation: "card", animation: "slide_from_right" }} />
            <Stack.Screen name="strip/[id]" options={{ presentation: "card", animation: "slide_from_right" }} />
          </Stack>
        </QueryClientProvider>
      </PoplabClientContext.Provider>
    </SafeAreaProvider>
  );
}
