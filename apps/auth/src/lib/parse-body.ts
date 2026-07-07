import type { APIResponse } from '@herald/types'
import type { Context } from 'hono'
import type { ZodType } from 'zod'

export type ParsedBodyResult<T> = { ok: true; data: T } | { ok: false; response: Response }

/**
 * Shared JSON-body-parse + zod-validate step reused by every route that
 * expects a JSON body: invalid JSON -> 400 BAD_REQUEST, schema mismatch ->
 * 422 VALIDATION_ERROR with per-field details. Both shapes match what every
 * route already returned by hand before this was extracted.
 */
export async function parseAndValidateBody<T>(
  c: Context,
  schema: ZodType<T>
): Promise<ParsedBodyResult<T>> {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return {
      ok: false,
      response: c.json<APIResponse>(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Invalid JSON body' } },
        400
      ),
    }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }))
    const message = errorDetails.map((d) => `${d.field}: ${d.message}`).join(', ')

    return {
      ok: false,
      response: c.json<APIResponse<typeof errorDetails>>(
        { success: false, error: { code: 'VALIDATION_ERROR', message }, data: errorDetails },
        422
      ),
    }
  }

  return { ok: true, data: parsed.data }
}
