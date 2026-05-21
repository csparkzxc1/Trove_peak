import { useMemo } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { useCollectionSummary } from '@/lib/queries/useProfiles';
import { useMyAscents } from '@/lib/queries/useAscents';
import { usePeaks } from '@/lib/queries/usePeaks';
import { COLORS } from '@/constants/theme';
import type { Peak } from '@/lib/types';

type ComparisonBucket = {
  key: 'both' | 'theirs' | 'mine';
  label: string;
  sub: string;
  peaks: Peak[];
  tone: 'gold' | 'navy' | 'stone';
};

export default function FriendProfileScreen() {
  const { nickname: rawNickname } = useLocalSearchParams<{ nickname: string }>();
  const nickname = decodeURIComponent(rawNickname ?? '');
  const summaryQuery = useCollectionSummary(nickname);
  const myAscentsQuery = useMyAscents();
  const peaksQuery = usePeaks();

  const buckets = useMemo<ComparisonBucket[]>(() => {
    const peaks = peaksQuery.data ?? [];
    const theirSet = new Set(summaryQuery.data?.collected_peak_ids ?? []);
    const mySet = new Set((myAscentsQuery.data ?? []).map((a) => a.peak_id));

    const both: Peak[] = [];
    const theirs: Peak[] = [];
    const mine: Peak[] = [];
    for (const p of peaks) {
      const inT = theirSet.has(p.id);
      const inM = mySet.has(p.id);
      if (inT && inM) both.push(p);
      else if (inT) theirs.push(p);
      else if (inM) mine.push(p);
    }
    return [
      {
        key: 'both',
        label: '우리 둘 다',
        sub: 'BOTH OF US',
        peaks: both,
        tone: 'gold',
      },
      {
        key: 'theirs',
        label: `${nickname}님만`,
        sub: 'ONLY THEY',
        peaks: theirs,
        tone: 'navy',
      },
      {
        key: 'mine',
        label: '나만',
        sub: 'ONLY I',
        peaks: mine,
        tone: 'stone',
      },
    ];
  }, [peaksQuery.data, summaryQuery.data, myAscentsQuery.data, nickname]);

  const isLoading =
    summaryQuery.isLoading || peaksQuery.isLoading || myAscentsQuery.isLoading;

  if (isLoading) {
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

  if (!summaryQuery.data) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.cream,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <MonoLabel tone="stone">NOT FOUND</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ marginTop: 12, fontSize: 22, color: COLORS.navy, textAlign: 'center' }}
        >
          {nickname}님을 찾지 못했습니다.
        </Text>
        <Text
          variant="sans"
          style={{
            marginTop: 8,
            color: COLORS.stone,
            fontSize: 13,
            textAlign: 'center',
            lineHeight: 20,
          }}
        >
          닉네임이 정확한지 확인해 주세요. Supabase에 `profiles` 테이블·`collection_summary` 뷰가 설정되지 않았다면 검색이 동작하지 않습니다.
        </Text>
        <View style={{ marginTop: 28 }}>
          <Button label="돌아가기" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const totalCollected = summaryQuery.data.collected_count;
  const total100 = (peaksQuery.data ?? []).filter((p) => p.list_korea_100).length;
  const totalBaek = (peaksQuery.data ?? []).filter((p) => p.list_baekdudaegan).length;
  const theirSet = new Set(summaryQuery.data.collected_peak_ids);
  const their100 = (peaksQuery.data ?? []).filter(
    (p) => p.list_korea_100 && theirSet.has(p.id)
  ).length;
  const theirBaek = (peaksQuery.data ?? []).filter(
    (p) => p.list_baekdudaegan && theirSet.has(p.id)
  ).length;

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
              ← 친구 찾기
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 28, paddingTop: 28 }}>
          <MonoLabel tone="gold">FRIEND · 다른 등산인의 도감</MonoLabel>
          <Text
            variant="serifKr"
            weight="bold"
            style={{ fontSize: 36, color: COLORS.navy, marginTop: 12 }}
          >
            {nickname}
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              fontSize: 14,
              color: COLORS.stone,
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            Their trove of summits.
          </Text>

          <Divider style={{ marginTop: 28 }} />

          <View style={{ marginTop: 22, flexDirection: 'row', gap: 14 }}>
            <StatBlock
              label="TOTAL"
              value={String(totalCollected)}
              denom={String((peaksQuery.data ?? []).length)}
            />
            <StatBlock
              label="100대 명산"
              value={String(their100)}
              denom={String(total100)}
            />
            <StatBlock
              label="백두대간"
              value={String(theirBaek)}
              denom={String(totalBaek)}
            />
          </View>

          <Divider style={{ marginTop: 32 }} />

          <View style={{ marginTop: 24 }}>
            <Text
              variant="serifKr"
              weight="bold"
              style={{ fontSize: 22, color: COLORS.navy, marginBottom: 18 }}
            >
              컬렉션 비교
            </Text>
            {buckets.map((b) => (
              <BucketSection key={b.key} bucket={b} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBlock({
  label,
  value,
  denom,
}: {
  label: string;
  value: string;
  denom: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: COLORS.line,
        padding: 14,
      }}
    >
      <MonoLabel tone="stone">{label}</MonoLabel>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 6 }}>
        <Text
          variant="mono"
          weight="medium"
          style={{ fontSize: 24, color: COLORS.navy }}
        >
          {value}
        </Text>
        <Text
          variant="mono"
          style={{ fontSize: 12, color: COLORS.stone, marginLeft: 4 }}
        >
          / {denom}
        </Text>
      </View>
    </View>
  );
}

function BucketSection({ bucket }: { bucket: ComparisonBucket }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 10,
        }}
      >
        <Text
          variant="serifKr"
          weight="bold"
          style={{ fontSize: 16, color: COLORS.navy }}
        >
          {bucket.label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <MonoLabel tone={bucket.tone}>{bucket.sub}</MonoLabel>
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: 11,
              color: COLORS.stone,
              marginLeft: 8,
            }}
          >
            {bucket.peaks.length}
          </Text>
        </View>
      </View>
      {bucket.peaks.length === 0 ? (
        <View
          style={{
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: COLORS.line,
            alignItems: 'center',
          }}
        >
          <Text variant="sans" style={{ fontSize: 12, color: COLORS.stoneLight }}>
            해당 봉우리가 없습니다.
          </Text>
        </View>
      ) : (
        <View>
          {bucket.peaks.map((p) => (
            <PeakRow key={p.id} peak={p} />
          ))}
        </View>
      )}
    </View>
  );
}

function PeakRow({ peak }: { peak: Peak }) {
  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/peak/[id]', params: { id: peak.id } })
      }
      style={({ pressed }) => ({
        paddingVertical: 11,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.line,
        backgroundColor: pressed ? COLORS.creamDark : 'transparent',
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      })}
    >
      <View style={{ flex: 1 }}>
        <Text
          variant="serifKr"
          weight="medium"
          style={{ fontSize: 15, color: COLORS.navy }}
        >
          {peak.name_ko}
        </Text>
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
          {peak.name_en ?? ''} · {peak.region_short ?? peak.region}
        </Text>
      </View>
      <Text
        variant="mono"
        weight="medium"
        style={{ fontSize: 12, color: COLORS.navy }}
      >
        {peak.elevation_m.toLocaleString()}m
      </Text>
    </Pressable>
  );
}
