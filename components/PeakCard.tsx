import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Text } from './ui/Text';
import { MonoLabel } from './ui/MonoLabel';
import { MountainSvg } from './MountainSvg';
import { COLORS } from '@/constants/theme';
import type { PeakWithAscent } from '@/lib/types';

export type PeakCardProps = {
  peak: PeakWithAscent;
  index: number;
};

export function PeakCard({ peak, index }: PeakCardProps) {
  const collected = Boolean(peak.ascent);
  const number = String(index + 1).padStart(3, '0');

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/peak/[id]', params: { id: peak.id } })}
      style={({ pressed }) => ({
        flex: 1,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          aspectRatio: 0.78,
          backgroundColor: collected ? COLORS.navy : COLORS.cream,
          borderWidth: 1,
          borderColor: collected ? COLORS.gold : COLORS.line,
          borderStyle: collected ? 'solid' : 'dashed',
          padding: 14,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: 10,
              letterSpacing: 1.6,
              color: collected ? COLORS.gold : COLORS.stoneLight,
            }}
          >
            № {number}
          </Text>
          {collected ? (
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 10, letterSpacing: 1.6, color: COLORS.gold }}
            >
              ✕
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <MountainSvg
            size={88}
            stroke={collected ? COLORS.gold : COLORS.stoneLight}
            variant={index % 3 === 0 ? 'twin' : 'simple'}
          />
        </View>

        <View>
          <Text
            variant="serifKr"
            weight="bold"
            style={{
              fontSize: 18,
              color: collected ? COLORS.cream : COLORS.navy,
              marginBottom: 4,
            }}
          >
            {peak.name_ko}
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              fontSize: 12,
              color: collected ? COLORS.stoneLight : COLORS.stone,
              fontStyle: 'italic',
              marginBottom: 8,
            }}
          >
            {peak.name_en ?? ''}
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: collected ? COLORS.gold : COLORS.line,
              marginBottom: 8,
              opacity: collected ? 0.5 : 1,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: 11,
                letterSpacing: 1,
                color: collected ? COLORS.gold : COLORS.navy,
              }}
            >
              {peak.elevation_m.toLocaleString()}m
            </Text>
            <MonoLabel tone={collected ? 'gold' : 'stone'}>
              {peak.region_short ?? peak.region}
            </MonoLabel>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
