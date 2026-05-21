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
  // 'studio'는 누끼(cutout) PNG를 어두운 네이비 배경 위에 띄우는 박물관식 변형.
  variant?: 'classic' | 'studio';
  // '1:1' 인스타 피드(정사각), '9:16' 인스타 스토리(세로).
  aspect?: '1:1' | '9:16';
};

function formatKoreanDate(d: Date): string {
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// 인스타 정사각형(1:1) 비율 인증 카드.
// react-native-view-shot의 captureRef로 캡처해 공유한다.
export const AscentCard = forwardRef<View, AscentCardProps>(function AscentCard(
  {
    peak,
    photoUrl,
    ascendedAt,
    notes,
    serialNumber,
    width = 1080,
    variant = 'classic',
    aspect = '1:1',
    style,
    ...rest
  },
  ref
) {
  const scale = width / 1080;
  const px = (n: number) => n * scale;
  const studio = variant === 'studio';
  const bg = studio ? COLORS.navy : COLORS.cream;
  const fg = studio ? COLORS.cream : COLORS.navy;
  const sub = studio ? '#9DA4AC' : COLORS.stone;
  const border = studio ? COLORS.gold : COLORS.navy;
  const story = aspect === '9:16';
  const height = story ? Math.round(width * (16 / 9)) : width;
  const photoAspect = story ? 1 : 1.4;

  return (
    <View
      ref={ref}
      collapsable={false}
      {...rest}
      style={[
        {
          width,
          height,
          backgroundColor: bg,
          padding: story ? px(72) : px(56),
        },
        style,
      ]}
    >
      <View
        style={{
          flex: 1,
          borderWidth: px(1),
          borderColor: border,
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
              color: sub,
            }}
          >
            {(peak.list_korea_100 ? '100대 명산' : '봉우리').toUpperCase()}
          </Text>
        </View>

        <View
          style={{
            marginTop: px(story ? 28 : 20),
            backgroundColor: studio ? COLORS.navy : COLORS.line,
            aspectRatio: photoAspect,
            width: '100%',
            overflow: 'hidden',
            borderWidth: px(1),
            borderColor: border,
          }}
        >
          {photoUrl ? (
            <Image
              source={{ uri: photoUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode={studio ? 'contain' : 'cover'}
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
                style={{ color: sub, fontSize: px(28), fontStyle: 'italic' }}
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
              fontSize: px(story ? 96 : 72),
              color: fg,
              lineHeight: px(story ? 108 : 80),
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
              color: sub,
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
                color: sub,
              }}
            >
              ELEVATION
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(36),
                color: fg,
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
                color: sub,
              }}
            >
              ASCENDED
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: px(36),
                color: fg,
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
                color: fg,
                lineHeight: px(32),
                fontStyle: 'italic',
              }}
              numberOfLines={story ? 5 : 2}
            >
              "{notes}"
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
          <BrandWordmark size="sm" align="left" tone={studio ? 'cream' : 'navy'} />
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: px(12),
              letterSpacing: px(2),
              color: sub,
            }}
          >
            TROVE PEAKS · VOL. I
          </Text>
        </View>
      </View>
    </View>
  );
});
