import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from './ui/Text';
import { MonoLabel } from './ui/MonoLabel';
import { Divider } from './ui/Divider';
import { usePeaks } from '@/lib/queries/usePeaks';
import { COLORS } from '@/constants/theme';
import type { Peak } from '@/lib/types';

export type PeakPickerProps = {
  visible: boolean;
  selectedId: string | null;
  onSelect: (peak: Peak) => void;
  onClose: () => void;
};

export function PeakPicker({ visible, selectedId, onSelect, onClose }: PeakPickerProps) {
  const peaksQuery = usePeaks();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const all = peaksQuery.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) => {
      return (
        p.name_ko.includes(query) ||
        (p.name_en ?? '').toLowerCase().includes(q) ||
        (p.region_short ?? '').includes(query) ||
        p.region.includes(query)
      );
    });
  }, [peaksQuery.data, query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <MonoLabel tone="gold">SELECT · 봉우리 선택</MonoLabel>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text
                variant="mono"
                weight="medium"
                style={{ fontSize: 11, letterSpacing: 2, color: COLORS.navy }}
              >
                닫기 ✕
              </Text>
            </Pressable>
          </View>

          <Text
            variant="serifKr"
            weight="bold"
            style={{ fontSize: 24, color: COLORS.navy, marginTop: 14 }}
          >
            어느 봉우리를 기록하시겠습니까?
          </Text>

          <View
            style={{
              marginTop: 22,
              borderBottomWidth: 1,
              borderBottomColor: COLORS.line,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="이름 · 지역 검색"
              placeholderTextColor={COLORS.stoneLight}
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: 16,
                color: COLORS.ink,
                paddingVertical: 10,
              }}
            />
          </View>
        </View>

        <Divider />

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {filtered.length === 0 ? (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <Text variant="sans" style={{ color: COLORS.stone, fontSize: 14 }}>
                일치하는 봉우리가 없습니다.
              </Text>
            </View>
          ) : (
            filtered.map((peak, index) => {
              const selected = peak.id === selectedId;
              return (
                <Pressable
                  key={peak.id}
                  onPress={() => onSelect(peak)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 24,
                    paddingVertical: 18,
                    backgroundColor: pressed ? COLORS.creamDark : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.line,
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text
                          variant="mono"
                          weight="medium"
                          style={{
                            fontSize: 11,
                            letterSpacing: 1.6,
                            color: selected ? COLORS.gold : COLORS.stoneLight,
                            marginRight: 10,
                          }}
                        >
                          № {String(index + 1).padStart(3, '0')}
                        </Text>
                        <Text
                          variant="serifKr"
                          weight="bold"
                          style={{
                            fontSize: 18,
                            color: selected ? COLORS.gold : COLORS.navy,
                          }}
                        >
                          {peak.name_ko}
                        </Text>
                      </View>
                      <Text
                        variant="serifEn"
                        weight="italic"
                        style={{
                          marginTop: 2,
                          fontSize: 12,
                          color: COLORS.stone,
                          fontStyle: 'italic',
                        }}
                      >
                        {peak.name_en ?? ''} · {peak.region_short ?? peak.region}
                      </Text>
                    </View>
                    <Text
                      variant="mono"
                      weight="medium"
                      style={{
                        fontSize: 12,
                        letterSpacing: 0.5,
                        color: selected ? COLORS.gold : COLORS.navy,
                      }}
                    >
                      {peak.elevation_m.toLocaleString()}m
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
