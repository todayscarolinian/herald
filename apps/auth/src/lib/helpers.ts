export const isValidPassword = (password: string) => {
  // Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/
  return passwordRegex.test(password)
}
