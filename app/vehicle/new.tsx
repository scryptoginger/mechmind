import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { TextField, ChoiceField } from '../../components/Field';
import { vehicleRepo } from '../../lib/repositories/vehicleRepo';
import type { ServiceProfile } from '../../lib/types/Vehicle';

export default function NewVehicle() {
  const router = useRouter();

  const [year, setYear] = useState('2017');
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Tacoma');
  const [trim, setTrim] = useState('TRD Off-Road');
  const [cab, setCab] = useState<string | null>('double_cab');
  const [bed, setBed] = useState<string | null>('long');
  const [engine] = useState('4.0L V6 1GR-FE');
  const [transmission, setTransmission] = useState<string | null>(null);
  const [drivetrain, setDrivetrain] = useState<string | null>('4WD');
  const [odo, setOdo] = useState('');
  const [profile, setProfile] = useState<ServiceProfile>('mixed');

  const submit = async () => {
    const yr = parseInt(year, 10);
    if (Number.isNaN(yr)) {
      Alert.alert('Year must be a number');
      return;
    }
    if (!transmission) {
      Alert.alert('Pick a transmission', 'The maintenance catalog needs to know whether you have the AC60F automatic or RA63F manual.');
      return;
    }
    const odoNum = odo ? parseInt(odo.replace(/[, ]/g, ''), 10) : null;
    const v = await vehicleRepo.create({
      year: yr,
      make,
      model,
      trim: trim || null,
      cab,
      bed,
      engine,
      transmission,
      drivetrain,
      currentOdometer: odoNum,
      serviceProfile: profile,
    });
    router.replace(`/vehicle/${v.id}` as const);
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Stack.Screen options={{ title: 'Add Vehicle' }} />
      <Text className="text-text text-xl font-bold mb-2">Vehicle</Text>

      <View className="flex-row gap-2">
        <View className="flex-1"><TextField label="Year" value={year} onChangeText={setYear} keyboardType="number-pad" /></View>
        <View className="flex-1"><TextField label="Make" value={make} onChangeText={setMake} /></View>
      </View>
      <TextField label="Model" value={model} onChangeText={setModel} />
      <TextField label="Trim" value={trim} onChangeText={setTrim} />

      <ChoiceField label="Cab" value={cab as any} onChange={setCab as any} options={[
        { value: 'double_cab', label: 'Double Cab' },
        { value: 'access_cab', label: 'Access Cab' },
        { value: 'regular_cab', label: 'Regular Cab' },
      ]} />
      <ChoiceField label="Bed" value={bed as any} onChange={setBed as any} options={[
        { value: 'long', label: 'Long Bed' },
        { value: 'short', label: 'Short Bed' },
      ]} />
      <View className="mb-3">
        <Text className="text-muted text-xs mb-1 uppercase tracking-wide">Engine</Text>
        <Text className="text-text text-base">{engine}</Text>
      </View>
      <ChoiceField label="Transmission" value={transmission as any} onChange={setTransmission as any} options={[
        { value: '6AT_AC60F', label: '6-spd Automatic (AC60F)' },
        { value: '6MT_RA63F', label: '6-spd Manual (RA63F)' },
      ]} />
      <ChoiceField label="Drivetrain" value={drivetrain as any} onChange={setDrivetrain as any} options={[
        { value: '4WD', label: '4WD' },
        { value: '2WD', label: '2WD' },
      ]} />
      <TextField label="Current odometer" value={odo} onChangeText={setOdo} keyboardType="number-pad" placeholder="e.g. 87500" />
      <ChoiceField label="Service profile" value={profile} onChange={setProfile} options={[
        { value: 'normal', label: 'Normal' },
        { value: 'severe', label: 'Severe' },
        { value: 'mixed', label: 'Mixed' },
      ]} />

      <Pressable onPress={submit} className="bg-primary rounded-2xl p-4 items-center mt-4 active:opacity-80">
        <Text className="text-white font-semibold">Save vehicle</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} className="p-4 items-center mt-1">
        <Text className="text-muted">Cancel</Text>
      </Pressable>
    </ScrollView>
  );
}
