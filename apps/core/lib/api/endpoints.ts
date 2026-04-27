export const ENDPOINTS = {
  health: '/health',
  auth: {
    loginCredentials: '/auth/login/credentials',
    loginGoogle: '/auth/login/google',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
    forgotPassword: '/auth/forgot-password',
  },
  api: {
    login: '/api/login',
    forgotPassword: '/api/forgot-password',
    resetPassword: '/api/reset-password',
    users: '/api/users',
    positions: '/api/positions',
  },
} as const
