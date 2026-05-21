import { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { COLORS } from '@/constants/theme';

export default function SignupScreen() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      Alert.alert(
        '설정이 필요합니다',
        'Supabase 환경변수가 설정되지 않았습니다. .env.local에 키를 추가해 주세요.'
      );
      return;
    }
    if (!nickname || !email || !password) {
      setError('닉네임, 이메일, 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname } },
      });
      if (authError) {
        setError('가입을 완료하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      Alert.alert(
        '도감을 발급했습니다',
        '이메일 인증이 필요한 경우, 받은 메일의 안내를 따라 주세요.',
        [{ text: '확인', onPress: () => router.replace('/(auth)/login') }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 28, paddingTop: 72, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <MonoLabel tone="gold">REGISTER · 도감 발급</MonoLabel>
          <Text
            variant="serifKr"
            weight="bold"
            style={{ fontSize: 28, color: COLORS.navy, marginTop: 14, lineHeight: 38 }}
          >
            첫 봉우리를 위한{`\n`}이름표를 만듭니다.
          </Text>

          <Divider style={{ marginVertical: 36 }} />

          <TextField
            label="닉네임"
            value={nickname}
            onChangeText={setNickname}
            autoCapitalize="none"
            placeholder="도감의 주인이 될 이름"
            maxLength={20}
          />
          <TextField
            label="이메일"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="climber@trove.kr"
          />
          <TextField
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="6자 이상"
            errorText={error ?? undefined}
          />

          <View style={{ marginTop: 12 }}>
            <Button
              label={loading ? '발급 중…' : '도감 받기'}
              onPress={handleSubmit}
              disabled={loading}
              size="lg"
            />
          </View>

          <View
            style={{
              marginTop: 32,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="sans" style={{ color: COLORS.stone, fontSize: 13 }}>
              이미 도감이 있으십니까?
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable hitSlop={8} style={{ marginLeft: 8 }}>
                <Text
                  variant="sans"
                  weight="medium"
                  style={{
                    color: COLORS.navy,
                    fontSize: 13,
                    textDecorationLine: 'underline',
                    textDecorationColor: COLORS.gold,
                  }}
                >
                  로그인
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
