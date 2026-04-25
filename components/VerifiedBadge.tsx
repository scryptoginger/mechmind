import { View, Text } from 'react-native';

export function VerifiedBadge({ verified, conflict }: { verified?: boolean; conflict?: boolean }) {
  if (conflict) {
    return (
      <View className="flex-row items-center bg-danger/15 border border-danger/40 rounded-full px-2 py-0.5">
        <Text className="text-danger text-[10px] font-semibold">⚠ sources disagree</Text>
      </View>
    );
  }
  if (verified) {
    return (
      <View className="flex-row items-center bg-success/15 border border-success/40 rounded-full px-2 py-0.5">
        <Text className="text-success text-[10px] font-semibold">✓ verified</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center bg-warning/10 border border-warning/40 rounded-full px-2 py-0.5">
      <Text className="text-warning text-[10px] font-semibold">single source</Text>
    </View>
  );
}
