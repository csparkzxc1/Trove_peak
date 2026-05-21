import { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
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

export default function CollectionScreen() {
  const peaksQuery = usePeaks();
  const ascentsQuery = useMyAscents();

  const decorated = useMemo(() => {
    const peaks = peaksQuery.data ?? [];
    const ascents = ascentsQuery.data ?? [];
    return decoratePeaksWithAscents(peaks, ascents);
  }, [peaksQuery.data, ascentsQuery.data]);

  const collectedCount = decorated.filter((p) => p.ascent).length;

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

        <ProgressBlock collected={collectedCount} total={TOTAL_TARGET} />

        <View style={{ marginTop: 32, marginBottom: 14 }}>
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
              한국의 봉우리
            </Text>
            <Text
              variant="serifEn"
              weight="italic"
              style={{ fontSize: 14, color: COLORS.stone, fontStyle: 'italic' }}
            >
              Peaks of Korea
            </Text>
          </View>
          <Divider style={{ marginTop: 14 }} />
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
          {decorated.map((peak, index) => (
            <View key={peak.id} style={{ width: '50%', padding: 6 }}>
              <PeakCard peak={peak} index={index} />
            </View>
          ))}
        </View>

        <View style={{ marginTop: 28, alignItems: 'center' }}>
          <MonoLabel tone="stone">
            {`12 OF ${TOTAL_TARGET} CATALOGUED · MORE TO COME`}
          </MonoLabel>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
