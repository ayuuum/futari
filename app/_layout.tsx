import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';

const queryClient = new QueryClient();

const ONBOARDING_KEY = '@futari_onboarding_complete';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:39',message:'Font loading error check',data:{hasError:!!error,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:47',message:'Fonts loaded',data:{loaded,platform:typeof window!=='undefined'?'web':'ssr'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootLayoutNav />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const [isReady, setIsReady] = useState(false);
  const { setSession, refreshProfile, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:67',message:'Supabase auth init start',data:{hasUrl:!!process.env.EXPO_PUBLIC_SUPABASE_URL,hasKey:!!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    supabase.auth.getSession().then(({ data: { session } }) => {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:70',message:'Supabase session retrieved',data:{hasSession:!!session},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      setSession(session);
      if (session) void refreshProfile();
    }).catch((err) => {
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:75',message:'Supabase session error',data:{error:err?.message||String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) void refreshProfile();
    });

    return () => subscription.unsubscribe();
  }, [setSession, refreshProfile]);

  useEffect(() => {
    if (isLoading) return;

    async function resolveInitialRoute() {
      try {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:85',message:'Route resolution start',data:{isAuthenticated,isLoading,pathname:typeof window!=='undefined'?window.location.pathname:'ssr'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const complete = await AsyncStorage.getItem(ONBOARDING_KEY);
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:88',message:'Onboarding check',data:{complete,willRedirect:complete!=='true'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (complete !== 'true') {
          setTimeout(() => {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:90',message:'Redirecting to onboarding',data:{target:'/onboarding'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            router.replace('/onboarding' as any);
          }, 100);
          setIsReady(true);
          return;
        }
        if (!isAuthenticated) {
          setTimeout(() => {
            // #region agent log
            fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:95',message:'Redirecting to login',data:{target:'/(auth)/login'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            router.replace('/(auth)/login' as any);
          }, 100);
        }
      } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:99',message:'Route resolution error',data:{error: e instanceof Error ? e.message : String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Failed to check onboarding', e);
      }
      // #region agent log
      fetch('http://127.0.0.1:7246/ingest/b07a51bf-3965-436c-a011-6643b54686d3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/_layout.tsx:102',message:'Route resolution complete',data:{isReady:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setIsReady(true);
    }

    resolveInitialRoute();
  }, [isLoading, isAuthenticated]);

  const navigationTheme = {
    dark: isDark,
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.accent,
    },
    fonts: isDark ? DarkTheme.fonts : DefaultTheme.fonts,
  };

  if (!isReady) return null;

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="theme-settings" options={{ title: 'テーマ設定', headerBackTitle: '戻る' }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

