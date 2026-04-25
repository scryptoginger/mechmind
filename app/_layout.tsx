import '../global.css';

import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { runMigrations } from '../lib/db/migrations';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    runMigrations()
      .then(() => setReady(true))
      .catch((e) => setError(e?.message ?? String(e)));
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-bg p-6">
        <Text className="text-danger text-base">DB init failed:</Text>
        <Text className="text-text mt-2 text-sm">{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator color="#3b82f6" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#141a22' },
          headerTintColor: '#e6edf5',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0b0f14' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'MechMind' }} />
      </Stack>
    </>
  );
}
