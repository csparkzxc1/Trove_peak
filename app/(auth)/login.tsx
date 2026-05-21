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
import { BrandWordmark } from '@/components/BrandWordmark';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { COLORS } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      Alert.alert(
        '설정이 필요합니다',
        'Supabase 환경변수가 설정되지 않았습니다. .env.local 파일에 EXPO_PUBLIC_SUPABASE_URL과 EXPO_PUBLIC_SUPABASE_ANON_KEY를 추가해 주세요.'
      );
      return;
    }
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) {
        setError('로그인하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      router.replace('/(tabs)');
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
          <BrandWordmark size="lg" align="left" />

          <View style={{ marginTop: 56 }}>
            <MonoLabel tone="gold">A FIELD GUIDE TO YOUR SUMMITS</MonoLabel>
            <Text
              variant="serifKr"
              weight="bold"
              style={{ fontSize: 28, color: COLORS.navy, marginTop: 14, lineHeight: 38 }}
            >
              당신의 산은{`\n`}도감이 됩니다.
            </Text>
          </View>

          <Divider style={{ marginVertical: 36 }} />

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
            autoComplete="password"
            placeholder="••••••••"
            errorText={error ?? undefined}
          />

          <View style={{ marginTop: 12 }}>
            <Button
              label={loading ? '확인 중…' : '도감에 들어가기'}
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
              아직 회원이 아니십니까?
            </Text>
            <Link href="/(auth)/signup" asChild>
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
                  도감 만들기
                </Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
