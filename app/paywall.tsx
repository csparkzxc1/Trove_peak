import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { BrandWordmark } from '@/components/BrandWordmark';
import { COLORS } from '@/constants/theme';

// Plus 가격은 출시 시점에 ASC/Play Console의 product_id로 동기화한다.
// 여기 표기는 placeholder.
const PRICE_MONTHLY = '₩2,900';
const PRICE_YEARLY = '₩19,000';
const PRICE_LIFETIME = '₩39,000';

const BENEFITS: { title: string; sub: string }[] = [
  {
    title: 'AI 봉우리 식별',
    sub: 'Claude Vision으로 사진 한 장에서 어느 봉우리인지 자동 인식.',
  },
  {
    title: '스튜디오 모드 카드',
    sub: '봉우리를 배경에서 도려낸 박물관 어둠 카드로 변형.',
  },
  {
    title: '무제한 PDF 도감',
    sub: '표지·목차·페이지의 인쇄용 도감을 언제든 내보내기.',
  },
  {
    title: '향후 추가될 변형 카드',
    sub: '인쇄 카드, 한정판 표지, 시즌 컬렉션이 자동 잠금 해제됩니다.',
  },
];

export default function PaywallScreen() {
  const handlePurchase = (tier: string) => {
    Alert.alert(
      `${tier} · 결제 통합 준비 중`,
      '실제 결제는 RevenueCat + App Store/Play Console 상품이 활성화되면 동작합니다.\n\n출시 전엔 Supabase 콘솔에서 profiles.is_pro 를 직접 true로 토글해 테스트할 수 있습니다.'
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.navy }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: 12,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 11, letterSpacing: 2, color: COLORS.cream }}
            >
              닫기 ✕
            </Text>
          </Pressable>
          <BrandWordmark size="sm" align="left" tone="cream" />
        </View>

        <View style={{ paddingHorizontal: 28, paddingTop: 36 }}>
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: 11,
              letterSpacing: 3,
              color: COLORS.gold,
            }}
          >
            TROVE PLUS · 정회원
          </Text>
          <Text
            variant="serifKr"
            weight="bold"
            style={{
              marginTop: 14,
              fontSize: 32,
              color: COLORS.cream,
              lineHeight: 42,
            }}
          >
            도감의 모든 페이지를{`\n`}한 권으로.
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              marginTop: 8,
              fontSize: 14,
              color: '#9DA4AC',
              fontStyle: 'italic',
            }}
          >
            The full trove · one volume.
          </Text>

          <View
            style={{
              marginTop: 32,
              borderTopWidth: 1,
              borderTopColor: COLORS.gold,
              paddingTop: 24,
              gap: 22,
            }}
          >
            {BENEFITS.map((b, idx) => (
              <View key={b.title} style={{ flexDirection: 'row' }}>
                <Text
                  variant="mono"
                  weight="medium"
                  style={{
                    fontSize: 11,
                    letterSpacing: 1.6,
                    color: COLORS.gold,
                    width: 36,
                    marginTop: 4,
                  }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="serifKr"
                    weight="bold"
                    style={{ fontSize: 17, color: COLORS.cream }}
                  >
                    {b.title}
                  </Text>
                  <Text
                    variant="sans"
                    style={{
                      marginTop: 4,
                      fontSize: 13,
                      color: '#B6BCC4',
                      lineHeight: 19,
                    }}
                  >
                    {b.sub}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Divider style={{ marginTop: 36, backgroundColor: COLORS.gold }} />

          <View style={{ marginTop: 22, gap: 12 }}>
            <PriceRow
              tier="LIFETIME · 평생"
              price={PRICE_LIFETIME}
              recommended
              note="한 번만 결제하고 끝"
              onPress={() => handlePurchase('Lifetime')}
            />
            <PriceRow
              tier="YEARLY · 연간"
              price={`${PRICE_YEARLY}/년`}
              note="월 환산 ₩1,583 · 약 45% 절약"
              onPress={() => handlePurchase('Yearly')}
            />
            <PriceRow
              tier="MONTHLY · 월간"
              price={`${PRICE_MONTHLY}/월`}
              note="가볍게 시작"
              onPress={() => handlePurchase('Monthly')}
            />
          </View>

          <Text
            variant="sans"
            style={{
              marginTop: 24,
              textAlign: 'center',
              fontSize: 11,
              lineHeight: 17,
              color: '#9DA4AC',
            }}
          >
            결제는 App Store/Play Store 정책에 따라 처리됩니다.{`\n`}
            언제든 해지할 수 있으며, 도감 자체는 영구히 남습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PriceRow({
  tier,
  price,
  note,
  recommended,
  onPress,
}: {
  tier: string;
  price: string;
  note: string;
  recommended?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: recommended ? COLORS.gold : '#3A4B62',
        padding: 18,
        backgroundColor: pressed ? '#1A3656' : 'transparent',
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text
          variant="mono"
          weight="medium"
          style={{
            fontSize: 10,
            letterSpacing: 1.6,
            color: recommended ? COLORS.gold : '#9DA4AC',
          }}
        >
          {tier}
        </Text>
        {recommended ? (
          <Text
            variant="mono"
            weight="medium"
            style={{
              fontSize: 9,
              letterSpacing: 1.4,
              color: COLORS.gold,
            }}
          >
            추천
          </Text>
        ) : null}
      </View>
      <Text
        variant="serifKr"
        weight="bold"
        style={{
          fontSize: 22,
          color: COLORS.cream,
          marginTop: 6,
        }}
      >
        {price}
      </Text>
      <Text
        variant="sans"
        style={{
          marginTop: 4,
          fontSize: 12,
          color: '#9DA4AC',
        }}
      >
        {note}
      </Text>
    </Pressable>
  );
}
