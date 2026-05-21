import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { PeakPicker } from '@/components/PeakPicker';

import { useAuthStore } from '@/stores/auth';
import { useCreateAscent } from '@/lib/queries/createAscent';
import { useIdentifyPeak } from '@/lib/queries/identifyPeak';
import { useEntitlements } from '@/lib/queries/useProfiles';
import { findNearestPeak } from '@/lib/queries/findNearestPeak';
import { pickFromCamera, pickFromGallery, type PickedPhoto } from '@/lib/imagePicker';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePeaks } from '@/lib/queries/usePeaks';
import { getCurrentCoords } from '@/lib/location';
import { COLORS } from '@/constants/theme';
import type { Peak } from '@/lib/types';

export default function AddScreen() {
  const session = useAuthStore((s) => s.session);
  const params = useLocalSearchParams<{ peakSlug?: string }>();
  const peaksQuery = usePeaks();
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [peak, setPeak] = useState<Peak | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const createAscent = useCreateAscent();
  const identifyPeak = useIdentifyPeak(peaksQuery.data);
  const { isPro } = useEntitlements();
  const [recordedAt] = useState(new Date());

  useEffect(() => {
    if (!params.peakSlug || peak) return;
    const match = peaksQuery.data?.find((p) => p.slug === params.peakSlug);
    if (match) setPeak(match);
  }, [params.peakSlug, peaksQuery.data, peak]);

  // EXIF GPS가 있으면 자동으로 인근 봉우리 추천(자동 선택은 하지 않음).
  useEffect(() => {
    if (!photo || peak) {
      setSuggestion(null);
      return;
    }
    if (photo.exifLat == null || photo.exifLng == null || !peaksQuery.data) return;
    const nearest = findNearestPeak(
      { latitude: photo.exifLat, longitude: photo.exifLng },
      peaksQuery.data,
      { maxMeters: 5_000 }
    );
    if (nearest) {
      setSuggestion(
        `EXIF GPS 기준 가장 가까운 봉우리는 ${nearest.peak.name_ko} (${formatDistance(nearest.distanceMeters)})`
      );
    } else {
      setSuggestion(null);
    }
  }, [photo, peak, peaksQuery.data]);

  const handleSuggestFromExif = () => {
    if (!photo || !peaksQuery.data) return;
    if (photo.exifLat == null || photo.exifLng == null) return;
    const nearest = findNearestPeak(
      { latitude: photo.exifLat, longitude: photo.exifLng },
      peaksQuery.data,
      { maxMeters: 5_000 }
    );
    if (nearest) setPeak(nearest.peak);
  };

  const handleSuggestFromCurrentLocation = async () => {
    try {
      const coords = await getCurrentCoords();
      if (!peaksQuery.data) return;
      const nearest = findNearestPeak(coords, peaksQuery.data, { maxMeters: 5_000 });
      if (nearest) {
        setPeak(nearest.peak);
      } else {
        Alert.alert(
          '근처 봉우리를 찾지 못했습니다',
          '현재 위치 반경 5km 안에 100대 명산이 없습니다. 직접 선택해 주세요.'
        );
      }
    } catch (err) {
      Alert.alert(
        '위치 추천 실패',
        err instanceof Error ? err.message : '다시 시도해 주세요.'
      );
    }
  };

  const handleIdentifyWithAI = () => {
    if (!photo) return;
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    const candidates = (() => {
      if (!peaksQuery.data) return [];
      const lat = photo.exifLat;
      const lng = photo.exifLng;
      if (lat == null || lng == null) return [];
      const ranked = peaksQuery.data
        .map((p) => ({
          peak: p,
          distance: Math.hypot(p.latitude - lat, p.longitude - lng) * 111_000,
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
        .filter((c) => c.distance < 10_000);
      return ranked.map((r) => ({
        slug: r.peak.slug,
        name_ko: r.peak.name_ko,
        name_en: r.peak.name_en,
        distance_m: r.distance,
      }));
    })();

    identifyPeak.mutate(
      {
        photoUri: photo.uri,
        photoMimeType: photo.mimeType,
        gpsLat: photo.exifLat,
        gpsLng: photo.exifLng,
        candidates,
      },
      {
        onSuccess: ({ match, matchedPeak }) => {
          if (matchedPeak) {
            setPeak(matchedPeak);
            Alert.alert(
              'AI 식별 완료',
              `${match.name_ko} · 신뢰도 ${(match.confidence * 100).toFixed(0)}%\n\n${match.reason}`
            );
          } else {
            Alert.alert(
              'AI가 정확히 식별하지 못했습니다',
              `추정: ${match.name_ko} (신뢰도 ${(match.confidence * 100).toFixed(0)}%)\n\n${match.reason}\n\n수동으로 선택해 주세요.`
            );
          }
        },
        onError: (err) =>
          Alert.alert(
            'AI 식별 실패',
            err instanceof Error ? err.message : '다시 시도해 주세요.'
          ),
      }
    );
  };

  const handlePickFromCamera = async () => {
    try {
      const next = await pickFromCamera();
      if (next) setPhoto(next);
    } catch (err) {
      Alert.alert('카메라 접근 불가', err instanceof Error ? err.message : '다시 시도해 주세요.');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const next = await pickFromGallery();
      if (next) setPhoto(next);
    } catch (err) {
      Alert.alert('갤러리 접근 불가', err instanceof Error ? err.message : '다시 시도해 주세요.');
    }
  };

  const handleSubmit = () => {
    if (!isSupabaseConfigured) {
      Alert.alert(
        '설정이 필요합니다',
        '도감 기록은 Supabase 설정 이후에 활성화됩니다. .env.local에 키를 추가해 주세요.'
      );
      return;
    }
    if (!session?.user.id) {
      Alert.alert('로그인이 필요합니다', '도감에 기록하려면 먼저 로그인해 주세요.');
      return;
    }
    if (!photo) {
      Alert.alert('사진을 선택해 주세요', '정상에서의 사진 한 장이 필요합니다.');
      return;
    }
    if (!peak) {
      Alert.alert('봉우리를 선택해 주세요', '어느 봉우리에서의 기록인지 선택해 주세요.');
      return;
    }

    createAscent.mutate(
      {
        userId: session.user.id,
        peak,
        photoUri: photo.uri,
        photoMimeType: photo.mimeType,
        ascendedAt: photo.exifTakenAt ? new Date(photo.exifTakenAt) : recordedAt,
        gpsLat: photo.exifLat,
        gpsLng: photo.exifLng,
        notes: notes.trim() ? notes.trim() : null,
        isPublic,
      },
      {
        onSuccess: () => {
          Alert.alert(
            '도감에 추가되었습니다',
            `${peak.name_ko}이(가) 당신의 도감에 추가되었습니다.`,
            [
              {
                text: '확인',
                onPress: () => {
                  setPhoto(null);
                  setPeak(null);
                  setNotes('');
                  setIsPublic(true);
                },
              },
            ]
          );
        },
        onError: (err) => {
          Alert.alert(
            '기록을 저장하지 못했습니다',
            err instanceof Error ? err.message : '다시 시도해 주세요.'
          );
        },
      }
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 64,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <MonoLabel tone="gold">NEW ENTRY · 정복 등록</MonoLabel>
          <Text
            variant="serifKr"
            weight="bold"
            style={{
              fontSize: 26,
              color: COLORS.navy,
              marginTop: 12,
              lineHeight: 36,
            }}
          >
            한 장의 사진을{`\n`}도감의 페이지로.
          </Text>

          <Divider style={{ marginVertical: 28 }} />

          <SectionLabel index="01" label="PHOTO · 정상의 사진" />
          <PhotoSlot
            photo={photo}
            onCamera={handlePickFromCamera}
            onGallery={handlePickFromGallery}
            onClear={() => setPhoto(null)}
          />

          <SectionLabel index="02" label="PEAK · 봉우리" style={{ marginTop: 32 }} />
          {photo && !peak ? (
            <View style={{ marginBottom: 12 }}>
              {suggestion ? (
                <Pressable
                  onPress={handleSuggestFromExif}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: COLORS.gold,
                    backgroundColor: pressed ? COLORS.creamDark : COLORS.cream,
                    marginBottom: 10,
                  })}
                >
                  <Text
                    variant="mono"
                    weight="medium"
                    style={{ fontSize: 10, letterSpacing: 1.4, color: COLORS.gold }}
                  >
                    SUGGESTED · 사진 EXIF
                  </Text>
                  <Text
                    variant="serifKr"
                    weight="medium"
                    style={{ fontSize: 14, color: COLORS.navy, marginTop: 4 }}
                  >
                    {suggestion}
                  </Text>
                  <Text
                    variant="sans"
                    style={{ fontSize: 11, color: COLORS.stone, marginTop: 2 }}
                  >
                    탭하여 선택
                  </Text>
                </Pressable>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button
                    label="내 위치로 추천"
                    variant="outline"
                    size="sm"
                    onPress={handleSuggestFromCurrentLocation}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    label={
                      identifyPeak.isPending
                        ? 'AI 식별 중…'
                        : isPro
                          ? 'AI로 식별'
                          : 'AI로 식별 · PLUS'
                    }
                    variant="outline"
                    size="sm"
                    disabled={identifyPeak.isPending}
                    onPress={handleIdentifyWithAI}
                  />
                </View>
              </View>
            </View>
          ) : null}
          <Pressable
            onPress={() => setPickerVisible(true)}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: peak ? COLORS.navy : COLORS.line,
              borderStyle: peak ? 'solid' : 'dashed',
              backgroundColor: pressed ? COLORS.creamDark : COLORS.cream,
              padding: 16,
            })}
          >
            {peak ? (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <View>
                  <Text
                    variant="serifKr"
                    weight="bold"
                    style={{ fontSize: 20, color: COLORS.navy }}
                  >
                    {peak.name_ko}
                  </Text>
                  <Text
                    variant="serifEn"
                    weight="italic"
                    style={{
                      fontSize: 12,
                      color: COLORS.stone,
                      fontStyle: 'italic',
                      marginTop: 2,
                    }}
                  >
                    {peak.name_en ?? ''} · {peak.region_short ?? peak.region}
                  </Text>
                </View>
                <Text
                  variant="mono"
                  weight="medium"
                  style={{ fontSize: 14, color: COLORS.navy }}
                >
                  {peak.elevation_m.toLocaleString()}m
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  variant="sans"
                  style={{ color: COLORS.stone, fontSize: 14 }}
                >
                  봉우리를 선택하세요
                </Text>
                <MonoLabel tone="gold">SELECT</MonoLabel>
              </View>
            )}
          </Pressable>

          <SectionLabel index="03" label="RECORDED · 기록 시각" style={{ marginTop: 32 }} />
          <View
            style={{
              borderWidth: 1,
              borderColor: COLORS.line,
              padding: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <Text
              variant="serifKr"
              weight="medium"
              style={{ fontSize: 16, color: COLORS.navy }}
            >
              {formatRecorded(photo?.exifTakenAt ? new Date(photo.exifTakenAt) : recordedAt)}
            </Text>
            <MonoLabel tone="stone">
              {photo?.exifTakenAt ? 'EXIF' : '오늘'}
            </MonoLabel>
          </View>
          {photo?.exifLat !== null && photo?.exifLat !== undefined && photo.exifLng !== null ? (
            <Text
              variant="mono"
              style={{
                fontSize: 11,
                color: COLORS.stone,
                marginTop: 8,
                letterSpacing: 0.4,
              }}
            >
              GPS · {photo.exifLat?.toFixed(4)}, {photo.exifLng?.toFixed(4)}
            </Text>
          ) : null}

          <SectionLabel index="04" label="NOTES · 메모" style={{ marginTop: 32 }} />
          <View
            style={{
              borderWidth: 1,
              borderColor: COLORS.line,
              padding: 14,
              minHeight: 96,
            }}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="이 봉우리에서의 한 줄 메모 (선택)"
              placeholderTextColor={COLORS.stoneLight}
              multiline
              textAlignVertical="top"
              style={{
                fontFamily: 'Pretendard-Regular',
                fontSize: 14,
                color: COLORS.ink,
                minHeight: 72,
              }}
            />
          </View>

          <SectionLabel index="05" label="PRIVACY · 공개 범위" style={{ marginTop: 32 }} />
          <Pressable
            onPress={() => setIsPublic((v) => !v)}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: isPublic ? COLORS.navy : COLORS.line,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: pressed ? COLORS.creamDark : 'transparent',
            })}
          >
            <View style={{ flex: 1, paddingRight: 14 }}>
              <Text
                variant="serifKr"
                weight="bold"
                style={{ fontSize: 15, color: COLORS.navy }}
              >
                {isPublic ? '다른 등산인이 볼 수 있음' : '나만 보는 비공개'}
              </Text>
              <Text
                variant="sans"
                style={{ fontSize: 11, color: COLORS.stone, marginTop: 4, lineHeight: 16 }}
              >
                {isPublic
                  ? '닉네임 비교에 봉우리 이름이 노출됩니다. 사진·메모는 비공개로 유지.'
                  : '도감 비교에서도 보이지 않습니다.'}
              </Text>
            </View>
            <View
              style={{
                width: 48,
                height: 28,
                borderRadius: 14,
                backgroundColor: isPublic ? COLORS.navy : COLORS.line,
                padding: 3,
                justifyContent: 'center',
                alignItems: isPublic ? 'flex-end' : 'flex-start',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: COLORS.cream,
                }}
              />
            </View>
          </Pressable>

          <View style={{ marginTop: 40 }}>
            <Button
              label={createAscent.isPending ? '기록하는 중…' : '도감에 기록'}
              size="lg"
              disabled={createAscent.isPending}
              onPress={handleSubmit}
            />
            <Text
              variant="sans"
              style={{
                textAlign: 'center',
                marginTop: 14,
                color: COLORS.stone,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              사진은 도감 보관함에 안전하게 저장됩니다. 공개 여부는 언제든 변경할 수 있습니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PeakPicker
        visible={pickerVisible}
        selectedId={peak?.id ?? null}
        onSelect={(next) => {
          setPeak(next);
          setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

function SectionLabel({
  index,
  label,
  style,
}: {
  index: string;
  label: string;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 12,
        },
        style,
      ]}
    >
      <Text
        variant="mono"
        weight="medium"
        style={{
          fontSize: 10,
          letterSpacing: 1.6,
          color: COLORS.gold,
          marginRight: 10,
        }}
      >
        {index}
      </Text>
      <View style={{ flex: 1 }}>
        <MonoLabel tone="stone">{label}</MonoLabel>
      </View>
    </View>
  );
}

function PhotoSlot({
  photo,
  onCamera,
  onGallery,
  onClear,
}: {
  photo: PickedPhoto | null;
  onCamera: () => void;
  onGallery: () => void;
  onClear: () => void;
}) {
  if (photo) {
    return (
      <View>
        <View
          style={{
            borderWidth: 1,
            borderColor: COLORS.navy,
            padding: 6,
            backgroundColor: COLORS.cream,
          }}
        >
          <Image
            source={{ uri: photo.uri }}
            style={{ width: '100%', aspectRatio: photo.width / photo.height }}
            resizeMode="cover"
          />
        </View>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button label="다시 촬영" variant="outline" onPress={onCamera} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="제거" variant="ghost" onPress={onClear} />
          </View>
        </View>
      </View>
    );
  }
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: COLORS.line,
        borderStyle: 'dashed',
        padding: 22,
        alignItems: 'center',
      }}
    >
      <Text
        variant="serifEn"
        weight="italic"
        style={{
          color: COLORS.stone,
          fontStyle: 'italic',
          fontSize: 14,
          marginBottom: 18,
        }}
      >
        A page for one summit.
      </Text>
      <View style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
        <View style={{ flex: 1 }}>
          <Button label="카메라" onPress={onCamera} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="갤러리" variant="outline" onPress={onGallery} />
        </View>
      </View>
    </View>
  );
}

function formatRecorded(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}년 ${m}월 ${day}일 · ${hh}:${mm}`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
