import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  baseURL: 'http://localhost:3000/',
  emailAndPassword: { enabled: true },
  cookiePrefix: 'herald_session',
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: 'todayscarolinian.com',
    },
  },
  trustedOrigins: [
    'https://todayscarolinian.com',
    'https://archives.todayscarolinian.com',
    'https://uscdays.todayscarolinian.com',
    'https://herald.todayscarolinian.com',
    'https://auth.todayscarolinian.com',
  ],
})
