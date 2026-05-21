import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { MonoLabel } from '@/components/ui/MonoLabel';
import { Divider } from '@/components/ui/Divider';
import { MountainSvg } from '@/components/MountainSvg';
import { AscentCard } from '@/components/AscentCard';
import { usePeakById } from '@/lib/queries/usePeaks';
import { useMyAscentForPeak } from '@/lib/queries/useAscents';
import { useRemoveBackground } from '@/lib/queries/removeBg';
import { useEntitlements } from '@/lib/queries/useProfiles';
import { useUpdateAscent, useDeleteAscent } from '@/lib/queries/updateAscent';
import { captureAndShareCard } from '@/lib/share';
import { PEAKS_SEED } from '@/constants/peaks-seed';
import { COLORS } from '@/constants/theme';

export default function PeakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const peakQuery = usePeakById(id);
  const peak = peakQuery.data;
  const ascentQuery = useMyAscentForPeak(peak?.id);
  const ascent = ascentQuery.data;
  const seedIndex = PEAKS_SEED.findIndex((p) => `seed-${p.slug}` === id || p.slug === id);
  const number = seedIndex >= 0 ? String(seedIndex + 1).padStart(3, '0') : '—';
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const [useStudio, setUseStudio] = useState(false);
  const [aspect, setAspect] = useState<'1:1' | '9:16'>('1:1');
  const removeBg = useRemoveBackground();
  const { isPro } = useEntitlements();
  const updateAscent = useUpdateAscent();
  const deleteAscent = useDeleteAscent();
  const [editOpen, setEditOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editPublic, setEditPublic] = useState(true);

  useEffect(() => {
    if (ascent) {
      setEditNotes(ascent.notes ?? '');
      setEditPublic(ascent.is_public);
    }
  }, [ascent]);

  const { width: winWidth } = useWindowDimensions();
  // 스토리(9:16)는 세로가 훨씬 기니 미리보기 폭을 더 줄여 줘야 화면 안에 들어온다.
  const cardWidth = Math.min(winWidth - 48, aspect === '9:16' ? 360 : 520);

  const handleShare = async () => {
    if (!peak || !ascent) return;
    try {
      setSharing(true);
      await captureAndShareCard({ ref: cardRef, peakName: peak.name_ko });
    } catch (err) {
      Alert.alert('공유 실패', err instanceof Error ? err.message : '다시 시도해 주세요.');
    } finally {
      setSharing(false);
    }
  };

  const handleSaveEdit = () => {
    if (!ascent) return;
    updateAscent.mutate(
      {
        ascentId: ascent.id,
        notes: editNotes.trim() ? editNotes.trim() : null,
        isPublic: editPublic,
        ascendedAt: new Date(ascent.ascended_at),
      },
      {
        onSuccess: () => {
          setEditOpen(false);
          Alert.alert('저장되었습니다');
        },
        onError: (e) =>
          Alert.alert('저장 실패', e instanceof Error ? e.message : '다시 시도해 주세요.'),
      }
    );
  };

  const handleDelete = () => {
    if (!ascent || !peak) return;
    Alert.alert(
      '기록을 삭제하시겠습니까?',
      `${peak.name_ko}의 기록이 도감에서 영구 삭제됩니다. 사진 원본은 Storage에 남아 있을 수 있습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            deleteAscent.mutate(ascent.id, {
              onSuccess: () => {
                router.back();
              },
              onError: (e) =>
                Alert.alert(
                  '삭제 실패',
                  e instanceof Error ? e.message : '다시 시도해 주세요.'
                ),
            });
          },
        },
      ]
    );
  };

  const handleRemoveBg = () => {
    if (!ascent?.id || !ascent.photo_url) {
      Alert.alert('처리할 사진이 없습니다');
      return;
    }
    if (!isPro) {
      router.push('/paywall');
      return;
    }
    removeBg.mutate(
      { ascentId: ascent.id, photoUrl: ascent.photo_url },
      {
        onSuccess: () => {
          setUseStudio(true);
          Alert.alert(
            '스튜디오 처리 완료',
            '봉우리만 도려낸 PNG가 카드에 적용되었습니다.'
          );
        },
        onError: (err) =>
          Alert.alert(
            '스튜디오 처리 실패',
            err instanceof Error
              ? err.message
              : 'remove.bg 키와 Edge Function 배포 상태를 확인해 주세요.'
          ),
      }
    );
  };

  if (peakQuery.isLoading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.cream,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.navy} />
      </SafeAreaView>
    );
  }

  if (!peak) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: COLORS.cream,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 28,
        }}
      >
        <MonoLabel tone="stone">NOT FOUND</MonoLabel>
        <Text
          variant="serifKr"
          weight="bold"
          style={{ marginTop: 12, fontSize: 22, color: COLORS.navy, textAlign: 'center' }}
        >
          이 봉우리를 찾지 못했습니다.
        </Text>
        <View style={{ marginTop: 28 }}>
          <Button label="도감으로 돌아가기" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text
              variant="mono"
              weight="medium"
              style={{ fontSize: 11, letterSpacing: 2, color: COLORS.navy }}
            >
              ← 도감
            </Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 28, paddingTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <MonoLabel tone="gold">{`№ ${number} · ${peak.region_short ?? peak.region}`}</MonoLabel>
            <MonoLabel tone="stone">
              {peak.list_korea_100 ? '100대 명산' : '추가 봉우리'}
            </MonoLabel>
          </View>

          <Text
            variant="serifKr"
            weight="bold"
            style={{ fontSize: 36, color: COLORS.navy, marginTop: 18 }}
          >
            {peak.name_ko}
          </Text>
          <Text
            variant="serifEn"
            weight="italic"
            style={{
              fontSize: 16,
              color: COLORS.stone,
              marginTop: 4,
              fontStyle: 'italic',
            }}
          >
            {peak.name_en ?? ''}
          </Text>

          <View style={{ alignItems: 'center', marginVertical: 32 }}>
            <MountainSvg size={220} stroke={COLORS.navy} variant="simple" />
            <Text
              variant="mono"
              weight="medium"
              style={{
                marginTop: 18,
                fontSize: 28,
                letterSpacing: -0.5,
                color: COLORS.navy,
              }}
            >
              {peak.elevation_m.toLocaleString()}m
            </Text>
            <MonoLabel tone="stone" style={{ marginTop: 6 }}>
              ELEVATION · 표고
            </MonoLabel>
          </View>

          <Divider />

          <View style={{ paddingVertical: 22, gap: 18 }}>
            <DataRow label="REGION · 지역" value={peak.region} />
            <DataRow
              label="DIFFICULTY · 난이도"
              value={peak.difficulty ? `${peak.difficulty}` : '미지정'}
            />
            <DataRow
              label="COORDINATES · 좌표"
              value={`${peak.latitude.toFixed(4)}, ${peak.longitude.toFixed(4)}`}
              mono
            />
            <DataRow
              label="LISTS · 등재"
              value={
                [
                  peak.list_korea_100 ? '100대 명산' : null,
                  peak.list_baekdudaegan ? '백두대간' : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || '—'
              }
            />
          </View>

          <Divider />

          {ascent ? (
            <View style={{ marginTop: 28 }}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <MonoLabel tone="gold">CARD · 인증 카드</MonoLabel>
                <Text
                  variant="serifEn"
                  weight="italic"
                  style={{
                    marginTop: 6,
                    color: COLORS.stone,
                    fontStyle: 'italic',
                    fontSize: 12,
                  }}
                >
                  A page from your trove.
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: COLORS.navy,
                  marginBottom: 14,
                }}
              >
                <ModeToggleButton
                  label="FEED · 1:1"
                  active={aspect === '1:1'}
                  onPress={() => setAspect('1:1')}
                />
                <ModeToggleButton
                  label="STORY · 9:16"
                  active={aspect === '9:16'}
                  onPress={() => setAspect('9:16')}
                />
              </View>

              <View style={{ alignSelf: 'center' }}>
                <AscentCard
                  ref={cardRef}
                  peak={peak}
                  photoUrl={
                    useStudio && ascent.cutout_url ? ascent.cutout_url : ascent.photo_url
                  }
                  ascendedAt={new Date(ascent.ascended_at)}
                  notes={ascent.notes}
                  serialNumber={number}
                  width={cardWidth}
                  variant={useStudio && ascent.cutout_url ? 'studio' : 'classic'}
                  aspect={aspect}
                />
              </View>

              {ascent.cutout_url ? (
                <View
                  style={{
                    flexDirection: 'row',
                    borderWidth: 1,
                    borderColor: COLORS.navy,
                    marginTop: 18,
                  }}
                >
                  <ModeToggleButton
                    label="CLASSIC · 원본"
                    active={!useStudio}
                    onPress={() => setUseStudio(false)}
                  />
                  <ModeToggleButton
                    label="STUDIO · 누끼"
                    active={useStudio}
                    onPress={() => setUseStudio(true)}
                  />
                </View>
              ) : (
                <View style={{ marginTop: 18 }}>
                  <Button
                    label={
                      removeBg.isPending
                        ? '봉우리 도려내는 중…'
                        : isPro
                          ? '스튜디오 모드 만들기'
                          : '스튜디오 모드 · PLUS'
                    }
                    variant="outline"
                    size="sm"
                    disabled={removeBg.isPending}
                    onPress={handleRemoveBg}
                  />
                  <Text
                    variant="sans"
                    style={{
                      textAlign: 'center',
                      marginTop: 6,
                      color: COLORS.stone,
                      fontSize: 10,
                      lineHeight: 14,
                    }}
                  >
                    배경을 분리해 어두운 박물관 카드로 변환합니다 (remove.bg).
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 18 }}>
                <Button
                  label={sharing ? '카드 생성 중…' : '인스타그램으로 공유'}
                  size="lg"
                  disabled={sharing}
                  onPress={handleShare}
                />
                <View style={{ marginTop: 10 }}>
                  <Button
                    label="기록 다시 만들기"
                    variant="ghost"
                    onPress={() =>
                      router.push({ pathname: '/(tabs)/add', params: { peakSlug: peak.slug } })
                    }
                  />
                </View>
              </View>
              <Text
                variant="sans"
                style={{
                  textAlign: 'center',
                  marginTop: 12,
                  color: COLORS.stone,
                  fontSize: 11,
                  lineHeight: 16,
                }}
              >
                카드는 인스타그램·메시지 어디에든 어울립니다.
              </Text>

              <Divider style={{ marginTop: 32 }} />

              <View style={{ marginTop: 24 }}>
                <Pressable
                  onPress={() => setEditOpen((v) => !v)}
                  hitSlop={8}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <MonoLabel tone="stone">EDIT · 기록 편집</MonoLabel>
                  <Text
                    variant="mono"
                    weight="medium"
                    style={{ fontSize: 11, letterSpacing: 1.4, color: COLORS.navy }}
                  >
                    {editOpen ? '닫기 −' : '펼치기 +'}
                  </Text>
                </Pressable>

                {editOpen ? (
                  <View style={{ marginTop: 16, gap: 14 }}>
                    <View>
                      <MonoLabel tone="stone">NOTES · 메모</MonoLabel>
                      <View
                        style={{
                          marginTop: 8,
                          borderWidth: 1,
                          borderColor: COLORS.line,
                          padding: 12,
                          minHeight: 96,
                        }}
                      >
                        <TextInput
                          value={editNotes}
                          onChangeText={setEditNotes}
                          placeholder="이 봉우리에서의 한 줄 메모"
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
                    </View>

                    <Pressable
                      onPress={() => setEditPublic((v) => !v)}
                      style={({ pressed }) => ({
                        borderWidth: 1,
                        borderColor: editPublic ? COLORS.navy : COLORS.line,
                        padding: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: pressed ? COLORS.creamDark : 'transparent',
                      })}
                    >
                      <Text
                        variant="serifKr"
                        weight="medium"
                        style={{ fontSize: 14, color: COLORS.navy }}
                      >
                        {editPublic ? '다른 등산인이 볼 수 있음' : '나만 보는 비공개'}
                      </Text>
                      <View
                        style={{
                          width: 44,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: editPublic ? COLORS.navy : COLORS.line,
                          padding: 3,
                          justifyContent: 'center',
                          alignItems: editPublic ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: COLORS.cream,
                          }}
                        />
                      </View>
                    </Pressable>

                    <Button
                      label={updateAscent.isPending ? '저장 중…' : '변경 사항 저장'}
                      disabled={updateAscent.isPending}
                      onPress={handleSaveEdit}
                    />
                  </View>
                ) : null}
              </View>

              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Pressable
                  onPress={handleDelete}
                  disabled={deleteAscent.isPending}
                  hitSlop={8}
                  style={({ pressed }) => ({
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text
                    variant="mono"
                    weight="medium"
                    style={{
                      fontSize: 11,
                      letterSpacing: 1.6,
                      color: COLORS.stoneLight,
                    }}
                  >
                    {deleteAscent.isPending ? '삭제 중…' : '이 기록 삭제'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 32 }}>
              <Button
                label="이 봉우리 정복하기"
                size="lg"
                onPress={() =>
                  router.push({ pathname: '/(tabs)/add', params: { peakSlug: peak.slug } })
                }
              />
              <Text
                variant="sans"
                style={{
                  textAlign: 'center',
                  marginTop: 14,
                  color: COLORS.stone,
                  fontSize: 12,
                }}
              >
                사진을 골라 한 페이지로 만들면 도감에 추가됩니다.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeToggleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        paddingVertical: 11,
        alignItems: 'center',
        backgroundColor: active ? COLORS.navy : pressed ? COLORS.creamDark : 'transparent',
      })}
    >
      <Text
        variant="mono"
        weight="medium"
        style={{
          fontSize: 10,
          letterSpacing: 1.6,
          color: active ? COLORS.cream : COLORS.navy,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function DataRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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
        variant={mono ? 'mono' : 'serifKr'}
        weight="medium"
        style={{ color: COLORS.navy, fontSize: 14, maxWidth: '60%', textAlign: 'right' }}
      >
        {value}
      </Text>
    </View>
  );
}
