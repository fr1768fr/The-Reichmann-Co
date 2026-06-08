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
  expiresAt?: string | null; // licence term end (ISO-8601); null/absent = open-ended
  createdAt: string;
  updatedAt: string;
}

/**
 * Best-effort usage telemetry: which company uses the app and how many active users it has, so
 * over-seat use is visible in the console. Recorded on each activate/refresh (licensed) and on a
 * trial heartbeat (unlicensed). Keyed by the stable per-install `installationId` when present
 * (so a trial that later activates stays a single row), else by `accountKey`.
 */
export interface Usage {
  accountKey: string; // "" for a trial install with no licence yet
  installationId: string | null; // stable per-company-file id, present from app builds that send it
  machineId: string | null; // stable per-device fingerprint (hashed), to anchor the trial to a machine
  company: string;
  registrationNumber: string | null;
  vatNumber: string | null; // the company's own contact details, for support and accurate invoicing
  address: string | null;
  email: string | null;
  phone: string | null;
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
  /**
   * Remove one usage record by its storage id (the install id, or the account key for older
   * rows). Lets an admin clear out companies that are no longer in use. Returns false if there
   * was nothing to remove. The record reappears if that install ever checks in again.
   */
  removeUsage(id: string): Promise<boolean>;
  /**
   * Record (once) when a device first started a trial and return that start time. Used to anchor
   * the free trial to a machine so a new company file does not hand out a fresh trial.
   */
  ensureMachineTrialStart(machineId: string, nowIso: string): Promise<string>;
  /**
   * Assign a licence to a specific install so it can self-activate: the heartbeat hands the
   * account key back to that install (keyed by its stable installationId), which then activates
   * via the normal /activate path. Set when an admin issues a licence to a known company.
   */
  setAssignment(installationId: string, accountKey: string): Promise<void>;
  /** The account key assigned to this install, if any (returned to it on heartbeat). */
  getAssignment(installationId: string): Promise<string | null>;
  /**
   * Record an "an app update is available — check now" nudge. <paramref name="target"/> is a
   * specific installationId (nudge one company) or the literal "all" (nudge everyone). The app
   * sees it on its next check-in and runs its update check.
   */
  setUpdateNudge(target: string, nowIso: string): Promise<void>;
  /**
   * The most recent update nudge that applies to this install: the later of the global ("all")
   * nudge and this install's own nudge, or null if neither was set. The app re-checks only when
   * this is newer than the one it last acted on.
   */
  getUpdateNudge(installationId: string): Promise<string | null>;
}

const env = (key: string): string | undefined =>
  (import.meta.env as Record<string, string | undefined>)?.[key] ?? process.env[key];

const subKey = (accountKey: string) => `license:sub:${accountKey}`;
const INDEX = 'license:subs';
const usageKey = (id: string) => `license:usage:${id}`;
const USAGE_INDEX = 'license:usages';
const machineKey = (machineId: string) => `license:machine:${machineId}`;
const assignKey = (installationId: string) => `license:assign:${installationId}`;
const updateNudgeKey = (target: string) => `license:update:${target}`;
/** The target used for an "update everyone" nudge (vs a specific installationId). */
export const UPDATE_ALL = 'all';
/** The later of two ISO-8601 timestamps (string compare is valid for ISO), or null. */
const laterIso = (a: string | null, b: string | null): string | null =>
  a && b ? (a > b ? a : b) : a ?? b ?? null;
/** An update nudge self-clears about a week after it is set, so it bounds the rollout window. */
const NUDGE_TTL_SEC = 7 * 24 * 60 * 60;
const NUDGE_TTL_MS = NUDGE_TTL_SEC * 1000;
/** The timestamp if it is within the nudge TTL, else null (so stale nudges stop nudging). */
const freshNudge = (iso: string | null | undefined): string | null =>
  iso && Date.now() - new Date(iso).getTime() < NUDGE_TTL_MS ? iso : null;

/** The storage id for a usage record: the stable install id when present, else the account key. */
const usageId = (u: Usage): string => (u.installationId?.trim() || u.accountKey || '').trim();

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
    const id = usageId(usage);
    if (!id) return;
    const existing = await this.redis.get<Usage>(usageKey(id));
    const merged: Usage = { ...usage, firstSeen: existing?.firstSeen ?? usage.firstSeen };
    await this.redis.set(usageKey(id), merged);
    await this.redis.sadd(USAGE_INDEX, id);
  }

  async listUsage(): Promise<Usage[]> {
    const keys = await this.redis.smembers(USAGE_INDEX);
    if (keys.length === 0) return [];
    const values = await this.redis.mget<Usage[]>(...keys.map(usageKey));
    return values.filter((u): u is Usage => u != null);
  }

  async removeUsage(id: string): Promise<boolean> {
    const deleted = await this.redis.del(usageKey(id));
    await this.redis.srem(USAGE_INDEX, id);
    return deleted > 0;
  }

  async ensureMachineTrialStart(machineId: string, nowIso: string): Promise<string> {
    const existing = await this.redis.get<{ trialStartedAt: string }>(machineKey(machineId));
    if (existing?.trialStartedAt) return existing.trialStartedAt;
    await this.redis.set(machineKey(machineId), { trialStartedAt: nowIso });
    return nowIso;
  }

  async setAssignment(installationId: string, accountKey: string): Promise<void> {
    await this.redis.set(assignKey(installationId), { accountKey });
  }

  async getAssignment(installationId: string): Promise<string | null> {
    const a = await this.redis.get<{ accountKey: string }>(assignKey(installationId));
    return a?.accountKey?.trim() || null;
  }

  async setUpdateNudge(target: string, nowIso: string): Promise<void> {
    await this.redis.set(updateNudgeKey(target), { at: nowIso }, { ex: NUDGE_TTL_SEC });
  }

  async getUpdateNudge(installationId: string): Promise<string | null> {
    const [all, mine] = await Promise.all([
      this.redis.get<{ at: string }>(updateNudgeKey(UPDATE_ALL)),
      this.redis.get<{ at: string }>(updateNudgeKey(installationId)),
    ]);
    return laterIso(all?.at ?? null, mine?.at ?? null);
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
    const id = usageId(usage);
    if (!id) return;
    const all = this.readUsage();
    const existing = all[id];
    all[id] = { ...usage, firstSeen: existing?.firstSeen ?? usage.firstSeen };
    writeFileSync(this.usagePath, JSON.stringify(all, null, 2));
  }

  async listUsage(): Promise<Usage[]> {
    return Object.values(this.readUsage());
  }

  async removeUsage(id: string): Promise<boolean> {
    const all = this.readUsage();
    if (!(id in all)) return false;
    delete all[id];
    writeFileSync(this.usagePath, JSON.stringify(all, null, 2));
    return true;
  }

  private readonly machinePath = '.license-machine-trials.json';

  private readMachineTrials(): Record<string, { trialStartedAt: string }> {
    if (!existsSync(this.machinePath)) return {};
    try {
      return JSON.parse(readFileSync(this.machinePath, 'utf8')) as Record<string, { trialStartedAt: string }>;
    } catch {
      return {};
    }
  }

  async ensureMachineTrialStart(machineId: string, nowIso: string): Promise<string> {
    const all = this.readMachineTrials();
    if (all[machineId]?.trialStartedAt) return all[machineId].trialStartedAt;
    all[machineId] = { trialStartedAt: nowIso };
    writeFileSync(this.machinePath, JSON.stringify(all, null, 2));
    return nowIso;
  }

  private readonly assignPath = '.license-assignments.json';

  private readAssignments(): Record<string, string> {
    if (!existsSync(this.assignPath)) return {};
    try {
      return JSON.parse(readFileSync(this.assignPath, 'utf8')) as Record<string, string>;
    } catch {
      return {};
    }
  }

  async setAssignment(installationId: string, accountKey: string): Promise<void> {
    const all = this.readAssignments();
    all[installationId] = accountKey;
    writeFileSync(this.assignPath, JSON.stringify(all, null, 2));
  }

  async getAssignment(installationId: string): Promise<string | null> {
    return this.readAssignments()[installationId]?.trim() || null;
  }

  private readonly updatePath = '.license-update-nudges.json';

  private readUpdateNudges(): Record<string, string> {
    if (!existsSync(this.updatePath)) return {};
    try {
      return JSON.parse(readFileSync(this.updatePath, 'utf8')) as Record<string, string>;
    } catch {
      return {};
    }
  }

  async setUpdateNudge(target: string, nowIso: string): Promise<void> {
    const all = this.readUpdateNudges();
    all[target] = nowIso;
    writeFileSync(this.updatePath, JSON.stringify(all, null, 2));
  }

  async getUpdateNudge(installationId: string): Promise<string | null> {
    const all = this.readUpdateNudges();
    return laterIso(freshNudge(all[UPDATE_ALL]), freshNudge(all[installationId]));
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
