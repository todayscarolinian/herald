export class AuthService {
  async init() {
    return 'Hello from auth service'
  }
}

export const authService = new AuthService()
