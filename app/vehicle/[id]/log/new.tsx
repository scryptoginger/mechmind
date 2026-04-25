import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import { TextField, ChoiceField } from '../../../../components/Field';
import { vehicleRepo } from '../../../../lib/repositories/vehicleRepo';
import { maintenanceTypeRepo } from '../../../../lib/repositories/maintenanceTypeRepo';
import { partRepo } from '../../../../lib/repositories/partRepo';
import { maintenanceLogRepo } from '../../../../lib/repositories/maintenanceLogRepo';
import { odometerRepo } from '../../../../lib/repositories/odometerRepo';
import { recomputeCadence } from '../../../../lib/services/CadenceLearnerService';

import type { MaintenanceType } from '../../../../lib/types/MaintenanceType';
import type { Part } from '../../../../lib/types/Part';

export default function LogNew() {
  const { id, maintenanceTypeId, logId } = useLocalSearchParams<{ id: string; maintenanceTypeId?: string; logId?: string }>();
  const router = useRouter();
  const editing = !!logId;
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [type, setType] = useState<MaintenanceType | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [partQty, setPartQty] = useState<Record<string, string>>({});
  const [partCost, setPartCost] = useState<Record<string, string>>({});

  const [odo, setOdo] = useState('');
  const [notes, setNotes] = useState('');
  const [time, setTime] = useState('');
  const [difficulty, setDifficulty] = useState<number>(2);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const v = await vehicleRepo.findById(id);
      const ts = await maintenanceTypeRepo.findApplicableTo(id, v?.engine ?? null, v?.transmission ?? null);
      setTypes(ts);

      if (logId) {
        // Editing — load the existing log and prefill every field.
        const log = await maintenanceLogRepo.findById(logId);
        if (log) {
          setType(ts.find((t) => t.id === log.maintenanceTypeId) ?? null);
          setOdo(String(log.odometerAtCompletion));
          setNotes(log.notes ?? '');
          setTime(log.timeSpentMinutes != null ? String(log.timeSpentMinutes) : '');
          setDifficulty(log.difficultyActual ?? 2);
          if (log.partsUsed) {
            const qty: Record<string, string> = {};
            const cost: Record<string, string> = {};
            for (const pu of log.partsUsed) {
              qty[pu.partId] = String(pu.qty);
              cost[pu.partId] = String(pu.cost);
            }
            setPartQty(qty);
            setPartCost(cost);
          }
          return;
        }
      }

      const sel = maintenanceTypeId ? ts.find((t) => t.id === maintenanceTypeId) ?? null : null;
      setType(sel);
      if (v?.currentOdometer != null) setOdo(String(v.currentOdometer));
    })();
  }, [id, maintenanceTypeId, logId]);

  useEffect(() => {
    if (!type) {
      setParts([]);
      return;
    }
    partRepo.findByMaintenanceType(type.id).then(setParts);
  }, [type]);

  const totalCost = Object.entries(partCost).reduce((sum, [pid, c]) => {
    const q = parseFloat(partQty[pid] || '0');
    const cn = parseFloat(c || '0');
    return sum + (Number.isFinite(q * cn) ? q * cn : 0);
  }, 0);

  const submit = async () => {
    if (!id) return;
    if (!type) {
      Alert.alert('Pick a maintenance type');
      return;
    }
    const odoNum = parseInt(odo.replace(/[, ]/g, ''), 10);
    if (Number.isNaN(odoNum)) {
      Alert.alert('Odometer is required');
      return;
    }
    const partsUsed = parts
      .map((p) => ({
        partId: p.id,
        qty: parseFloat(partQty[p.id] || '0') || 0,
        cost: parseFloat(partCost[p.id] || '0') || 0,
      }))
      .filter((pu) => pu.qty > 0);

    if (logId) {
      await maintenanceLogRepo.update(logId, {
        maintenanceTypeId: type.id,
        odometerAtCompletion: odoNum,
        notes: notes || null,
        partsUsed: partsUsed.length ? partsUsed : null,
        totalCost: totalCost || null,
        timeSpentMinutes: time ? parseInt(time, 10) : null,
        difficultyActual: difficulty,
      });
    } else {
      await maintenanceLogRepo.create({
        vehicleId: id,
        maintenanceTypeId: type.id,
        odometerAtCompletion: odoNum,
        notes: notes || null,
        partsUsed: partsUsed.length ? partsUsed : null,
        totalCost: totalCost || null,
        timeSpentMinutes: time ? parseInt(time, 10) : null,
        difficultyActual: difficulty,
      });
    }

    // Also log a maintenance odometer reading + bump vehicle odometer if higher.
    await odometerRepo.create(id, odoNum, 'maintenance');
    const v = await vehicleRepo.findById(id);
    if (v && (v.currentOdometer == null || odoNum > v.currentOdometer)) {
      await vehicleRepo.setOdometer(id, odoNum);
    }
    await recomputeCadence(id);

    router.replace(`/vehicle/${id}` as const);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: editing ? 'Edit Log' : 'Log Completed Work' }} />

      <View className="mb-3">
        <Text className="text-muted text-xs uppercase mb-1">Job</Text>
        {type ? (
          <Pressable onPress={() => setType(null)} className="bg-surface border border-border rounded-xl p-3">
            <Text className="text-text font-semibold">{type.name}</Text>
            <Text className="text-muted text-xs mt-1">tap to change</Text>
          </Pressable>
        ) : (
          <View>
            {types.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setType(t)}
                className="bg-surface border border-border rounded-xl p-3 mb-2 active:opacity-80"
              >
                <Text className="text-text">{t.name}</Text>
                {t.category ? <Text className="text-muted text-xs">{t.category}</Text> : null}
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {type ? (
        <>
          <TextField label="Odometer at completion" value={odo} onChangeText={setOdo} keyboardType="number-pad" />
          <TextField label="Time spent (minutes)" value={time} onChangeText={setTime} keyboardType="number-pad" placeholder="e.g. 45" />

          {parts.length > 0 ? (
            <View className="mb-3">
              <Text className="text-muted text-xs uppercase mb-1">Parts used (qty / cost ea)</Text>
              {parts.map((p) => (
                <View key={p.id} className="bg-surface border border-border rounded-xl p-3 mb-2">
                  <Text className="text-text font-semibold">
                    {p.manufacturer ?? ''} {p.partNumber ?? p.partRole}
                  </Text>
                  {p.description ? <Text className="text-muted text-xs mb-1">{p.description}</Text> : null}
                  <View className="flex-row gap-2 mt-1">
                    <View className="w-20"><TextField label="qty" value={partQty[p.id] || ''} onChangeText={(v) => setPartQty((s) => ({ ...s, [p.id]: v }))} keyboardType="decimal-pad" /></View>
                    <View className="flex-1"><TextField label="$/each" value={partCost[p.id] || ''} onChangeText={(v) => setPartCost((s) => ({ ...s, [p.id]: v }))} keyboardType="decimal-pad" /></View>
                  </View>
                </View>
              ))}
              {totalCost > 0 ? <Text className="text-text text-right text-sm">total parts: ${totalCost.toFixed(2)}</Text> : null}
            </View>
          ) : null}

          <TextField label="Notes" value={notes} onChangeText={setNotes} placeholder="anything memorable about this service" />

          <ChoiceField label="Difficulty (your rating)" value={String(difficulty) as any} onChange={(v) => setDifficulty(parseInt(v, 10))} options={[
            { value: '1' as any, label: '1' },
            { value: '2' as any, label: '2' },
            { value: '3' as any, label: '3' },
            { value: '4' as any, label: '4' },
            { value: '5' as any, label: '5' },
          ]} />

          <Pressable onPress={submit} className="bg-success rounded-2xl p-4 items-center mt-3 active:opacity-80">
            <Text className="text-white font-semibold">Save log</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
}
