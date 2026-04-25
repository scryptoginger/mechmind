import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { vehicleRepo } from '../../../../lib/repositories/vehicleRepo';
import { odometerRepo } from '../../../../lib/repositories/odometerRepo';
import { recomputeCadence } from '../../../../lib/services/CadenceLearnerService';
import type { OdometerReading } from '../../../../lib/types/OdometerReading';

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
] as const;

export default function OdometerNew() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [recent, setRecent] = useState<OdometerReading[]>([]);

  useEffect(() => {
    if (!id) return;
    odometerRepo.findByVehicle(id, 5).then(setRecent);
    vehicleRepo.findById(id).then((v) => {
      // Pre-fill with current odo so Keith only types the delta if he wants
      if (v?.currentOdometer != null) setValue('');
    });
  }, [id]);

  const press = (k: string) => {
    if (k === '⌫') {
      setValue((v) => v.slice(0, -1));
    } else if (k === '✓') {
      submit();
    } else {
      setValue((v) => (v.length < 7 ? v + k : v));
    }
  };

  const submit = async () => {
    if (!id) return;
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n <= 0) {
      Alert.alert('Enter a valid odometer reading');
      return;
    }
    const v = await vehicleRepo.findById(id);
    if (v?.currentOdometer != null && n + 50 < v.currentOdometer) {
      Alert.alert(
        'That looks lower than the current odometer',
        `Current: ${v.currentOdometer.toLocaleString()}.  You entered: ${n.toLocaleString()}.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save anyway', onPress: () => save(n) },
        ]
      );
      return;
    }
    await save(n);
  };

  const save = async (n: number) => {
    if (!id) return;
    await odometerRepo.create(id, n, 'fill_up');
    const v = await vehicleRepo.findById(id);
    if (v && (v.currentOdometer == null || n > v.currentOdometer)) {
      await vehicleRepo.setOdometer(id, n);
    }
    await recomputeCadence(id);
    router.replace(`/vehicle/${id}` as const);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Quick Mileage' }} />

      <View className="bg-surface border border-border rounded-2xl p-6 mb-3 items-center">
        <Text className="text-muted text-xs uppercase">Odometer reading</Text>
        <Text className="text-text text-5xl font-bold mt-2 tabular-nums">
          {value ? Number(value).toLocaleString() : '—'}
        </Text>
        <Text className="text-muted text-xs mt-1">miles</Text>
      </View>

      <View className="bg-surface border border-border rounded-2xl p-2 mb-3">
        {KEYS.map((row, ri) => (
          <View key={ri} className="flex-row">
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => press(k)}
                className={`flex-1 m-1 rounded-xl items-center justify-center ${
                  k === '✓' ? 'bg-success' : k === '⌫' ? 'bg-surface2' : 'bg-surface2'
                }`}
                style={{ height: 64 }}
              >
                <Text className={`text-2xl font-semibold ${k === '✓' ? 'text-white' : 'text-text'}`}>{k}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      {recent.length > 0 ? (
        <View>
          <Text className="text-muted text-xs uppercase mb-1">Recent</Text>
          {recent.map((r) => (
            <View key={r.id} className="flex-row justify-between p-2 border-b border-border">
              <Text className="text-text">{r.reading.toLocaleString()} mi</Text>
              <Text className="text-muted text-xs">{new Date(r.recordedAt).toLocaleDateString()}  ·  {r.source}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}
