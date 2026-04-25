import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { TextField, ChoiceField } from '../../../components/Field';
import { vehicleRepo } from '../../../lib/repositories/vehicleRepo';
import type { ServiceProfile, Vehicle } from '../../../lib/types/Vehicle';

export default function EditVehicle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [v, setV] = useState<Vehicle | null>(null);
  const [year, setYear] = useState('');
  const [trim, setTrim] = useState('');
  const [transmission, setTransmission] = useState<string | null>(null);
  const [drivetrain, setDrivetrain] = useState<string | null>(null);
  const [odo, setOdo] = useState('');
  const [profile, setProfile] = useState<ServiceProfile>('mixed');

  useEffect(() => {
    if (!id) return;
    vehicleRepo.findById(id).then((row) => {
      if (!row) return;
      setV(row);
      setYear(String(row.year));
      setTrim(row.trim ?? '');
      setTransmission(row.transmission);
      setDrivetrain(row.drivetrain);
      setOdo(row.currentOdometer != null ? String(row.currentOdometer) : '');
      setProfile((row.serviceProfile as ServiceProfile) ?? 'normal');
    });
  }, [id]);

  if (!v) return <View className="flex-1 bg-bg" />;

  const save = async () => {
    const yr = parseInt(year, 10);
    if (Number.isNaN(yr)) return Alert.alert('Year must be a number');
    const odoNum = odo ? parseInt(odo.replace(/[, ]/g, ''), 10) : null;
    await vehicleRepo.update(v.id, {
      year: yr,
      trim: trim || null,
      transmission,
      drivetrain,
      currentOdometer: odoNum,
      serviceProfile: profile,
    });
    router.back();
  };

  const remove = () => {
    Alert.alert('Delete vehicle?', 'Logs and odometer readings stay in the DB but the vehicle disappears from the list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await vehicleRepo.delete(v.id);
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Edit Vehicle' }} />
      <TextField label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
      <TextField label="Trim" value={trim} onChangeText={setTrim} />
      <ChoiceField label="Transmission" value={transmission as any} onChange={setTransmission as any} options={[
        { value: '6AT_AC60F', label: '6-spd Automatic (AC60F)' },
        { value: '6MT_RA63F', label: '6-spd Manual (RA63F)' },
      ]} />
      <ChoiceField label="Drivetrain" value={drivetrain as any} onChange={setDrivetrain as any} options={[
        { value: '4WD', label: '4WD' },
        { value: '2WD', label: '2WD' },
      ]} />
      <TextField label="Current odometer" value={odo} onChangeText={setOdo} keyboardType="number-pad" />
      <ChoiceField label="Service profile" value={profile} onChange={setProfile} options={[
        { value: 'normal', label: 'Normal' },
        { value: 'severe', label: 'Severe' },
        { value: 'mixed', label: 'Mixed' },
      ]} />

      <Pressable onPress={save} className="bg-primary rounded-2xl p-4 items-center mt-4 active:opacity-80">
        <Text className="text-white font-semibold">Save</Text>
      </Pressable>
      <Pressable onPress={remove} className="border border-danger rounded-2xl p-3 items-center mt-3 active:opacity-80">
        <Text className="text-danger font-semibold">Delete vehicle</Text>
      </Pressable>
    </ScrollView>
  );
}
