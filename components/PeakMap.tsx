import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { router } from 'expo-router';

import { Text } from './ui/Text';
import { MonoLabel } from './ui/MonoLabel';
import { COLORS } from '@/constants/theme';
import type { PeakWithAscent } from '@/lib/types';

const BOUNDS = { minLat: 33.0, maxLat: 38.7, minLng: 124.5, maxLng: 132.0 };
const REGION_LABELS: { label: string; lat: number; lng: number }[] = [
  { label: '서울', lat: 37.55, lng: 126.98 },
  { label: '부산', lat: 35.18, lng: 129.05 },
  { label: '제주', lat: 33.45, lng: 126.55 },
  { label: '강원', lat: 37.9, lng: 128.3 },
  { label: '경북', lat: 36.3, lng: 128.9 },
  { label: '전남', lat: 34.85, lng: 126.95 },
];

type Projection = (lat: number, lng: number) => { x: number; y: number };

export type PeakMapProps = {
  peaks: PeakWithAscent[];
  width: number;
};

export function PeakMap({ peaks, width }: PeakMapProps) {
  // 한반도 종횡비(대략 0.75)에 맞춘 캔버스.
  const height = Math.round(width * 1.18);
  const project: Projection = (lat, lng) => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * width;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * height;
    return { x, y };
  };

  const [hovered, setHovered] = useState<PeakWithAscent | null>(null);

  // 위경도 그리드.
  const latLines = [34, 35, 36, 37, 38];
  const lngLines = [126, 127, 128, 129, 130];

  return (
    <View>
      <View
        style={{
          width,
          height,
          alignSelf: 'center',
          backgroundColor: COLORS.creamDark,
          borderWidth: 1,
          borderColor: COLORS.line,
        }}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          <Rect x={0} y={0} width={width} height={height} fill={COLORS.creamDark} />
          {latLines.map((lat) => {
            const { y } = project(lat, BOUNDS.minLng);
            return (
              <Line
                key={`lat-${lat}`}
                x1={0}
                y1={y}
                x2={width}
                y2={y}
                stroke={COLORS.line}
                strokeWidth={0.5}
                strokeDasharray="2,4"
              />
            );
          })}
          {lngLines.map((lng) => {
            const { x } = project(BOUNDS.minLat, lng);
            return (
              <Line
                key={`lng-${lng}`}
                x1={x}
                y1={0}
                x2={x}
                y2={height}
                stroke={COLORS.line}
                strokeWidth={0.5}
                strokeDasharray="2,4"
              />
            );
          })}
          {REGION_LABELS.map((r) => {
            const { x, y } = project(r.lat, r.lng);
            return (
              <SvgText
                key={r.label}
                x={x}
                y={y}
                fill={COLORS.stoneLight}
                fontSize={11}
                fontFamily="JetBrainsMono-Medium"
                letterSpacing={1}
                textAnchor="middle"
              >
                {r.label.toUpperCase()}
              </SvgText>
            );
          })}
        </Svg>

        {peaks.map((p) => {
          const { x, y } = project(p.latitude, p.longitude);
          const collected = !!p.ascent;
          const isHover = hovered?.id === p.id;
          const size = collected ? 10 : 8;
          return (
            <Pressable
              key={p.id}
              onPress={() => router.push({ pathname: '/peak/[id]', params: { id: p.id } })}
              onHoverIn={() => setHovered(p)}
              onHoverOut={() => setHovered((cur) => (cur?.id === p.id ? null : cur))}
              hitSlop={4}
              style={{
                position: 'absolute',
                left: x - size,
                top: y - size,
                width: size * 2,
                height: size * 2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: collected ? 11 : 8,
                  height: collected ? 11 : 8,
                  borderRadius: 999,
                  backgroundColor: collected ? COLORS.gold : COLORS.cream,
                  borderWidth: collected ? 0 : 1.2,
                  borderColor: COLORS.stone,
                  transform: isHover ? [{ scale: 1.4 }] : undefined,
                }}
              />
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          marginTop: 12,
          paddingHorizontal: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LegendDot color={COLORS.gold} label="정복" />
          <LegendDot color={COLORS.cream} stroke={COLORS.stone} label="미정복" />
        </View>
        <MonoLabel tone="stone">PROJECTION · LINEAR</MonoLabel>
      </View>

      {hovered ? (
        <View
          style={{
            marginTop: 10,
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: COLORS.line,
            backgroundColor: COLORS.cream,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text
              variant="serifKr"
              weight="bold"
              style={{ fontSize: 15, color: COLORS.navy }}
            >
              {hovered.name_ko}
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 11, color: COLORS.navy }}
            >
              {hovered.elevation_m.toLocaleString()}m
            </Text>
          </View>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              fontSize: 11,
              color: COLORS.stone,
              fontStyle: 'italic',
              marginTop: 1,
            }}
          >
            {hovered.name_en ?? ''} · {hovered.region_short ?? hovered.region}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function LegendDot({
  color,
  stroke,
  label,
}: {
  color: string;
  stroke?: string;
  label: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          borderWidth: stroke ? 1.2 : 0,
          borderColor: stroke ?? 'transparent',
          marginRight: 6,
        }}
      />
      <Text variant="mono" style={{ fontSize: 10, color: COLORS.stone }}>
        {label}
      </Text>
    </View>
  );
}
