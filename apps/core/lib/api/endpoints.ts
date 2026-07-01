export const ENDPOINTS = {
  health: '/health',
  auth: {
    loginCredentials: '/auth/login/credentials',
    loginGoogle: '/auth/login/google',
    logout: '/auth/logout',
    resetPassword: '/auth/reset-password',
    forgotPassword: '/auth/forgot-password',
    changePassword: '/auth/change-password',
  },
  api: {
    login: '/api/login',
    forgotPassword: '/api/forgot-password',
    resetPassword: '/api/reset-password',
    users: '/api/users',
    usersBulk: '/api/users/bulk',
    positions: '/api/positions',
    positionsBulk: '/api/positions/bulk',
    permissions: '/api/permissions',
    auditLogs: '/api/audit-logs',
    dashboard: '/api/dashboard',
    updateProfile: '/api/user/update-profile',
  },
} as const
