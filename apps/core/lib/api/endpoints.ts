export const ENDPOINTS = {
  health: '/health',
  auth: {
    loginCredentials: '/auth/login/credentials',
    loginGoogle: '/auth/login/google',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
  },
  users: '/api/users',
} as const
