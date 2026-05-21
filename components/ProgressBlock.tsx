import { View } from 'react-native';
import { Text } from './ui/Text';
import { MonoLabel } from './ui/MonoLabel';
import { COLORS } from '@/constants/theme';

export type ProgressBlockProps = {
  collected: number;
  total: number;
};

export function ProgressBlock({ collected, total }: ProgressBlockProps) {
  const pct = total > 0 ? Math.round((collected / total) * 100) : 0;
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.line,
        padding: 18,
        backgroundColor: COLORS.cream,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View>
          <MonoLabel tone="gold">YOUR COLLECTION</MonoLabel>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 40, color: COLORS.navy, letterSpacing: -1 }}
            >
              {String(collected).padStart(2, '0')}
            </Text>
            <Text
              variant="mono"
              style={{ fontSize: 22, color: COLORS.stoneLight, marginHorizontal: 4 }}
            >
              /
            </Text>
            <Text variant="mono" style={{ fontSize: 22, color: COLORS.stoneLight }}>
              {String(total).padStart(3, '0')}
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <MonoLabel tone="stone">COMPLETE</MonoLabel>
          <Text
            variant="mono"
            weight="medium"
            style={{ fontSize: 18, color: COLORS.navy, marginTop: 8, letterSpacing: 0.5 }}
          >
            {pct}%
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 18, height: 1, backgroundColor: COLORS.line }}>
        <View
          style={{
            height: 1,
            width: `${Math.min(100, pct)}%`,
            backgroundColor: COLORS.gold,
          }}
        />
      </View>

      <Text
        variant="sans"
        style={{ marginTop: 14, color: COLORS.stone, fontSize: 12, lineHeight: 18 }}
      >
        {collected === 0
          ? '도감이 비어 있습니다. 첫 봉우리를 기다리는 중.'
          : `${collected}번째 봉우리. 컬렉션이 조금씩 차오릅니다.`}
      </Text>
    </View>
  );
}
