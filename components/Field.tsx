import { View, Text, TextInput, Pressable } from 'react-native';

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad' | 'number-pad';
  autoFocus?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="text-muted text-xs mb-1 uppercase tracking-wide">{label}</Text>
      <TextInput
        className="bg-surface border border-border text-text rounded-xl px-3 py-3 text-base"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#566375"
        keyboardType={keyboardType}
        autoFocus={autoFocus}
      />
    </View>
  );
}

export function ChoiceField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | null;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <View className="mb-3">
      <Text className="text-muted text-xs mb-1 uppercase tracking-wide">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`px-3 py-2 rounded-full border ${
              value === o.value ? 'bg-primary border-primary' : 'bg-surface border-border'
            }`}
          >
            <Text className={value === o.value ? 'text-white font-semibold' : 'text-text'}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
