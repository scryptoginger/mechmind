import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { maintenanceLogRepo } from '../../../../lib/repositories/maintenanceLogRepo';
import { maintenanceTypeRepo } from '../../../../lib/repositories/maintenanceTypeRepo';
import { partRepo } from '../../../../lib/repositories/partRepo';
import type { MaintenanceLog } from '../../../../lib/types/MaintenanceLog';
import type { MaintenanceType } from '../../../../lib/types/MaintenanceType';
import type { Part } from '../../../../lib/types/Part';

export default function LogDetail() {
  const { id, logId } = useLocalSearchParams<{ id: string; logId: string }>();
  const router = useRouter();
  const [log, setLog] = useState<MaintenanceLog | null>(null);
  const [type, setType] = useState<MaintenanceType | null>(null);
  const [partsById, setPartsById] = useState<Record<string, Part>>({});

  const load = useCallback(async () => {
    if (!logId) return;
    const l = await maintenanceLogRepo.findById(logId);
    setLog(l);
    if (l) {
      const t = await maintenanceTypeRepo.findById(l.maintenanceTypeId);
      setType(t);
      if (t) {
        const allParts = await partRepo.findByMaintenanceType(t.id);
        setPartsById(Object.fromEntries(allParts.map((p) => [p.id, p])));
      }
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
          {log.partsUsed.map((pu, i) => {
            const p = partsById[pu.partId];
            const label = p
              ? `${p.manufacturer ?? ''}${p.partNumber ? ' ' + p.partNumber : ''}${p.description ? ' — ' + p.description : ''}`.trim()
              : pu.partId;
            return (
              <View key={i} className="flex-row justify-between py-1">
                <Text className="text-text text-sm flex-1 pr-2">
                  {pu.qty} ×  {label}
                </Text>
                <Text className="text-muted text-sm">${(pu.qty * pu.cost).toFixed(2)}</Text>
              </View>
            );
          })}
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
