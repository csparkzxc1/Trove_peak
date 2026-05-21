import { View, type ViewProps } from 'react-native';
import { COLORS } from '@/constants/theme';

export type CardProps = ViewProps & {
  tone?: 'cream' | 'navy' | 'transparent';
  bordered?: boolean;
  dashed?: boolean;
};

export function Card({
  tone = 'cream',
  bordered = true,
  dashed = false,
  style,
  children,
  ...rest
}: CardProps) {
  const bg =
    tone === 'navy' ? COLORS.navy : tone === 'transparent' ? 'transparent' : COLORS.cream;
  const border =
    tone === 'navy' ? COLORS.gold : COLORS.line;
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: bg,
          borderRadius: 2,
          padding: 16,
          ...(bordered
            ? {
                borderWidth: 1,
                borderColor: border,
                borderStyle: dashed ? 'dashed' : 'solid',
              }
            : null),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
