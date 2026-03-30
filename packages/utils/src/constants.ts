export const SESSION_COOKIE_NAME = 'herald_session'
export const SESSION_TOKEN_FIELD = 'session_token'

export const PASSWORD_STRENGTH_REQUIREMENTS =
  'Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)'

export const isValidPassword = (password: string) => {
  // At least 8 chars with upper, lower, number, and one special char from !@#$%^&*
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/
  return passwordRegex.test(password)
}
