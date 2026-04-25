import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { maintenanceLogRepo } from '../../../../lib/repositories/maintenanceLogRepo';
import { maintenanceTypeRepo } from '../../../../lib/repositories/maintenanceTypeRepo';
import type { MaintenanceLog } from '../../../../lib/types/MaintenanceLog';
import type { MaintenanceType } from '../../../../lib/types/MaintenanceType';

export default function LogDetail() {
  const { id, logId } = useLocalSearchParams<{ id: string; logId: string }>();
  const router = useRouter();
  const [log, setLog] = useState<MaintenanceLog | null>(null);
  const [type, setType] = useState<MaintenanceType | null>(null);

  const load = useCallback(async () => {
    if (!logId) return;
    const l = await maintenanceLogRepo.findById(logId);
    setLog(l);
    if (l) {
      setType(await maintenanceTypeRepo.findById(l.maintenanceTypeId));
    }
  }, [logId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!log) return <View className="flex-1 bg-bg" />;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: type?.name ?? 'Log' }} />

      <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
        <Text className="text-text text-xl font-bold">{type?.name ?? '(unknown)'}</Text>
        <Text className="text-muted text-xs mt-1">
          {new Date(log.completedAt).toLocaleString()}  ·  {log.odometerAtCompletion.toLocaleString()} mi
        </Text>
        {log.timeSpentMinutes != null ? <Text className="text-muted text-xs mt-1">{log.timeSpentMinutes} min</Text> : null}
        {log.totalCost != null ? <Text className="text-muted text-xs mt-1">${log.totalCost.toFixed(2)}</Text> : null}
        {log.difficultyActual != null ? <Text className="text-muted text-xs mt-1">difficulty: {'•'.repeat(log.difficultyActual)}</Text> : null}
      </View>

      {log.notes ? (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
          <Text className="text-muted text-xs uppercase mb-1">Notes</Text>
          <Text className="text-text">{log.notes}</Text>
        </View>
      ) : null}

      {log.partsUsed && log.partsUsed.length > 0 ? (
        <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
          <Text className="text-muted text-xs uppercase mb-1">Parts used</Text>
          {log.partsUsed.map((p, i) => (
            <Text key={i} className="text-text text-sm">
              {p.qty} ×  {p.partId}  @  ${p.cost.toFixed(2)}
            </Text>
          ))}
        </View>
      ) : null}

      <Pressable
        onPress={() => router.push(`/vehicle/${id}/log/new?logId=${logId}` as const)}
        className="bg-surface2 border border-border rounded-xl p-3 items-center"
      >
        <Text className="text-text">Edit (re-enter)</Text>
      </Pressable>
    </ScrollView>
  );
}
