import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter, Link } from 'expo-router';
import { vehicleRepo } from '../../../lib/repositories/vehicleRepo';
import { computeDueStatuses, type DueStatus } from '../../../lib/services/MaintenanceDueService';
import type { Vehicle, ServiceProfile } from '../../../lib/types/Vehicle';
import { ChoiceField } from '../../../components/Field';
import { Banner } from '../../../components/Banner';
import { dispatchNotifications, planNotifications, type PlannedNotification } from '../../../lib/services/NotificationPlannerService';

export default function VehicleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [statuses, setStatuses] = useState<DueStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [profileOverride, setProfileOverride] = useState<ServiceProfile | undefined>();
  const [pendingNotifs, setPendingNotifs] = useState<PlannedNotification[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const v = await vehicleRepo.findById(id);
    setVehicle(v);
    if (v) {
      const s = await computeDueStatuses(id, { profileOverride });
      setStatuses(s);
      const p = await planNotifications(id);
      setPendingNotifs(p);
    }
  }, [id, profileOverride]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const overdue = statuses.filter((s) => s.status === 'overdue');
  const dueSoon = statuses.filter((s) => s.status === 'due_soon');
  const upToDate = statuses.filter((s) => s.status === 'up_to_date' || s.status === 'unknown');

  if (!vehicle) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-muted">Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <Stack.Screen options={{ title: `${vehicle.year} ${vehicle.model}` }} />

      {/* Header */}
      <View className="bg-surface border border-border rounded-2xl p-4 mb-3">
        <Text className="text-text text-xl font-bold">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </Text>
        <Text className="text-muted text-sm mt-1">
          {[vehicle.trim, vehicle.cab, vehicle.bed, vehicle.engine, vehicle.transmission, vehicle.drivetrain].filter(Boolean).join(' · ')}
        </Text>
        <Text className="text-text mt-2">
          {vehicle.currentOdometer != null ? `${vehicle.currentOdometer.toLocaleString()} mi` : 'Odometer not set'}
        </Text>
        <View className="flex-row gap-2 mt-3">
          <Link href={`/vehicle/${vehicle.id}/odometer/new` as const} asChild>
            <Pressable className="bg-primary rounded-xl px-3 py-2 active:opacity-80">
              <Text className="text-white text-xs font-semibold">⛽ Quick mileage</Text>
            </Pressable>
          </Link>
          <Link href={`/vehicle/${vehicle.id}/history` as const} asChild>
            <Pressable className="bg-surface2 border border-border rounded-xl px-3 py-2 active:opacity-80">
              <Text className="text-text text-xs">History</Text>
            </Pressable>
          </Link>
          <Link href={`/vehicle/${vehicle.id}/edit` as const} asChild>
            <Pressable className="bg-surface2 border border-border rounded-xl px-3 py-2 active:opacity-80">
              <Text className="text-text text-xs">Edit</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      {pendingNotifs.length > 0 ? (
        <Banner
          variant={pendingNotifs.some((p) => p.type === 'maintenance_due') ? 'danger' : 'warning'}
          title={`${pendingNotifs.length} pending alert${pendingNotifs.length === 1 ? '' : 's'}`}
          subtitle={pendingNotifs.map((p) => p.message).join('  •  ')}
          onPress={async () => {
            await dispatchNotifications(vehicle.id);
            await load();
          }}
        />
      ) : null}

      <ChoiceField
        label="Service profile (overrides vehicle setting)"
        value={profileOverride ?? vehicle.serviceProfile ?? 'normal'}
        onChange={(v) => setProfileOverride(v as ServiceProfile)}
        options={[
          { value: 'normal', label: 'Normal' },
          { value: 'severe', label: 'Severe' },
          { value: 'mixed', label: 'Mixed' },
        ]}
      />

      <Section title={`Overdue (${overdue.length})`} color="danger">
        {overdue.length === 0 ? <Empty text="Nothing overdue. 🎉" /> : null}
        {overdue.map((s) => <DueCard key={s.maintenanceType.id} vehicleId={vehicle.id} s={s} />)}
      </Section>

      <Section title={`Due soon (${dueSoon.length})`} color="warning">
        {dueSoon.length === 0 ? <Empty text="Nothing due soon." /> : null}
        {dueSoon.map((s) => <DueCard key={s.maintenanceType.id} vehicleId={vehicle.id} s={s} />)}
      </Section>

      <Section title={`Up to date / no record (${upToDate.length})`} color="muted" collapsible>
        {upToDate.map((s) => <DueCard key={s.maintenanceType.id} vehicleId={vehicle.id} s={s} subdued />)}
      </Section>
    </ScrollView>
  );
}

function Section({ title, color, children, collapsible }: { title: string; color: 'danger' | 'warning' | 'muted'; children: any; collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);
  const colorClass = color === 'danger' ? 'text-danger' : color === 'warning' ? 'text-warning' : 'text-muted';
  return (
    <View className="mb-3">
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row justify-between items-center mb-2 mt-2">
        <Text className={`${colorClass} font-bold uppercase tracking-wider text-xs`}>{title}</Text>
        {collapsible ? <Text className="text-muted text-xs">{open ? 'hide' : 'show'}</Text> : null}
      </Pressable>
      {open ? children : null}
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return <Text className="text-muted text-sm italic mb-2">{text}</Text>;
}

function DueCard({ vehicleId, s, subdued }: { vehicleId: string; s: DueStatus; subdued?: boolean }) {
  const interval = s.intervalMiles != null ? `${s.intervalMiles.toLocaleString()} mi` : '';
  const months = s.intervalMonths != null ? `${s.intervalMonths} mo` : '';
  const intervalStr = [interval, months].filter(Boolean).join(' / ');
  const statusText = (() => {
    if (s.status === 'overdue') {
      const m = s.milesUntilDue;
      return m != null ? `${Math.abs(Math.round(m)).toLocaleString()} mi past due` : 'overdue';
    }
    if (s.status === 'due_soon') {
      const m = s.milesUntilDue;
      return m != null ? `${Math.round(m).toLocaleString()} mi to go` : 'due soon';
    }
    if (s.status === 'unknown') return 'no interval set';
    if (s.lastDoneAtIso) return `last done ${new Date(s.lastDoneAtIso).toLocaleDateString()}`;
    return 'no record';
  })();
  return (
    <Link href={`/vehicle/${vehicleId}/job/${s.maintenanceType.id}` as const} asChild>
      <Pressable className={`${subdued ? 'bg-surface' : 'bg-surface'} border border-border rounded-2xl p-3 mb-2 active:opacity-80`}>
        <View className="flex-row justify-between items-start">
          <View className="flex-1 pr-2">
            <Text className="text-text font-semibold">{s.maintenanceType.name}</Text>
            {s.maintenanceType.category ? (
              <Text className="text-muted text-xs mt-0.5">{s.maintenanceType.category}  ·  every {intervalStr || '—'}  ·  {s.effectiveProfile}</Text>
            ) : null}
          </View>
          <View className="items-end">
            <Text className={`text-xs ${s.status === 'overdue' ? 'text-danger' : s.status === 'due_soon' ? 'text-warning' : 'text-muted'}`}>
              {statusText}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
