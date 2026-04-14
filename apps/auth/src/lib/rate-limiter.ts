import type { RateLimitContext, RateLimitResponse, RateLimitRule } from '@herald/types'
import { RATE_LIMIT_ERROR_CODES } from '@herald/types'

import { firestore } from './firestore.ts'

type RateLimitScope = NonNullable<RateLimitRule['methodScope']>
type FirestoreDateLike = Date | { toDate: () => Date }

type RateLimitStateDoc = {
  key: string
  route: string
  method: string
  scope: RateLimitScope
  identity: string
  windowSeconds: number
  maxRequests: number
  windowStartMs: number
  requestCount: number
  lastSeenAt: FirestoreDateLike
  expiresAt: FirestoreDateLike
}

const COLLECTION_NAME = 'rate_limit_states'
const CLEANUP_SAMPLE_RATE = 0.01
const CLEANUP_BATCH_SIZE = 200

function assertValidRule(rule: RateLimitRule): void {
  if (!Number.isFinite(rule.windowSeconds) || rule.windowSeconds <= 0) {
    throw new Error('[rate-limiter] rule.windowSeconds must be a positive number')
  }

  if (!Number.isFinite(rule.maxRequests) || rule.maxRequests <= 0) {
    throw new Error('[rate-limiter] rule.maxRequests must be a positive number')
  }
}

function assertValidContext(context: RateLimitContext): void {
  if (!context.route) {
    throw new Error('[rate-limiter] context.route is required')
  }

  if (!context.method) {
    throw new Error('[rate-limiter] context.method is required')
  }

  if (!Number.isFinite(context.now) || context.now <= 0) {
    throw new Error('[rate-limiter] context.now must be a valid epoch ms value')
  }
}

function getScope(rule: RateLimitRule): RateLimitScope {
  return rule.methodScope ?? 'perIP'
}

function getIdentity(context: RateLimitContext, scope: RateLimitScope): string {
  if (scope === 'global') {return 'global'}

  if (scope === 'perUser') {
    if (!context.userId) {
      throw new Error('[rate-limiter] context.userId is required for perUser scope')
    }
    return context.userId
  }

  if (!context.ip) {
    throw new Error('[rate-limiter] context.ip is required for perIP scope')
  }
  return context.ip
}

function sanitizeKeyPart(value: string): string {
  // Firestore doc IDs cannot contain "/" and should remain path-safe.
  return encodeURIComponent(value.trim())
}

function getDocKey(context: RateLimitContext, rule: RateLimitRule): string {
  const scope = getScope(rule)
  const identity = getIdentity(context, scope)
  const prefix = rule.keyPrefix ?? 'rl'

  const parts = [
    sanitizeKeyPart(prefix),
    sanitizeKeyPart(context.method),
    sanitizeKeyPart(context.route),
    sanitizeKeyPart(scope),
    sanitizeKeyPart(identity),
  ]

  return parts.join(':')
}

function buildResponse(
  allowed: boolean,
  rule: RateLimitRule,
  count: number,
  windowStartMs: number,
  now: number
): RateLimitResponse {
  const windowMs = rule.windowSeconds * 1000
  const resetAtEpochMs = windowStartMs + windowMs
  const remaining = Math.max(0, rule.maxRequests - count)

  return {
    allowed,
    limit: rule,
    remaining,
    resetAtEpochMs,
    retryAfterSeconds: allowed ? undefined : Math.max(1, Math.ceil((resetAtEpochMs - now) / 1000)),
    code: allowed ? undefined : RATE_LIMIT_ERROR_CODES.TOO_MANY_REQUESTS,
  }
}

async function cleanupExpiredStates(now: number): Promise<void> {
  const expired = await firestore
    .collection(COLLECTION_NAME)
    .where('expiresAt', '<', new Date(now))
    .limit(CLEANUP_BATCH_SIZE)
    .get()

  if (expired.empty) {return}

  const batch = firestore.batch()
  for (const doc of expired.docs) {
    batch.delete(doc.ref)
  }
  await batch.commit()
}

function maybeRunCleanup(now: number): void {
  if (Math.random() >= CLEANUP_SAMPLE_RATE) {return}
  void cleanupExpiredStates(now).catch((err) => {
    console.error('[rate-limiter] cleanup failed:', err)
  })
}

/**
 * Fixed-window rate limiter with atomic increment/check using Firestore transactions.
 */
export async function checkRateLimit(
  context: RateLimitContext,
  rule: RateLimitRule
): Promise<RateLimitResponse> {
  assertValidContext(context)
  assertValidRule(rule)

  const now = context.now
  const windowMs = rule.windowSeconds * 1000
  const currentWindowStartMs = Math.floor(now / windowMs) * windowMs
  const key = getDocKey(context, rule)
  const scope = getScope(rule)
  const identity = getIdentity(context, scope)
  const docRef = firestore.collection(COLLECTION_NAME).doc(key)

  const result = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(docRef)
    const existing = snap.exists ? (snap.data() as Partial<RateLimitStateDoc>) : null

    const existingWindowStartMs = Number(existing?.windowStartMs ?? -1)
    const rawExistingCount = Number(existing?.requestCount ?? 0)
    const existingCount =
      Number.isFinite(rawExistingCount) && rawExistingCount > 0 ? rawExistingCount : 0

    const isSameWindow =
      Number.isFinite(existingWindowStartMs) && existingWindowStartMs === currentWindowStartMs

    const nextCount = isSameWindow ? existingCount + 1 : 1
    const allowed = nextCount <= rule.maxRequests

    const state: RateLimitStateDoc = {
      key,
      route: context.route,
      method: context.method,
      scope,
      identity,
      windowSeconds: rule.windowSeconds,
      maxRequests: rule.maxRequests,
      windowStartMs: currentWindowStartMs,
      requestCount: nextCount,
      lastSeenAt: new Date(now),
      // Keep one extra window for safe reads + eventual cleanup.
      expiresAt: new Date(currentWindowStartMs + windowMs * 2),
    }

    tx.set(docRef, state, { merge: true })

    return buildResponse(allowed, rule, nextCount, currentWindowStartMs, now)
  })

  maybeRunCleanup(now)
  return result
}

export function isLimited(result: RateLimitResponse): boolean {
  return !result.allowed
}

export async function getRemainingQuota(
  context: RateLimitContext,
  rule: RateLimitRule
): Promise<number> {
  assertValidContext(context)
  assertValidRule(rule)

  const now = context.now
  const windowMs = rule.windowSeconds * 1000
  const currentWindowStartMs = Math.floor(now / windowMs) * windowMs
  const key = getDocKey(context, rule)
  const docRef = firestore.collection(COLLECTION_NAME).doc(key)

  const snap = await docRef.get()
  if (!snap.exists) {return rule.maxRequests}

  const data = snap.data() as Partial<RateLimitStateDoc>
  const windowStartMs = Number(data.windowStartMs ?? -1)
  const requestCount = Number(data.requestCount ?? 0)

  if (windowStartMs !== currentWindowStartMs) {return rule.maxRequests}
  if (!Number.isFinite(requestCount) || requestCount <= 0) {return rule.maxRequests}

  return Math.max(0, rule.maxRequests - requestCount)
}
