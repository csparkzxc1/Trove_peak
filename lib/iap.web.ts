// Web 빌드용 stub. Metro가 platform extension을 자동 해상해 web에선 native
// 모듈을 가져오지 않는다.

export const isIapAvailable = false;

export async function configurePurchases(): Promise<void> {}
export async function loginPurchases(_supabaseUserId: string): Promise<void> {}
export async function logoutPurchases(): Promise<void> {}

export type IapPackage = {
  id: string;
  product: {
    identifier: string;
    title: string;
    priceString: string;
    period?: string | null;
  };
  raw: unknown;
};

export type IapOfferings = {
  monthly: IapPackage | null;
  yearly: IapPackage | null;
  lifetime: IapPackage | null;
};

export async function getOfferings(): Promise<IapOfferings | null> {
  return null;
}

export async function purchasePackage(_pkg: IapPackage): Promise<void> {
  throw new Error('웹에서는 결제를 사용할 수 없습니다.');
}
