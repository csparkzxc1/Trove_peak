import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { MountainSvg } from '@/components/MountainSvg';
import { COLORS } from '@/constants/theme';

export default function AddScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <MonoLabel tone="gold">NEW ENTRY · 정복 등록</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ fontSize: 26, color: COLORS.navy, marginTop: 12, lineHeight: 36 }}
        >
          다음 봉우리에서{`\n`}준비되는 기능입니다.
        </Text>

        <Divider style={{ marginVertical: 32 }} />

        <View style={{ alignItems: 'center', marginVertical: 24 }}>
          <MountainSvg size={160} stroke={COLORS.stoneLight} variant="twin" />
        </View>

        <Text
          variant="sans"
          style={{
            color: COLORS.stone,
            fontSize: 14,
            lineHeight: 22,
            textAlign: 'center',
            marginTop: 12,
          }}
        >
          정상의 사진과 함께 GPS, 시간, 날씨가 자동으로 기록되어{`\n`}봉우리 한 장이
          도감에 더해집니다.
        </Text>

        <View style={{ marginTop: 40 }}>
          <Divider />
          <View style={{ paddingVertical: 18 }}>
            <MonoLabel tone="stone">COMING IN PHASE II</MonoLabel>
            <View style={{ marginTop: 14 }}>
              {[
                '사진 촬영 · 갤러리 선택',
                'GPS 자동 식별 및 봉우리 매칭',
                'AI 누끼 · 인증 카드 자동 생성',
                '인스타그램 · 친구 공유',
              ].map((line) => (
                <View
                  key={line}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 4,
                      height: 4,
                      backgroundColor: COLORS.gold,
                      marginRight: 12,
                    }}
                  />
                  <Text variant="sans" style={{ color: COLORS.ink, fontSize: 14 }}>
                    {line}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <Divider />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
