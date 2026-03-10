# Lefthook Branch Name Validator

A JavaScript-based branch name validator for lefthook that enforces a consistent branch naming convention.

## Branch Naming Convention

Branch names must follow this pattern: `<PREFIX>-<ID>`

### Valid Prefixes

- **AUTH** - Herald Authentication module
- **CORE** - Herald Core module
- **INTEG** - Integration work across modules

### Protected Branches (Exempt from Pattern)

- `main`
- `develop`

### Install the git hook

```bash
npx lefthook install
```

## Usage

### Creating Valid Branches

✅ **Valid branch names:**

```bash
git checkout -b AUTH-123
git checkout -b CORE-456
git checkout -b INTEG-789
git checkout -b AUTH-1
git checkout -b CORE-9999
```

✅ **Protected branches (always valid):**

```bash
git checkout -b main
git checkout -b develop
```

❌ **Invalid branch names:**

```bash
git checkout -b feature-login        # Missing prefix
git checkout -b auth-123             # Lowercase prefix
git checkout -b AUTH                 # Missing ID
git checkout -b AUTH-                # Missing ID number
git checkout -b AUTH-0               # ID cannot be 0
git checkout -b AUTH-123-login       # Extra suffix not allowed
git checkout -b FEAT-123             # Invalid prefix
git checkout -b AUTH_123             # Wrong separator (use hyphen)
```

## Validation Timing

### Pre-Push (Recommended)

By default, validation runs on `pre-push`, which means:

- You can work locally with any branch name
- Validation occurs only when pushing to remote
- Prevents invalid branch names from reaching the repository

### Pre-Commit (Alternative)

To validate on every commit, update `lefthook.yml`:

```yaml
pre-commit:
  commands:
    validate-branch-name:
      run: node scripts/validate-branch-name.js
```

This provides earlier feedback but runs more frequently.

## Examples

### Example 1: Creating a New Feature Branch

```bash
# Starting work on authentication feature (ticket #247)
git checkout -b AUTH-247

# Make changes and commit
git add .
git commit -m "feat(auth): add JWT token validation"

# Push to remote - validation passes ✅
git push origin AUTH-247
```

### Example 2: Invalid Branch Name

```bash
# Attempting to create branch with wrong format
git checkout -b feature-login

# Make changes and commit
git add .
git commit -m "feat(auth): add login"

# Try to push - validation fails ❌
git push origin feature-login
```

### Example 3: Fixing Invalid Branch Name

```bash
# Rename the branch
git branch -m feature-login AUTH-247

# Push again - validation passes ✅
git push origin AUTH-247
```

## Bypassing Validation (Emergency Use Only)

If you absolutely must bypass validation:

```bash
git push --no-verify origin branch-name
```

⚠️ **Warning**: This should only be used in emergencies. Invalid branch names can cause confusion and break automated workflows.

```markdown
## Branch Naming Convention

All feature branches must follow this format: `<PREFIX>-<ID>`

- AUTH-xxx: Herald Authentication module
- CORE-xxx: Herald Core module
- INTEG-xxx: Integration work across modules

Example: `AUTH-247` for authentication ticket #247
```

## Troubleshooting

### Hook not running

```bash
# Verify lefthook is installed
npx lefthook version

# Reinstall hooks
npx lefthook install

# Check file permissions
chmod +x scripts/validate-branch-name.js
```

### Branch name not detected

```bash
# Verify git is working
git branch --show-current

# Check if in detached HEAD state
git status
```

### Node not found

```bash
# Check Node.js installation
node --version

# Ensure Node is in PATH
which node

# Update shebang if needed (in validate-branch-name.js)
#!/usr/bin/env node
```

### Validation passing but shouldn't

```bash
# Test the script directly
node scripts/validate-branch-name.js

# Check current branch
git branch --show-current

# Verify lefthook config
lefthook run pre-push
```

## FAQ

**Q: Can I use lowercase prefixes?**  
A: No, prefixes must be uppercase (AUTH, CORE, INTEG) for consistency.

**Q: Can I add a description after the ID?**  
A: No, the branch name must strictly follow the `<PREFIX>-<ID>` format without additional suffixes.

**Q: What about hotfix or bugfix branches?**  
A: Use the appropriate prefix with the issue ID (e.g., `CORE-123` for a core bug fix).

**Q: Can I have a branch without an ID?**  
A: Only `main` and `develop` are exempt. All other branches must have a prefix and ID.

**Q: How do I handle branch names for experiments?**  
A: Either use an appropriate prefix with a tracking ID, or add your branch to `ALLOWED_BRANCHES` temporarily.

**Q: Should I validate on pre-commit or pre-push?**  
A: Pre-push is recommended as it's less intrusive while still preventing invalid names from reaching remote.
