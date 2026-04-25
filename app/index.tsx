import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { vehicleRepo } from '../lib/repositories/vehicleRepo';
import type { Vehicle } from '../lib/types/Vehicle';

export default function Home() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await vehicleRepo.findAll();
    setVehicles(rows);
  }, []);

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

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      <Text className="text-text text-2xl font-bold mb-1">Garage</Text>
      <Text className="text-muted text-sm mb-4">
        {vehicles.length === 0
          ? 'Add your first vehicle to start tracking maintenance.'
          : `${vehicles.length} vehicle${vehicles.length === 1 ? '' : 's'}`}
      </Text>

      {vehicles.map((v) => (
        <Link key={v.id} href={`/vehicle/${v.id}` as const} asChild>
          <Pressable className="bg-surface border border-border rounded-2xl p-4 mb-3 active:opacity-80">
            <Text className="text-text text-lg font-semibold">
              {v.year} {v.make} {v.model}
            </Text>
            <Text className="text-muted text-sm mt-1">
              {[v.trim, v.cab, v.bed, v.engine, v.transmission, v.drivetrain].filter(Boolean).join(' · ')}
            </Text>
            <Text className="text-muted text-xs mt-2">
              {v.currentOdometer != null ? `${v.currentOdometer.toLocaleString()} mi` : 'Odometer not set'}
              {v.serviceProfile ? `  ·  service: ${v.serviceProfile}` : ''}
            </Text>
          </Pressable>
        </Link>
      ))}

      <Pressable
        onPress={() => router.push('/vehicle/new')}
        className="mt-2 bg-primary rounded-2xl p-4 items-center active:opacity-80"
      >
        <Text className="text-white font-semibold">+ Add Vehicle</Text>
      </Pressable>

      {vehicles.length > 0 && (
        <Pressable
          onPress={() => router.push(`/vehicle/${vehicles[0].id}/odometer/new` as const)}
          className="mt-3 bg-surface2 border border-border rounded-2xl p-4 items-center active:opacity-80"
        >
          <Text className="text-text font-semibold">⛽  Quick fill-up entry</Text>
          <Text className="text-muted text-xs mt-1">Log odometer for {vehicles[0].year} {vehicles[0].model}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
