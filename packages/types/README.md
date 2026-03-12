# @herald/types

Shared TypeScript type definitions for the Herald project. This package provides type-safe interfaces for authentication, user management, and API responses used across Herald Core and Herald Auth applications.

## Installation

```bash
npm install @herald/types
```

## Usage

Import types from their respective modules:

```typescript
import type { LoginRequest, LoginResponse, APIResponse } from '@herald/types/auth'
import type { UserProfile } from '@herald/types/user'
```

## API Reference

### Authentication Types (`@herald/types/auth`)

#### `LoginRequest`

Credentials for user authentication.

```typescript
interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}
```

**Properties:**

- `email` - User's email address
- `password` - User's password
- `rememberMe` - Optional flag to extend session duration

#### `LoginResponse`

Response returned after successful authentication.

```typescript
interface LoginResponse {
  success: boolean
  session: {
    token: string
    expiresAt: number
  }
  user: UserProfile
}
```

**Properties:**

- `success` - Whether login was successful
- `session.token` - JWT or session token
- `session.expiresAt` - Unix timestamp when session expires
- `user` - Authenticated user's profile

#### `VerifySessionRequest`

Request to validate an existing session token.

```typescript
interface VerifySessionRequest {
  token: string
}
```

**Properties:**

- `token` - Session token to verify

#### `VerifySessionResponse`

Response from session verification.

```typescript
interface VerifySessionResponse {
  valid: boolean
  user?: UserProfile
}
```

**Properties:**

- `valid` - Whether the session token is valid
- `user` - User profile if session is valid

#### `ForgotPasswordRequest`

Request to initiate password reset flow.

```typescript
interface ForgotPasswordRequest {
  email: string
}
```

**Properties:**

- `email` - Email address for password reset

#### `ResetPasswordRequest`

Request to complete password reset with new password.

```typescript
interface ResetPasswordRequest {
  token: string
  newPassword: string
}
```

**Properties:**

- `token` - Password reset token (from email)
- `newPassword` - New password to set

#### `APIResponse<T>`

Generic wrapper for API responses with error handling.

```typescript
interface APIResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

**Type Parameters:**

- `T` - Type of the data payload (default: `unknown`)

**Properties:**

- `success` - Whether the API call succeeded
- `data` - Response payload when successful
- `error` - Error details when unsuccessful
  - `code` - Error code for programmatic handling
  - `message` - Human-readable error message

**Example:**

```typescript
const response: APIResponse<LoginResponse> = {
  success: true,
  data: {
    success: true,
    session: { token: 'abc123', expiresAt: 1234567890 },
    user: {
      /* ... */
    },
  },
}
```

### User Types (`@herald/types/user`)

#### `UserProfile`

Complete user profile information.

```typescript
interface UserProfile {
  id: string
  email: string
  firstName: string
  middleName?: string
  lastName: string
  positionId: string
  emailVerified: boolean
  disabled: boolean
  createdAt: string
  updatedAt: string
}
```

**Properties:**

- `id` - Unique user identifier
- `email` - User's email address
- `firstName` - User's first name
- `middleName` - Optional middle name
- `lastName` - User's last name
- `positionId` - Reference to user's position/role
- `emailVerified` - Whether email has been verified
- `disabled` - Whether account is disabled
- `createdAt` - ISO 8601 timestamp of account creation
- `updatedAt` - ISO 8601 timestamp of last update

## Development

### Build

```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist/` folder.

### Watch Mode

```bash
npm run dev
```

Runs TypeScript compiler in watch mode for development.

### Type Checking

```bash
npm run check-types
```

Validates TypeScript types without emitting output files.

## Package Structure

```shell
packages/types/
├── src/
│   ├── auth.ts      # Authentication types
│   └── user.ts      # User profile types
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing

When adding new types:

1. Place types in the appropriate module (`auth.ts`, `user.ts`, or create a new module)
2. Export all types that should be publicly available
3. Update `package.json` exports if adding a new module
4. Document new types in this README
5. Ensure types are fully typed (avoid `any`)

## License

Part of the Herald monorepo project.
