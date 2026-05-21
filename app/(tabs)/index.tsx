import { useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { BrandWordmark } from '@/components/BrandWordmark';
import { PeakCard } from '@/components/PeakCard';
import { ProgressBlock } from '@/components/ProgressBlock';

import { usePeaks, decoratePeaksWithAscents } from '@/lib/queries/usePeaks';
import { useMyAscents } from '@/lib/queries/useAscents';
import { TOTAL_TARGET } from '@/constants/peaks-seed';
import { COLORS } from '@/constants/theme';

type ListFilter = 'korea_100' | 'baekdudaegan';

export default function CollectionScreen() {
  const peaksQuery = usePeaks();
  const ascentsQuery = useMyAscents();
  const [filter, setFilter] = useState<ListFilter>('korea_100');

  const decorated = useMemo(() => {
    const peaks = peaksQuery.data ?? [];
    const ascents = ascentsQuery.data ?? [];
    return decoratePeaksWithAscents(peaks, ascents);
  }, [peaksQuery.data, ascentsQuery.data]);

  const filtered = useMemo(() => {
    return decorated.filter((p) =>
      filter === 'baekdudaegan' ? p.list_baekdudaegan : p.list_korea_100
    );
  }, [decorated, filter]);

  const collectedCount = filtered.filter((p) => p.ascent).length;
  const target = filter === 'baekdudaegan' ? filtered.length : TOTAL_TARGET;

  if (peaksQuery.isLoading) {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 28,
          }}
        >
          <BrandWordmark size="sm" align="left" />
          <MonoLabel tone="stone">VOL. I · 2026</MonoLabel>
        </View>

        <ProgressBlock collected={collectedCount} total={target} />

        <View style={{ marginTop: 28 }}>
          <FilterTabs value={filter} onChange={setFilter} />
        </View>

        <View style={{ marginTop: 22, marginBottom: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <Text
              variant="serifKr"
              weight="bold"
              style={{ fontSize: 22, color: COLORS.navy }}
            >
              {filter === 'baekdudaegan' ? '백두대간의 봉우리' : '한국의 봉우리'}
            </Text>
            <Text
              variant="serifEn"
              weight="italic"
              style={{ fontSize: 14, color: COLORS.stone, fontStyle: 'italic' }}
            >
              {filter === 'baekdudaegan' ? 'Baekdudaegan' : 'Peaks of Korea'}
            </Text>
          </View>
          <Divider style={{ marginTop: 14 }} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {filtered.map((peak, index) => (
            <View key={peak.id} style={{ width: '50%', padding: 6 }}>
              <PeakCard peak={peak} index={index} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28, alignItems: 'center' }}>
          <MonoLabel tone="stone">
            {`${filtered.length} OF ${target} CATALOGUED`}
          </MonoLabel>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterTabs({
  value,
  onChange,
}: {
  value: ListFilter;
  onChange: (next: ListFilter) => void;
}) {
  const tabs: { id: ListFilter; label: string; sub: string }[] = [
    { id: 'korea_100', label: '100대 명산', sub: '산림청 지정' },
    { id: 'baekdudaegan', label: '백두대간', sub: '한반도의 등뼈' },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: COLORS.navy,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 14,
              backgroundColor: active
                ? COLORS.navy
                : pressed
                  ? COLORS.creamDark
                  : 'transparent',
            })}
          >
            <Text
              variant="serifKr"
              weight="bold"
              style={{
                fontSize: 15,
                color: active ? COLORS.cream : COLORS.navy,
              }}
            >
              {tab.label}
            </Text>
            <Text
              variant="mono"
              weight="medium"
              style={{
                fontSize: 10,
                letterSpacing: 1.4,
                color: active ? COLORS.cream : COLORS.stone,
                marginTop: 2,
              }}
            >
              {tab.sub}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
