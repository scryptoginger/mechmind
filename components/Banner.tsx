import { View, Text, Pressable } from 'react-native';

type Variant = 'info' | 'warning' | 'danger' | 'success';

const styles: Record<Variant, { bg: string; text: string; border: string }> = {
  info:    { bg: 'bg-surface2', text: 'text-text', border: 'border-border' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/40' },
  danger:  { bg: 'bg-danger/10', text: 'text-danger', border: 'border-danger/40' },
  success: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/40' },
};

export function Banner({
  variant = 'info',
  title,
  subtitle,
  onDismiss,
  onPress,
}: {
  variant?: Variant;
  title: string;
  subtitle?: string;
  onDismiss?: () => void;
  onPress?: () => void;
}) {
  const s = styles[variant];
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} className={`${s.bg} border ${s.border} rounded-2xl p-3 mb-3 active:opacity-80`}>
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className={`${s.text} font-semibold`}>{title}</Text>
          {subtitle ? <Text className="text-muted text-xs mt-1">{subtitle}</Text> : null}
        </View>
        {onDismiss ? (
          <Pressable onPress={onDismiss} className="ml-2 p-1">
            <Text className="text-muted">×</Text>
          </Pressable>
        ) : null}
      </View>
    </Wrapper>
  );
}
