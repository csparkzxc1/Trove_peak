import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { useAuthStore } from '@/stores/auth';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useMyAscents } from '@/lib/queries/useAscents';
import { COLORS } from '@/constants/theme';

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const ascents = useMyAscents();

  const nickname =
    (session?.user.user_metadata?.nickname as string | undefined) ?? '익명의 등산인';
  const email = session?.user.email ?? '미설정';
  const collected = ascents.data?.length ?? 0;
  const joinedAt = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString('ko-KR')
    : '—';

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
          <Row label="COLLECTED" value={`${collected} · ${100}`} mono />
        </View>

        <Divider style={{ marginVertical: 32 }} />

        <View>
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
