import { View, type ViewProps } from 'react-native';
import { Text } from './ui/Text';
import { COLORS } from '@/constants/theme';

export type BrandWordmarkProps = ViewProps & {
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center';
};

const SIZES = {
  sm: { trove: 18, peaks: 11, gap: 4 },
  md: { trove: 26, peaks: 13, gap: 6 },
  lg: { trove: 40, peaks: 16, gap: 8 },
} as const;

export function BrandWordmark({
  size = 'md',
  align = 'center',
  style,
  ...rest
}: BrandWordmarkProps) {
  const dim = SIZES[size];
  return (
    <View
      {...rest}
      style={[{ alignItems: align === 'center' ? 'center' : 'flex-start' }, style]}
    >
      <Text
        variant="serifEn"
        weight="medium"
        style={{
          fontSize: dim.trove,
          color: COLORS.navy,
          letterSpacing: dim.trove * 0.18,
        }}
      >
        TROVE
      </Text>
      <View style={{ height: dim.gap }} />
      <Text
        variant="serifEn"
        weight="italic"
        style={{
          fontSize: dim.peaks,
          color: COLORS.gold,
          letterSpacing: dim.peaks * 0.1,
          fontStyle: 'italic',
        }}
      >
        peaks
      </Text>
    </View>
  );
}
