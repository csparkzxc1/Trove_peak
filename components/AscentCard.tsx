import { forwardRef } from 'react';
import { Image, View } from 'react-native';
import type { ViewProps } from 'react-native';

import { Text } from './ui/Text';
import { Divider } from './ui/Divider';
import { BrandWordmark } from './BrandWordmark';
import { COLORS } from '@/constants/theme';
import type { Peak } from '@/lib/types';

export type AscentCardProps = ViewProps & {
  peak: Peak;
  photoUrl: string | null;
  ascendedAt: Date;
  notes?: string | null;
  serialNumber?: string;
  width?: number;
};

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// 인스타 정사각형(1:1) 비율 인증 카드.
// react-native-view-shot의 captureRef로 캡처해 공유한다.
export const AscentCard = forwardRef<View, AscentCardProps>(function AscentCard(
  { peak, photoUrl, ascendedAt, notes, serialNumber, width = 1080, style, ...rest },
  ref
) {
  const scale = width / 1080;
  const px = (n: number) => n * scale;

  return (
    <View
      ref={ref}
      collapsable={false}
      {...rest}
      style={[
        {
          width,
          height: width,
          backgroundColor: COLORS.cream,
          padding: px(56),
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderWidth: px(1),
          borderColor: COLORS.navy,
          padding: px(28),
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: px(18),
              letterSpacing: px(3),
              color: COLORS.gold,
            }}
          >
            {`№ ${serialNumber ?? '—'} · ${peak.region_short ?? peak.region}`.toUpperCase()}
          </Text>
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: px(16),
              letterSpacing: px(3),
              color: COLORS.stone,
            }}
          >
            {(peak.list_korea_100 ? '100대 명산' : '봉우리').toUpperCase()}
          </Text>
        </View>

        <View
          style={{
            marginTop: px(20),
            backgroundColor: COLORS.line,
            aspectRatio: 1.4,
            width: '100%',
            overflow: 'hidden',
            borderWidth: px(1),
            borderColor: COLORS.navy,
          }}
        >
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="serifEn"
                weight="italic"
                style={{ color: COLORS.stone, fontSize: px(28), fontStyle: 'italic' }}
              >
                No photo on record.
              </Text>
            </View>
          )}
        </View>

        <View style={{ marginTop: px(28) }}>
          <Text
            variant="serifKr"
            weight="bold"
            style={{
              fontSize: px(72),
              color: COLORS.navy,
              lineHeight: px(80),
            }}
          >
            {peak.name_ko}
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              marginTop: px(4),
              fontSize: px(28),
              color: COLORS.stone,
              fontStyle: 'italic',
            }}
          >
            {peak.name_en ?? ''}
          </Text>
        </View>

        <Divider style={{ marginVertical: px(20) }} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(14),
                letterSpacing: px(2),
                color: COLORS.stone,
              }}
            >
              ELEVATION
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(36),
                color: COLORS.navy,
                marginTop: px(6),
              }}
            >
              {peak.elevation_m.toLocaleString()}m
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(14),
                letterSpacing: px(2),
                color: COLORS.stone,
              }}
            >
              ASCENDED
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(36),
                color: COLORS.navy,
                marginTop: px(6),
              }}
            >
              {formatKoreanDate(ascendedAt)}
            </Text>
          </View>
        </View>

        {notes ? (
          <View style={{ marginTop: px(20) }}>
            <Text
              variant="serifKr"
              weight="regular"
              style={{
                fontSize: px(22),
                color: COLORS.ink,
                lineHeight: px(32),
                fontStyle: 'italic',
              }}
              numberOfLines={2}
            >
              “{notes}”
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <View style={{ flex: 1 }} />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: px(20),
          }}
        >
          <BrandWordmark size="sm" align="left" />
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: px(12),
              letterSpacing: px(2),
              color: COLORS.stone,
            }}
          >
            TROVE PEAKS · VOL. I
          </Text>
        </View>
      </View>
    </View>
  );
});
