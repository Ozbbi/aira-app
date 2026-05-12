/**
 * IAP service — RevenueCat-shaped API with a mock backend.
 *
 * Flip USE_REAL_IAP to true once `react-native-purchases` is installed
 * and configured. Every consumer in the app talks to this module, so
 * swapping providers is a 1-flag change.
 *
 * The mock simulates a 1.5 s purchase round-trip, persists state through
 * AsyncStorage, and never charges anyone. Side-effects on userStore
 * (tier, lives, freezes, ownedSkins) are applied inside `purchase()`
 * via the consumer-supplied store ref.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const USE_REAL_IAP = false;

/* ───────────────────────────── product catalogue ───────────────────────────── */

export type ProductId =
  | 'aira_pro_monthly'
  | 'aira_pro_yearly'
  | 'certificate_completion'
  | 'streak_freeze_pack'
  | 'heart_refill'
  | 'cosmetic_skin_neon'
  | 'cosmetic_skin_golden'
  | 'cosmetic_skin_retro'
  | 'cosmetic_skin_cyberpunk';

export type ProductType = 'subscription' | 'consumable' | 'non_consumable';

export interface Product {
  identifier: ProductId;
  type: ProductType;
  price: number;
  currency: string;
  priceString: string;
  title: string;
  description: string;
  /** ISO 8601 period ("P1M", "P1Y") for subscriptions, undefined otherwise. */
  subscriptionPeriod?: string;
  introductoryPrice?: {
    price: number;
    priceString: string;
    period: string; // e.g. "P1W" — 1-week free trial
  };
}

const PRODUCTS: Product[] = [
  {
    identifier: 'aira_pro_monthly',
    type: 'subscription',
    price: 14.99,
    currency: 'USD',
    priceString: '$14.99',
    title: 'AIRA Pro — Monthly',
    description: 'Unlimited lessons, sandbox, decks, hearts. Cancel anytime.',
    subscriptionPeriod: 'P1M',
    introductoryPrice: { price: 0, priceString: 'Free', period: 'P1W' },
  },
  {
    identifier: 'aira_pro_yearly',
    type: 'subscription',
    price: 79.99,
    currency: 'USD',
    priceString: '$79.99',
    title: 'AIRA Pro — Yearly',
    description: 'Same as monthly. Save 55%.',
    subscriptionPeriod: 'P1Y',
    introductoryPrice: { price: 0, priceString: 'Free', period: 'P1W' },
  },
  {
    identifier: 'certificate_completion',
    type: 'non_consumable',
    price: 4.99,
    currency: 'USD',
    priceString: '$4.99',
    title: 'Track Certificate',
    description: 'PDF certificate when you finish a track.',
  },
  {
    identifier: 'streak_freeze_pack',
    type: 'consumable',
    price: 0.99,
    currency: 'USD',
    priceString: '$0.99',
    title: 'Streak Freeze Pack',
    description: '2 freezes. Protect your streak when life gets in the way.',
  },
  {
    identifier: 'heart_refill',
    type: 'consumable',
    price: 2.99,
    currency: 'USD',
    priceString: '$2.99',
    title: 'Full Heart Refill',
    description: 'Refill all 5 hearts instantly.',
  },
  {
    identifier: 'cosmetic_skin_neon',
    type: 'non_consumable',
    price: 1.99,
    currency: 'USD',
    priceString: '$1.99',
    title: 'Neon Skin',
    description: 'Glowing neon look for Ara.',
  },
  {
    identifier: 'cosmetic_skin_golden',
    type: 'non_consumable',
    price: 1.99,
    currency: 'USD',
    priceString: '$1.99',
    title: 'Golden Skin',
    description: 'Royal gold finish for Ara.',
  },
  {
    identifier: 'cosmetic_skin_retro',
    type: 'non_consumable',
    price: 1.99,
    currency: 'USD',
    priceString: '$1.99',
    title: 'Retro Skin',
    description: 'CRT-tinted 80s vibe.',
  },
  {
    identifier: 'cosmetic_skin_cyberpunk',
    type: 'non_consumable',
    price: 1.99,
    currency: 'USD',
    priceString: '$1.99',
    title: 'Cyberpunk Skin',
    description: 'Neon teal + magenta.',
  },
];

/* ───────────────────────────── customer info ───────────────────────────── */

export interface CustomerInfo {
  tier: 'free' | 'pro';
  /** ISO string for sub renewal; null for free users. */
  expiresAt: string | null;
  /** Set of product ids the user owns (one-time purchases + active subs). */
  entitlements: Set<ProductId>;
  introductoryPeriodActive: boolean;
}

export interface PurchaseReceipt {
  productId: ProductId;
  transactionId: string;
  purchasedAt: string;
  introductoryPeriod: boolean;
}

const STORAGE_KEY = 'aira_iap_state_v1';

interface PersistedIapState {
  entitlements: ProductId[];
  expiresAt: string | null;
  introductoryPeriodActive: boolean;
}

async function loadState(): Promise<PersistedIapState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { entitlements: [], expiresAt: null, introductoryPeriodActive: false };
    return JSON.parse(raw);
  } catch {
    return { entitlements: [], expiresAt: null, introductoryPeriodActive: false };
  }
}

async function saveState(s: PersistedIapState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/* ───────────────────────────── reward hooks ───────────────────────────── */

/**
 * Consumers register a single reward handler so we don't import the
 * userStore here (avoids circular dep + lets tests stub it cleanly).
 */
export interface IapRewardHandler {
  /** Pro entitlement granted/extended until expiresAt. */
  onProGranted: (expiresAt: string) => void;
  onProRevoked: () => void;
  /** Refills hearts to full. */
  onHeartRefill: () => void;
  /** Adds n streak-freeze items. */
  onStreakFreeze: (count: number) => void;
  /** Marks a cosmetic skin as owned. */
  onSkinOwned: (productId: ProductId) => void;
  /** Marks a certificate purchase. */
  onCertificateOwned: () => void;
}

let rewardHandler: IapRewardHandler | null = null;
export function setIapRewardHandler(handler: IapRewardHandler): void {
  rewardHandler = handler;
}

/* ───────────────────────────── API surface ───────────────────────────── */

export interface PurchaseResult {
  success: boolean;
  receipt?: PurchaseReceipt;
  error?: string;
  cancelled?: boolean;
}

export async function getProducts(): Promise<Product[]> {
  if (USE_REAL_IAP) {
    // TODO swap in: const offerings = await Purchases.getOfferings();
    throw new Error('Real IAP not configured');
  }
  // Mock returns the full list synchronously, wrapped in a promise.
  return PRODUCTS;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  if (USE_REAL_IAP) throw new Error('Real IAP not configured');
  const persisted = await loadState();
  const tier: 'free' | 'pro' =
    persisted.expiresAt && new Date(persisted.expiresAt).getTime() > Date.now()
      ? 'pro'
      : 'free';
  return {
    tier,
    expiresAt: persisted.expiresAt,
    entitlements: new Set(persisted.entitlements),
    introductoryPeriodActive: persisted.introductoryPeriodActive,
  };
}

/**
 * Mock purchase. Simulates a 1.5 s round-trip + applies reward via the
 * registered handler. Persists entitlements through AsyncStorage so
 * Pro tier survives cold starts.
 */
export async function purchase(productId: ProductId): Promise<PurchaseResult> {
  if (USE_REAL_IAP) throw new Error('Real IAP not configured');

  const product = PRODUCTS.find((p) => p.identifier === productId);
  if (!product) return { success: false, error: 'Unknown product' };

  // Simulate platform latency
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const persisted = await loadState();
  const now = new Date();
  const receipt: PurchaseReceipt = {
    productId,
    transactionId: `mock_tx_${Date.now()}`,
    purchasedAt: now.toISOString(),
    introductoryPeriod: !!product.introductoryPrice,
  };

  // Apply effects + persist
  switch (productId) {
    case 'aira_pro_monthly':
    case 'aira_pro_yearly': {
      const days = productId === 'aira_pro_yearly' ? 365 : 30;
      // Free trial extends the date by 7 days regardless of cadence.
      const trialDays = product.introductoryPrice ? 7 : 0;
      const expiresAt = new Date(now.getTime() + (days + trialDays) * 86400_000).toISOString();
      persisted.expiresAt = expiresAt;
      persisted.introductoryPeriodActive = trialDays > 0;
      if (!persisted.entitlements.includes(productId)) {
        persisted.entitlements = [...persisted.entitlements, productId];
      }
      rewardHandler?.onProGranted(expiresAt);
      break;
    }
    case 'heart_refill':
      rewardHandler?.onHeartRefill();
      break;
    case 'streak_freeze_pack':
      rewardHandler?.onStreakFreeze(2);
      break;
    case 'certificate_completion':
      persisted.entitlements = [...persisted.entitlements, productId];
      rewardHandler?.onCertificateOwned();
      break;
    case 'cosmetic_skin_neon':
    case 'cosmetic_skin_golden':
    case 'cosmetic_skin_retro':
    case 'cosmetic_skin_cyberpunk':
      if (!persisted.entitlements.includes(productId)) {
        persisted.entitlements = [...persisted.entitlements, productId];
      }
      rewardHandler?.onSkinOwned(productId);
      break;
  }

  await saveState(persisted);
  return { success: true, receipt };
}

export async function restorePurchases(): Promise<PurchaseReceipt[]> {
  if (USE_REAL_IAP) throw new Error('Real IAP not configured');
  const persisted = await loadState();
  const now = new Date().toISOString();
  // Re-fire reward handlers so the userStore stays in sync after a wipe.
  const info = await getCustomerInfo();
  if (info.tier === 'pro' && persisted.expiresAt) {
    rewardHandler?.onProGranted(persisted.expiresAt);
  }
  return persisted.entitlements.map((productId) => ({
    productId,
    transactionId: `mock_restore_${productId}`,
    purchasedAt: now,
    introductoryPeriod: false,
  }));
}

/** Clear all persisted entitlements. Useful for "Reset Progress". */
export async function clearIapState(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  rewardHandler?.onProRevoked();
}

export const _internalForTests = { PRODUCTS, STORAGE_KEY };
