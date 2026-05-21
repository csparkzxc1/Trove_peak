import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { useAuthStore } from '@/stores/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useMyAscents } from '@/lib/queries/useAscents';
import { usePeaks } from '@/lib/queries/usePeaks';
import { useSearchProfiles, useMyProfile } from '@/lib/queries/useProfiles';
import { exportCollectionToPdf } from '@/lib/pdfExport';
import { PEAKS_SEED, TOTAL_TARGET } from '@/constants/peaks-seed';
import { COLORS } from '@/constants/theme';

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const ascents = useMyAscents();
  const peaksQuery = usePeaks();
  const myProfile = useMyProfile();
  const [exporting, setExporting] = useState(false);
  const [friendQuery, setFriendQuery] = useState('');
  const friendSearch = useSearchProfiles(friendQuery);
  // profiles 테이블이 진실의 원천. 트리거가 채운 'climber-xxxx'도 여기서 읽힘.
  const myNickname =
    myProfile.data?.nickname ??
    (session?.user.user_metadata?.nickname as string | undefined) ??
    null;

  const nickname = myNickname ?? '익명의 등산인';
  const email = session?.user.email ?? '미설정';
  const collected = ascents.data?.length ?? 0;
  const joinedAt = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString('ko-KR')
    : '—';

  const handleExportPdf = async () => {
    const peaks = peaksQuery.data ?? [];
    const rows = ascents.data ?? [];
    if (rows.length === 0) {
      Alert.alert(
        '도감이 비어 있습니다',
        '첫 봉우리를 먼저 기록해 주세요. 한 페이지에서 시작합니다.'
      );
      return;
    }
    try {
      setExporting(true);
      const entries = rows
        .map((a) => {
          const peak = peaks.find((p) => p.id === a.peak_id);
          if (!peak) return null;
          const seedIdx = PEAKS_SEED.findIndex((p) => p.slug === peak.slug);
          return {
            peak,
            ascent: a,
            serialNumber: seedIdx >= 0 ? String(seedIdx + 1).padStart(3, '0') : '—',
          };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);

      await exportCollectionToPdf({
        userLabel: nickname,
        totalTarget: TOTAL_TARGET,
        entries,
      });
    } catch (err) {
      Alert.alert('PDF 내보내기 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
    } finally {
      setExporting(false);
    }
  };

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        '안내',
        'Supabase가 설정되지 않은 상태에서는 세션이 없습니다.'
      );
      return;
    }
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 28,
          paddingTop: 32,
          paddingBottom: 48,
        }}
      >
        <MonoLabel tone="gold">CURATOR · 도감의 주인</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ fontSize: 28, color: COLORS.navy, marginTop: 14 }}
        >
          {nickname}
        </Text>

        <Divider style={{ marginVertical: 28 }} />

        <View style={{ gap: 22 }}>
          <Row label="EMAIL" value={email} />
          <Row label="JOINED" value={joinedAt} />
          <Row label="COLLECTED" value={`${collected} · ${TOTAL_TARGET}`} mono />
        </View>

        <Divider style={{ marginVertical: 32 }} />

        <MonoLabel tone="gold">FRIENDS · 다른 등산인의 도감</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ fontSize: 18, color: COLORS.navy, marginTop: 10 }}
        >
          닉네임으로 친구 찾기
        </Text>
        <View
          style={{
            marginTop: 14,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.line,
          }}
        >
          <TextInput
            value={friendQuery}
            onChangeText={setFriendQuery}
            placeholder="친구의 닉네임"
            placeholderTextColor={COLORS.stoneLight}
            autoCapitalize="none"
            autoCorrect={false}
            style={{
              fontFamily: 'Pretendard-Regular',
              fontSize: 16,
              color: COLORS.ink,
              paddingVertical: 10,
            }}
          />
        </View>
        {friendQuery.trim().length >= 1 ? (
          <View style={{ marginTop: 6 }}>
            {friendSearch.isLoading ? (
              <View style={{ paddingVertical: 14 }}>
                <Text variant="sans" style={{ fontSize: 12, color: COLORS.stone }}>
                  찾는 중…
                </Text>
              </View>
            ) : (friendSearch.data?.length ?? 0) === 0 ? (
              <View style={{ paddingVertical: 14 }}>
                <Text variant="sans" style={{ fontSize: 12, color: COLORS.stoneLight }}>
                  일치하는 등산인이 없습니다.
                </Text>
              </View>
            ) : (
              friendSearch.data?.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push({
                      pathname: '/friend/[nickname]',
                      params: { nickname: encodeURIComponent(p.nickname) },
                    })
                  }
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: COLORS.line,
                    backgroundColor: pressed ? COLORS.creamDark : 'transparent',
                  })}
                >
                  <Text
                    variant="serifKr"
                    weight="medium"
                    style={{
                      fontSize: 16,
                      color:
                        p.nickname === myNickname ? COLORS.stoneLight : COLORS.navy,
                    }}
                  >
                    {p.nickname}
                    {p.nickname === myNickname ? ' · 나' : ''}
                  </Text>
                  <Text
                    variant="mono"
                    weight="medium"
                    style={{
                      fontSize: 11,
                      letterSpacing: 1.4,
                      color: COLORS.gold,
                    }}
                  >
                    보기 →
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        <Divider style={{ marginVertical: 32 }} />

        <View style={{ gap: 12 }}>
          <Button
            label={exporting ? 'PDF 만드는 중…' : '내 도감 PDF로 내보내기'}
            size="lg"
            disabled={exporting || collected === 0}
            onPress={handleExportPdf}
          />
          <Text
            variant="sans"
            style={{
              fontSize: 11,
              color: COLORS.stone,
              lineHeight: 16,
              textAlign: 'center',
            }}
          >
            정복한 봉우리만으로 표지·목차·페이지를 만든 A4 PDF가 생성됩니다.
          </Text>
          <Button label="로그아웃" variant="outline" onPress={handleSignOut} />
        </View>

        <Text
          variant="serifEn"
          weight="italic"
          style={{
            marginTop: 48,
            color: COLORS.stone,
            fontSize: 12,
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Your summits, beautifully archived.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
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
        variant={mono ? 'mono' : 'sans'}
        weight="medium"
        style={{ color: COLORS.navy, fontSize: 14, maxWidth: '60%', textAlign: 'right' }}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}
