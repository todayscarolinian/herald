# @herald/utils

Shared utility functions, constants, and validation schemas for the Herald project. This package provides common functionality used across Herald Core and Herald Auth applications.

## Installation

```bash
npm install @herald/utils
```

## Usage

Import utilities from their respective modules:

```typescript
import { SESSION_COOKIE_NAME } from '@herald/utils/constants'
import { loginSchema, signupSchema } from '@herald/utils/validation'
```

## API Reference

### Constants (`@herald/utils/constants`)

#### `SESSION_COOKIE_NAME`

The name of the session cookie used across Herald applications.

```typescript
const SESSION_COOKIE_NAME = 'herald_session'
```

**Usage:**

```typescript
import { SESSION_COOKIE_NAME } from '@herald/utils/constants'

// Set session cookie
cookies.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
})

// Get session cookie
const session = cookies.get(SESSION_COOKIE_NAME)
```

### Validation Schemas (`@herald/utils/validation`)

Validation schemas using [Zod](https://zod.dev/) for runtime type checking and validation.

#### `loginSchema`

Validates user login credentials.

```typescript
const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
})
```

**Fields:**

- `email` - Valid email address (required)
- `password` - Minimum 8 characters (required)
- `rememberMe` - Boolean flag (optional)

**Usage:**

```typescript
import { loginSchema } from '@herald/utils/validation'

// Validate login data
const result = loginSchema.safeParse({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: true,
})

if (result.success) {
  // Data is valid
  const data = result.data
} else {
  // Handle validation errors
  console.error(result.error.errors)
}
```

#### `signupSchema`

Validates new user registration with strong password requirements.

```typescript
const signupSchema = z.object({
  email: z.email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
})
```

**Fields:**

- `email` - Valid email address (required)
- `password` - Minimum 8 characters with uppercase, lowercase, and number (required)
- `firstName` - Non-empty string (required)
- `middleName` - Optional middle name
- `lastName` - Non-empty string (required)

**Password Requirements:**

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)

**Usage:**

```typescript
import { signupSchema } from '@herald/utils/validation'

const result = signupSchema.safeParse({
  email: 'newuser@example.com',
  password: 'SecurePass123',
  firstName: 'John',
  lastName: 'Doe',
})

if (!result.success) {
  // Display validation errors to user
  result.error.errors.forEach((error) => {
    console.log(`${error.path}: ${error.message}`)
  })
}
```

#### `forgotPasswordSchema`

Validates forgot password request.

```typescript
const forgotPasswordSchema = z.object({
  email: z.email('Invalid email address'),
})
```

**Fields:**

- `email` - Valid email address (required)

**Usage:**

```typescript
import { forgotPasswordSchema } from '@herald/utils/validation'

const result = forgotPasswordSchema.safeParse({
  email: 'user@example.com',
})
```

#### `resetPasswordSchema`

Validates password reset with token.

```typescript
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})
```

**Fields:**

- `token` - Reset token from email (required)
- `newPassword` - Minimum 8 characters (required)

**Usage:**

```typescript
import { resetPasswordSchema } from '@herald/utils/validation'

const result = resetPasswordSchema.safeParse({
  token: 'reset-token-from-email',
  newPassword: 'NewSecurePass123',
})
```

## Common Patterns

### Form Validation in React

```typescript
import { loginSchema } from '@herald/utils/validation'

function LoginForm() {
  const handleSubmit = (formData: unknown) => {
    const result = loginSchema.safeParse(formData)

    if (!result.success) {
      // Show validation errors
      const errors = result.error.flatten()
      setFormErrors(errors.fieldErrors)
      return
    }

    // Submit valid data
    await login(result.data)
  }
}
```

### API Route Validation

```typescript
import { signupSchema } from '@herald/utils/validation'

export async function POST(request: Request) {
  const body = await request.json()
  const result = signupSchema.safeParse(body)

  if (!result.success) {
    return Response.json({ error: result.error.errors }, { status: 400 })
  }

  // Process valid signup data
  await createUser(result.data)
}
```

### Type Inference

Extract TypeScript types from schemas:

```typescript
import { z } from 'zod'
import { loginSchema, signupSchema } from '@herald/utils/validation'

type LoginInput = z.infer<typeof loginSchema>
// { email: string; password: string; rememberMe?: boolean }

type SignupInput = z.infer<typeof signupSchema>
// { email: string; password: string; firstName: string; middleName?: string; lastName: string }
```

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

## Package Structure

```shell
packages/utils/
├── src/
│   ├── constants.ts   # Shared constants
│   └── validation.ts  # Zod validation schemas
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- **zod** (^4.3.6) - TypeScript-first schema validation

## Contributing

When adding new utilities:

1. Choose the appropriate module:
   - `constants.ts` - Shared constants and configuration values
   - `validation.ts` - Zod validation schemas
   - Create new modules for other utility categories
2. Export all utilities that should be publicly available
3. Update `package.json` exports if adding a new module
4. Document new utilities in this README with usage examples
5. Ensure type safety and provide JSDoc comments where helpful

## License

Part of the Herald monorepo project.
