import { parseAllowedOrigins } from '@herald/utils'

export const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.NEXT_PUBLIC_ALLOWED_ORIGINS)
