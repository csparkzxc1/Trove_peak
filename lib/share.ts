import { Platform } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import type { View } from 'react-native';
import type { RefObject } from 'react';

export async function captureAndShareCard(args: {
  ref: RefObject<View | null>;
  peakName: string;
}): Promise<void> {
  if (!args.ref.current) {
    throw new Error('아직 카드가 준비되지 않았습니다.');
  }

  const uri = await captureRef(args.ref, {
    format: 'png',
    quality: 1,
    result: 'tmpfile',
  });

  if (Platform.OS === 'web') {
    // 웹: 다운로드 트리거.
    const a = document.createElement('a');
    a.href = uri;
    a.download = `trove-${args.peakName}.png`;
    a.click();
    return;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('이 기기에서는 공유를 사용할 수 없습니다.');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'image/png',
    dialogTitle: `${args.peakName} · Trove Peaks`,
    UTI: 'public.png',
  });
}
