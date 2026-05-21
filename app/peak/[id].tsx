import { useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { MountainSvg } from '@/components/MountainSvg';
import { AscentCard } from '@/components/AscentCard';
import { usePeakById } from '@/lib/queries/usePeaks';
import { useMyAscentForPeak } from '@/lib/queries/useAscents';
import { captureAndShareCard } from '@/lib/share';
import { PEAKS_SEED } from '@/constants/peaks-seed';
import { COLORS } from '@/constants/theme';

export default function PeakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const peakQuery = usePeakById(id);
  const peak = peakQuery.data;
  const ascentQuery = useMyAscentForPeak(peak?.id);
  const ascent = ascentQuery.data;
  const seedIndex = PEAKS_SEED.findIndex((p) => `seed-${p.slug}` === id || p.slug === id);
  const number = seedIndex >= 0 ? String(seedIndex + 1).padStart(3, '0') : '—';
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const { width: winWidth } = useWindowDimensions();
  const cardWidth = Math.min(winWidth - 48, 520);

  const handleShare = async () => {
    if (!peak || !ascent) return;
    try {
      setSharing(true);
      await captureAndShareCard({ ref: cardRef, peakName: peak.name_ko });
    } catch (err) {
      Alert.alert('공유 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
    } finally {
      setSharing(false);
    }
  };

  if (peakQuery.isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.navy} />
      </SafeAreaView>
    );
  }

  if (!peak) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.cream,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <MonoLabel tone="stone">NOT FOUND</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ marginTop: 12, fontSize: 22, color: COLORS.navy, textAlign: 'center' }}
        >
          이 봉우리를 찾지 못했습니다.
        </Text>
        <View style={{ marginTop: 28 }}>
          <Button label="도감으로 돌아가기" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 11, letterSpacing: 2, color: COLORS.navy }}
            >
              ← 도감
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 28, paddingTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <MonoLabel tone="gold">{`№ ${number} · ${peak.region_short ?? peak.region}`}</MonoLabel>
            <MonoLabel tone="stone">
              {peak.list_korea_100 ? '100대 명산' : '추가 봉우리'}
            </MonoLabel>
          </View>

          <Text
            variant="serifKr"
            weight="bold"
            style={{ fontSize: 36, color: COLORS.navy, marginTop: 18 }}
          >
            {peak.name_ko}
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              fontSize: 16,
              color: COLORS.stone,
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {peak.name_en ?? ''}
          </Text>

          <View style={{ alignItems: 'center', marginVertical: 32 }}>
            <MountainSvg size={220} stroke={COLORS.navy} variant="simple" />
            <Text
              variant="mono"
              weight="medium"
              style={{
                marginTop: 18,
                fontSize: 28,
                letterSpacing: -0.5,
                color: COLORS.navy,
              }}
            >
              {peak.elevation_m.toLocaleString()}m
            </Text>
            <MonoLabel tone="stone" style={{ marginTop: 6 }}>
              ELEVATION · 표고
            </MonoLabel>
          </View>

          <Divider />

          <View style={{ paddingVertical: 22, gap: 18 }}>
            <DataRow label="REGION · 지역" value={peak.region} />
            <DataRow
              label="DIFFICULTY · 난이도"
              value={peak.difficulty ? `${peak.difficulty}` : '미지정'}
            />
            <DataRow
              label="COORDINATES · 좌표"
              value={`${peak.latitude.toFixed(4)}, ${peak.longitude.toFixed(4)}`}
              mono
            />
            <DataRow
              label="LISTS · 등재"
              value={
                [
                  peak.list_korea_100 ? '100대 명산' : null,
                  peak.list_baekdudaegan ? '백두대간' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'
              }
            />
          </View>

          <Divider />

          {ascent ? (
            <View style={{ marginTop: 28 }}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <MonoLabel tone="gold">CARD · 인증 카드</MonoLabel>
                <Text
                  variant="serifEn"
                  weight="italic"
                  style={{
                    marginTop: 6,
                    color: COLORS.stone,
                    fontStyle: 'italic',
                    fontSize: 12,
                  }}
                >
                  A page from your trove.
                </Text>
              </View>

              <View style={{ alignSelf: 'center' }}>
                <AscentCard
                  ref={cardRef}
                  peak={peak}
                  photoUrl={ascent.photo_url}
                  ascendedAt={new Date(ascent.ascended_at)}
                  notes={ascent.notes}
                  serialNumber={number}
                  width={cardWidth}
                />
              </View>

              <View style={{ marginTop: 24 }}>
                <Button
                  label={sharing ? '카드 생성 중…' : '인스타그램으로 공유'}
                  size="lg"
                  disabled={sharing}
                  onPress={handleShare}
                />
                <View style={{ marginTop: 10 }}>
                  <Button
                    label="기록 다시 만들기"
                    variant="ghost"
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/add', params: { peakSlug: peak.slug } })
                    }
                  />
                </View>
              </View>
              <Text
                variant="sans"
                style={{
                  textAlign: 'center',
                  marginTop: 12,
                  color: COLORS.stone,
                  fontSize: 11,
                  lineHeight: 16,
                }}
              >
                카드는 1:1 정사각형으로 저장됩니다. 인스타그램·메시지 어디에든 어울립니다.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 32 }}>
              <Button
                label="이 봉우리 정복하기"
                size="lg"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/add', params: { peakSlug: peak.slug } })
                }
              />
              <Text
                variant="sans"
                style={{
                  textAlign: 'center',
                  marginTop: 14,
                  color: COLORS.stone,
                  fontSize: 12,
                }}
              >
                사진을 골라 한 페이지로 만들면 도감에 추가됩니다.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
      }}
    >
      <MonoLabel tone="stone">{label}</MonoLabel>
      <Text
        variant={mono ? 'mono' : 'serifKr'}
        weight="medium"
        style={{ color: COLORS.navy, fontSize: 14, maxWidth: '60%', textAlign: 'right' }}
      >
        {value}
      </Text>
    </View>
  );
}
