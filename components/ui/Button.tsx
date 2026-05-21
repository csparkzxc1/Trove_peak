import { Pressable, View, type PressableProps } from 'react-native';
import { Text } from './Text';
import { COLORS } from '@/constants/theme';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const heights = size === 'lg' ? 56 : size === 'sm' ? 38 : 48;
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={(state) => [
        {
          height: heights,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isPrimary ? COLORS.navy : 'transparent',
          borderWidth: isOutline ? 1 : 0,
          borderColor: COLORS.navy,
          opacity: disabled ? 0.4 : state.pressed ? 0.85 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          variant="mono"
          weight="medium"
          style={{
            fontSize: size === 'sm' ? 10 : 12,
            letterSpacing: size === 'sm' ? 1.6 : 2.4,
            color: isPrimary ? COLORS.cream : COLORS.navy,
          }}
        >
          {label.toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}
