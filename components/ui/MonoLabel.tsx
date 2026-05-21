import { View, type ViewProps } from 'react-native';
import { Text } from './Text';
import { COLORS } from '@/constants/theme';

export type MonoLabelProps = ViewProps & {
  children: string;
  tone?: 'navy' | 'gold' | 'stone';
};

const TONE = {
  navy: COLORS.navy,
  gold: COLORS.gold,
  stone: COLORS.stone,
} as const;

export function MonoLabel({ children, tone = 'stone', style, ...rest }: MonoLabelProps) {
  return (
    <View style={style} {...rest}>
      <Text
        variant="mono"
        weight="medium"
        style={{
          fontSize: 11,
          letterSpacing: 2.2,
          color: TONE[tone],
        }}
      >
        {children.toUpperCase()}
      </Text>
    </View>
  );
}
