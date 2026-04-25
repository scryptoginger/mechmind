import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { maintenanceLogRepo } from '../../../lib/repositories/maintenanceLogRepo';
import { maintenanceTypeRepo } from '../../../lib/repositories/maintenanceTypeRepo';
import type { MaintenanceLog } from '../../../lib/types/MaintenanceLog';

export default function History() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const rows = await maintenanceLogRepo.findByVehicle(id);
    setLogs(rows);
    const allTypes = await maintenanceTypeRepo.findAll();
    setNames(Object.fromEntries(allTypes.map((t) => [t.id, t.name])));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#3b82f6" />}
    >
      <Stack.Screen options={{ title: 'History' }} />
      {logs.length === 0 ? (
        <Text className="text-muted text-sm italic">No completed work logged yet.</Text>
      ) : null}
      {logs.map((l) => (
        <Pressable
          key={l.id}
          onPress={() => router.push(`/vehicle/${id}/log/${l.id}` as const)}
          className="bg-surface border border-border rounded-2xl p-3 mb-2 active:opacity-80"
        >
          <View className="flex-row justify-between">
            <Text className="text-text font-semibold">{names[l.maintenanceTypeId] ?? '(unknown job)'}</Text>
            <Text className="text-muted text-xs">{new Date(l.completedAt).toLocaleDateString()}</Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-muted text-xs">{l.odometerAtCompletion.toLocaleString()} mi</Text>
            {l.totalCost ? <Text className="text-muted text-xs">${l.totalCost.toFixed(2)}</Text> : null}
            {l.timeSpentMinutes ? <Text className="text-muted text-xs">{l.timeSpentMinutes} min</Text> : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
