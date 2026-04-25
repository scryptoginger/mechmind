import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking, RefreshControl } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { vehicleRepo } from '../../../../lib/repositories/vehicleRepo';
import { maintenanceTypeRepo } from '../../../../lib/repositories/maintenanceTypeRepo';
import { partRepo } from '../../../../lib/repositories/partRepo';
import { torqueSpecRepo } from '../../../../lib/repositories/torqueSpecRepo';
import { procedureRepo, toolRepo, mediaLinkRepo } from '../../../../lib/repositories/procedureRepo';
import { maintenanceLogRepo } from '../../../../lib/repositories/maintenanceLogRepo';

import type { Vehicle } from '../../../../lib/types/Vehicle';
import type { MaintenanceType } from '../../../../lib/types/MaintenanceType';
import type { Part } from '../../../../lib/types/Part';
import type { TorqueSpec } from '../../../../lib/types/TorqueSpec';
import type { Procedure, ToolRequired, MediaLink } from '../../../../lib/types/Procedure';
import type { MaintenanceLog } from '../../../../lib/types/MaintenanceLog';

import { VerifiedBadge } from '../../../../components/VerifiedBadge';

export default function JobDetail() {
  const router = useRouter();
  const { id, maintenanceTypeId } = useLocalSearchParams<{ id: string; maintenanceTypeId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [type, setType] = useState<MaintenanceType | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [torque, setTorque] = useState<TorqueSpec[]>([]);
  const [tools, setTools] = useState<ToolRequired[]>([]);
  const [steps, setSteps] = useState<Procedure[]>([]);
  const [media, setMedia] = useState<MediaLink[]>([]);
  const [lastLog, setLastLog] = useState<MaintenanceLog | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!id || !maintenanceTypeId) return;
    const [v, mt, p, t, tools, st, m, last] = await Promise.all([
      vehicleRepo.findById(id),
      maintenanceTypeRepo.findById(maintenanceTypeId),
      partRepo.findByMaintenanceType(maintenanceTypeId),
      torqueSpecRepo.findByMaintenanceType(maintenanceTypeId),
      toolRepo.findByMaintenanceType(maintenanceTypeId),
      procedureRepo.findByMaintenanceType(maintenanceTypeId),
      mediaLinkRepo.findByMaintenanceType(maintenanceTypeId),
      maintenanceLogRepo.findLatestForJob(id, maintenanceTypeId),
    ]);
    setVehicle(v);
    setType(mt);
    setParts(p);
    setTorque(t);
    setTools(tools);
    setSteps(st);
    setMedia(m);
    setLastLog(last);
  }, [id, maintenanceTypeId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (!type || !vehicle) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-muted">Loading…</Text>
      </View>
    );
  }

  const oem = parts.filter((p) => p.isOem);
  const aftermarket = parts.filter((p) => !p.isOem);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#3b82f6" />}
    >
      <Stack.Screen options={{ title: type.name }} />

      {/* Header */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
        <Text className="text-text text-xl font-bold">{type.name}</Text>
        <View className="flex-row gap-3 mt-2 flex-wrap">
          <Text className="text-muted text-xs">{type.category ?? '—'}</Text>
          {type.difficulty != null ? <Text className="text-muted text-xs">difficulty {'•'.repeat(type.difficulty)}{'·'.repeat(5 - type.difficulty)}</Text> : null}
          {type.estimatedTimeMinutes != null ? <Text className="text-muted text-xs">~{type.estimatedTimeMinutes} min</Text> : null}
        </View>
        {lastLog ? (
          <Text className="text-text text-xs mt-2">
            last done {new Date(lastLog.completedAt).toLocaleDateString()} at {lastLog.odometerAtCompletion.toLocaleString()} mi
          </Text>
        ) : (
          <Text className="text-muted text-xs mt-2">no record yet</Text>
        )}
      </View>

      {type.whyItMatters ? (
        <Section title="Why it matters">
          <Text className="text-text text-sm leading-relaxed">{type.whyItMatters}</Text>
        </Section>
      ) : null}

      <Section title="Intervals">
        <View className="bg-surface border border-border rounded-xl p-3">
          <Row label="Normal" value={fmtInterval(type.intervalNormalMiles, type.intervalNormalMonths)} />
          <Row label="Severe" value={fmtInterval(type.intervalSevereMiles, type.intervalSevereMonths)} />
        </View>
      </Section>

      {oem.length > 0 || aftermarket.length > 0 ? (
        <Section title="Parts">
          {oem.length > 0 ? (
            <View className="bg-surface border border-border rounded-xl mb-2">
              {oem.map((p, i) => <PartRow key={p.id} p={p} hairline={i > 0} />)}
            </View>
          ) : null}
          {aftermarket.length > 0 ? (
            <>
              <Text className="text-muted text-xs uppercase mt-2 mb-1">Aftermarket alternatives</Text>
              <View className="bg-surface border border-border rounded-xl">
                {aftermarket.map((p, i) => <PartRow key={p.id} p={p} hairline={i > 0} />)}
              </View>
            </>
          ) : null}
        </Section>
      ) : (
        <Section title="Parts">
          <Text className="text-muted text-sm italic">No part data seeded yet — see data/needs_human_review.md.</Text>
        </Section>
      )}

      {tools.length > 0 ? (
        <Section title="Tools">
          <View className="bg-surface border border-border rounded-xl">
            {tools.map((t, i) => (
              <View key={t.id} className={`flex-row p-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <Text className="text-text flex-1">{t.toolName}</Text>
                {t.spec ? <Text className="text-muted text-xs">{t.spec}</Text> : null}
                {t.optional ? <Text className="text-muted text-[10px] ml-2">optional</Text> : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {torque.length > 0 ? (
        <Section title="Torque specs">
          <View className="bg-surface border border-border rounded-xl">
            {torque.map((t, i) => (
              <View key={t.id} className={`p-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <View className="flex-row justify-between items-start">
                  <Text className="text-text font-semibold flex-1 pr-2">{t.fastenerName}</Text>
                  <VerifiedBadge verified={t.verified} conflict={t.conflict} />
                </View>
                <View className="flex-row mt-1 gap-3 flex-wrap">
                  {t.valueFtLbs != null ? <Text className="text-text">{t.valueFtLbs} ft·lbs</Text> : null}
                  {t.valueNm != null ? <Text className="text-muted">({t.valueNm} N·m)</Text> : null}
                  {t.socketSize ? <Text className="text-muted text-xs">{t.socketSize}</Text> : null}
                </View>
                {t.notes ? <Text className="text-muted text-xs mt-1 italic">{t.notes}</Text> : null}
                {t.sourceUrl ? (
                  <Pressable onPress={() => Linking.openURL(t.sourceUrl!)}>
                    <Text className="text-primary text-xs mt-1">{t.sourceName ?? 'source'} →</Text>
                  </Pressable>
                ) : t.sourceName ? (
                  <Text className="text-muted text-xs mt-1">source: {t.sourceName}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {steps.length > 0 ? (
        <Section title="Step-by-step">
          <View className="bg-surface border border-border rounded-xl">
            {steps.map((s, i) => (
              <View key={s.id} className={`p-3 ${i > 0 ? 'border-t border-border' : ''}`}>
                <Text className="text-text font-semibold">
                  {s.stepNumber}. {s.title}
                </Text>
                <Text className="text-text text-sm mt-1 leading-relaxed">{s.detail}</Text>
                {s.warning ? (
                  <View className="bg-warning/10 border border-warning/40 rounded p-2 mt-2">
                    <Text className="text-warning text-xs">⚠ {s.warning}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : (
        <Section title="Step-by-step">
          <Text className="text-muted text-sm italic">No procedure steps seeded yet for this job.</Text>
        </Section>
      )}

      {media.length > 0 ? (
        <Section title="Watch & read">
          {media.map((m) => (
            <Pressable key={m.id} onPress={() => Linking.openURL(m.url)} className="bg-surface border border-border rounded-xl p-3 mb-2 active:opacity-80">
              <Text className="text-text font-semibold">{m.title}</Text>
              <Text className="text-muted text-xs mt-1">{m.sourceName ?? m.mediaType}{m.qualityScore ? `  ·  ${'★'.repeat(m.qualityScore)}` : ''}</Text>
            </Pressable>
          ))}
        </Section>
      ) : null}

      <Pressable
        onPress={() => router.push(`/vehicle/${vehicle.id}/log/new?maintenanceTypeId=${type.id}` as const)}
        className="bg-success rounded-2xl p-4 items-center mt-2 active:opacity-80"
      >
        <Text className="text-white font-semibold">✓ Mark complete</Text>
      </Pressable>
    </ScrollView>
  );
}

function fmtInterval(miles: number | null, months: number | null) {
  const parts: string[] = [];
  if (miles != null) parts.push(`${miles.toLocaleString()} mi`);
  if (months != null) parts.push(`${months} mo`);
  return parts.length ? parts.join(' / ') : '—';
}

function Section({ title, children }: { title: string; children: any }) {
  return (
    <View className="mb-3">
      <Text className="text-muted uppercase tracking-wider text-xs mb-2 mt-2">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-muted">{label}</Text>
      <Text className="text-text">{value}</Text>
    </View>
  );
}

function PartRow({ p, hairline }: { p: Part; hairline: boolean }) {
  return (
    <View className={`p-3 ${hairline ? 'border-t border-border' : ''}`}>
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-2">
          <Text className="text-text font-semibold">
            {p.manufacturer ? `${p.manufacturer}  ` : ''}
            {p.partNumber ?? '(no PN)'}
          </Text>
          {p.description ? <Text className="text-muted text-xs mt-1">{p.description}</Text> : null}
          {p.spec ? <Text className="text-muted text-xs mt-1">{p.spec}</Text> : null}
        </View>
        <View className="items-end">
          {p.isOem ? <Text className="text-primary text-[10px] font-bold mb-1">OEM</Text> : null}
          <VerifiedBadge verified={p.verified} conflict={p.conflict} />
        </View>
      </View>
      {p.sourceUrl ? (
        <Pressable onPress={() => Linking.openURL(p.sourceUrl!)}>
          <Text className="text-primary text-xs mt-1">{p.sourceName ?? 'source'} →</Text>
        </Pressable>
      ) : p.sourceName ? (
        <Text className="text-muted text-xs mt-1">source: {p.sourceName}</Text>
      ) : null}
    </View>
  );
}
