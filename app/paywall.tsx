import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { Text } from '@/components/ui/Text';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { BrandWordmark } from '@/components/BrandWordmark';
import {
  isIapAvailable,
  getOfferings,
  purchasePackage,
  type IapOfferings,
  type IapPackage,
} from '@/lib/iap';
import { COLORS } from '@/constants/theme';

// IAP가 준비되지 않은 빌드(Expo Go·키 미설정)에서 보이는 placeholder.
const FALLBACK = {
  monthly: '₩2,900/월',
  yearly: '₩19,000/년',
  lifetime: '₩39,000',
};

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
  const queryClient = useQueryClient();
  const [offerings, setOfferings] = useState<IapOfferings | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(isIapAvailable);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (!isIapAvailable) return;
    let active = true;
    getOfferings().then((data) => {
      if (!active) return;
      setOfferings(data);
      setLoadingOfferings(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handlePurchase = async (key: 'monthly' | 'yearly' | 'lifetime') => {
    if (!isIapAvailable) {
      Alert.alert(
        '결제 통합 준비 중',
        'react-native-purchases SDK는 Expo Dev Build/EAS Build에서만 동작합니다.\n\n출시 전엔 Supabase 콘솔에서 profiles.is_pro=true로 직접 토글해 테스트할 수 있습니다.'
      );
      return;
    }
    const pkg = offerings?.[key] ?? null;
    if (!pkg) {
      Alert.alert(
        '상품을 찾지 못했습니다',
        'RevenueCat에 해당 IAP 상품이 등록되지 않았거나 Offering에 추가되지 않았습니다. README §2-9 참조.'
      );
      return;
    }
    try {
      setPurchasing(key);
      await purchasePackage(pkg);
      // 결제 성공 → RevenueCat 웹훅이 profiles.is_pro를 갱신. 잠시 후 invalidate.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['my-profile'] });
      }, 1500);
      Alert.alert(
        'TROVE PLUS 가입 완료',
        '도감의 모든 기능이 열렸습니다. 잠시 후 자동으로 반영됩니다.'
      );
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : '다시 시도해 주세요.';
      if (!/cancel/i.test(message)) {
        Alert.alert('결제를 완료하지 못했습니다', message);
      }
    } finally {
      setPurchasing(null);
    }
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

          {loadingOfferings ? (
            <View style={{ marginTop: 28, alignItems: 'center' }}>
              <ActivityIndicator color={COLORS.gold} />
            </View>
          ) : (
            <View style={{ marginTop: 22, gap: 12 }}>
              <PriceRow
                tier="LIFETIME · 평생"
                price={offerings?.lifetime?.product.priceString ?? FALLBACK.lifetime}
                note="한 번만 결제하고 끝"
                recommended
                busy={purchasing === 'lifetime'}
                disabled={purchasing !== null}
                onPress={() => handlePurchase('lifetime')}
              />
              <PriceRow
                tier="YEARLY · 연간"
                price={
                  offerings?.yearly?.product.priceString ?? FALLBACK.yearly
                }
                note="월 환산 ₩1,583 · 약 45% 절약"
                busy={purchasing === 'yearly'}
                disabled={purchasing !== null}
                onPress={() => handlePurchase('yearly')}
              />
              <PriceRow
                tier="MONTHLY · 월간"
                price={
                  offerings?.monthly?.product.priceString ?? FALLBACK.monthly
                }
                note="가볍게 시작"
                busy={purchasing === 'monthly'}
                disabled={purchasing !== null}
                onPress={() => handlePurchase('monthly')}
              />
            </View>
          )}

          {!isIapAvailable ? (
            <View
              style={{
                marginTop: 22,
                padding: 14,
                borderWidth: 1,
                borderColor: '#3A4B62',
              }}
            >
              <MonoLabel tone="gold">DEV NOTE</MonoLabel>
              <Text
                variant="sans"
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: '#9DA4AC',
                  lineHeight: 16,
                }}
              >
                이 빌드는 결제 SDK가 활성화되지 않았습니다. Dev Build / EAS Build에서 실제 IAP가 동작하며, 그 전까지는 Supabase 콘솔에서 profiles.is_pro를 토글해 테스트할 수 있습니다.
              </Text>
            </View>
          ) : null}

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
  busy,
  disabled,
  onPress,
}: {
  tier: string;
  price: string;
  note: string;
  recommended?: boolean;
  busy?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: recommended ? COLORS.gold : '#3A4B62',
        padding: 18,
        backgroundColor: pressed ? '#1A3656' : 'transparent',
        opacity: disabled && !busy ? 0.45 : 1,
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
        {busy ? '결제 진행 중…' : price}
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
