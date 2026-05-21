import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function Index() {
  const session = useAuthStore((s) => s.session);
  if (!isSupabaseConfigured) {
    return <Redirect href="/(tabs)" />;
  }
  if (!session) return <Redirect href="/(auth)/login" />;
  return <Redirect href="/(tabs)" />;
}
