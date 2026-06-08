import { Redis } from '@upstash/redis';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * A customer's licensing subscription — the source of truth the activate/refresh endpoints turn
 * into a signed entitlement token. Keyed by a short, secret `accountKey` the customer enters in
 * the app. `graceDays` is baked into each issued token's ValidUntil so the app keeps working
 * offline between checks.
 */
export interface Subscription {
  accountKey: string;
  company: string;
  plan: 'monthly' | 'yearly';
  seats: number;
  modules: string[]; // wire codes: "inventory", "payroll"
  status: 'active' | 'past_due' | 'cancelled';
  graceDays: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Best-effort usage telemetry, recorded on each activate/refresh: which company uses a licence
 * and how many active users it has, so over-seat use is visible. Keyed by accountKey.
 */
export interface Usage {
  accountKey: string;
  company: string;
  registrationNumber: string | null;
  activeUsers: number | null;
  appVersion: string | null;
  firstSeen: string; // ISO-8601
  lastSeen: string; // ISO-8601
}

export interface SubscriptionStore {
  get(accountKey: string): Promise<Subscription | null>;
  upsert(sub: Subscription): Promise<void>;
  list(): Promise<Subscription[]>;
  remove(accountKey: string): Promise<boolean>;
  recordUsage(usage: Usage): Promise<void>;
  listUsage(): Promise<Usage[]>;
}

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

const subKey = (accountKey: string) => `license:sub:${accountKey}`;
const INDEX = 'license:subs';
const usageKey = (accountKey: string) => `license:usage:${accountKey}`;
const USAGE_INDEX = 'license:usages';

/** Build an Upstash Redis client from whichever env var pair is present, or null if none. */
function redisOrNull(): Redis | null {
  const url = env('UPSTASH_REDIS_REST_URL') ?? env('KV_REST_API_URL');
  const token = env('UPSTASH_REDIS_REST_TOKEN') ?? env('KV_REST_API_TOKEN');
  return url && token ? new Redis({ url, token }) : null;
}

class RedisStore implements SubscriptionStore {
  constructor(private readonly redis: Redis) {}

  async get(accountKey: string): Promise<Subscription | null> {
    return (await this.redis.get<Subscription>(subKey(accountKey))) ?? null;
  }

  async upsert(sub: Subscription): Promise<void> {
    await this.redis.set(subKey(sub.accountKey), sub);
    await this.redis.sadd(INDEX, sub.accountKey);
  }

  async list(): Promise<Subscription[]> {
    const keys = await this.redis.smembers(INDEX);
    if (keys.length === 0) return [];
    const values = await this.redis.mget<Subscription[]>(...keys.map(subKey));
    return values.filter((s): s is Subscription => s != null);
  }

  async remove(accountKey: string): Promise<boolean> {
    const deleted = await this.redis.del(subKey(accountKey));
    await this.redis.srem(INDEX, accountKey);
    return deleted > 0;
  }

  async recordUsage(usage: Usage): Promise<void> {
    const existing = await this.redis.get<Usage>(usageKey(usage.accountKey));
    const merged: Usage = { ...usage, firstSeen: existing?.firstSeen ?? usage.firstSeen };
    await this.redis.set(usageKey(usage.accountKey), merged);
    await this.redis.sadd(USAGE_INDEX, usage.accountKey);
  }

  async listUsage(): Promise<Usage[]> {
    const keys = await this.redis.smembers(USAGE_INDEX);
    if (keys.length === 0) return [];
    const values = await this.redis.mget<Usage[]>(...keys.map(usageKey));
    return values.filter((u): u is Usage => u != null);
  }
}

/**
 * Local development fallback when no KV is configured: a single JSON file in the repo root
 * (gitignored). NOT for production — serverless filesystems are ephemeral; production always has
 * the KV env vars set, so RedisStore is used there.
 */
class FileStore implements SubscriptionStore {
  private readonly path = '.license-subscriptions.json';

  private read(): Record<string, Subscription> {
    if (!existsSync(this.path)) return {};
    try {
      return JSON.parse(readFileSync(this.path, 'utf8')) as Record<string, Subscription>;
    } catch {
      return {};
    }
  }

  private write(all: Record<string, Subscription>): void {
    writeFileSync(this.path, JSON.stringify(all, null, 2));
  }

  async get(accountKey: string): Promise<Subscription | null> {
    return this.read()[accountKey] ?? null;
  }

  async upsert(sub: Subscription): Promise<void> {
    const all = this.read();
    all[sub.accountKey] = sub;
    this.write(all);
  }

  async list(): Promise<Subscription[]> {
    return Object.values(this.read());
  }

  async remove(accountKey: string): Promise<boolean> {
    const all = this.read();
    if (!(accountKey in all)) return false;
    delete all[accountKey];
    this.write(all);
    return true;
  }

  private readonly usagePath = '.license-usage.json';

  private readUsage(): Record<string, Usage> {
    if (!existsSync(this.usagePath)) return {};
    try {
      return JSON.parse(readFileSync(this.usagePath, 'utf8')) as Record<string, Usage>;
    } catch {
      return {};
    }
  }

  async recordUsage(usage: Usage): Promise<void> {
    const all = this.readUsage();
    const existing = all[usage.accountKey];
    all[usage.accountKey] = { ...usage, firstSeen: existing?.firstSeen ?? usage.firstSeen };
    writeFileSync(this.usagePath, JSON.stringify(all, null, 2));
  }

  async listUsage(): Promise<Usage[]> {
    return Object.values(this.readUsage());
  }
}

let cached: SubscriptionStore | null = null;

/** The subscription store: Upstash KV when configured, else a local-file dev fallback. */
export function getStore(): SubscriptionStore {
  if (cached) return cached;
  const redis = redisOrNull();
  cached = redis ? new RedisStore(redis) : new FileStore();
  return cached;
}

/** True when a real KV is wired up (so endpoints can warn loudly in production if it isn't). */
export const isKvConfigured = (): boolean => redisOrNull() != null;
