// react-native-purchases는 네이티브 모듈이라 Expo Go에서 require가 실패한다.
// 빌드 시점에 모듈이 들어 있지 않으면 isIapAvailable=false로 두고 흐름을 비활성화.
//
// EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY가
// 비어 있어도 configure는 호출하지 않고 false로 둔다 → 결제 통합 미준비 상태로
// 안전하게 폴백.

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// deno-lint-ignore-file no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PurchasesModule: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  PurchasesModule = require('react-native-purchases').default;
} catch {
  PurchasesModule = null;
}

function readApiKey(): string | null {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
  const fromEnv =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  const fromExtra =
    Platform.OS === 'ios' ? extra.revenueCatIosKey : extra.revenueCatAndroidKey;
  return fromEnv ?? fromExtra ?? null;
}

export const isIapAvailable =
  PurchasesModule !== null && readApiKey() !== null && Platform.OS !== 'web';

let configured = false;

export async function configurePurchases(): Promise<void> {
  if (!isIapAvailable || configured) return;
  const apiKey = readApiKey();
  if (!apiKey) return;
  try {
    await PurchasesModule.configure({ apiKey });
    configured = true;
  } catch {
    // 무시: 다음 시도에서 다시 configure.
  }
}

export async function loginPurchases(supabaseUserId: string): Promise<void> {
  if (!isIapAvailable || !configured) return;
  try {
    await PurchasesModule.logIn(supabaseUserId);
  } catch {
    // 무시
  }
}

export async function logoutPurchases(): Promise<void> {
  if (!isIapAvailable || !configured) return;
  try {
    await PurchasesModule.logOut();
  } catch {
    // 무시
  }
}

export type IapPackage = {
  id: string;
  product: {
    identifier: string;
    title: string;
    priceString: string;
    period?: string | null;
  };
  // 내부적으로 purchasePackage(raw)에 다시 전달할 raw 객체.
  raw: unknown;
};

export type IapOfferings = {
  monthly: IapPackage | null;
  yearly: IapPackage | null;
  lifetime: IapPackage | null;
};

export async function getOfferings(): Promise<IapOfferings | null> {
  if (!isIapAvailable || !configured) return null;
  try {
    const data = await PurchasesModule.getOfferings();
    const current = data?.current;
    if (!current) return null;

    const toPackage = (pkg: any): IapPackage | null => {
      if (!pkg) return null;
      return {
        id: pkg.identifier,
        product: {
          identifier: pkg.product.identifier,
          title: pkg.product.title ?? '',
          priceString: pkg.product.priceString,
          period: pkg.product.subscriptionPeriod ?? null,
        },
        raw: pkg,
      };
    };

    return {
      monthly: toPackage(current.monthly),
      yearly: toPackage(current.annual),
      lifetime: toPackage(current.lifetime),
    };
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: IapPackage): Promise<void> {
  if (!isIapAvailable || !configured) {
    throw new Error('이 빌드에선 결제를 사용할 수 없습니다.');
  }
  await PurchasesModule.purchasePackage(pkg.raw);
}
