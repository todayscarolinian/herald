#!/usr/bin/env node

import { execSync } from 'child_process';

// Branch name pattern: <PREFIX>-<NUMBER>
const BRANCH_PATTERN = /^(AUTH|CORE|INTEG|WEEK)-\d+$/;

// Allowed branch names that don't follow the pattern
const ALLOWED_BRANCHES = ['main', 'develop'];

// Prefix descriptions
const PREFIXES = {
    AUTH: 'Herald Authentication module',
    CORE: 'Herald Core module',
    INTEG: 'Integration work across modules',
    WEEK: 'Weekly sprint branches (e.g., WEEK-1, WEEK-2, etc.)',
};

function getCurrentBranch() {
    try {
        const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        return branch;
    } catch (error) {
        console.error('Error getting current branch:', error.message);
        process.exit(1);
    }
}

function validateBranchName(branchName) {
    const errors = [];

    // Check if it's an allowed branch
    if (ALLOWED_BRANCHES.includes(branchName)) {
        return { valid: true, errors: [] };
    }

    // Check if it matches the required pattern
    if (!BRANCH_PATTERN.test(branchName)) {
        errors.push(`Branch name "${branchName}" does not follow the required pattern`);
        errors.push('');
        errors.push('Required format: <PREFIX>-<ID>');
        errors.push('');
        errors.push('Valid prefixes:');
        Object.entries(PREFIXES).forEach(([prefix, desc]) => {
            errors.push(`  ${prefix.padEnd(6)} - ${desc}`);
        });
        errors.push('');
        errors.push('Examples:');
        errors.push('  AUTH-123   - Authentication feature');
        errors.push('  CORE-456   - Core functionality');
        errors.push('  INTEG-789  - Integration work');
        errors.push('  WEEK-1     - Sprint 1 deliverables');
        errors.push('');
        errors.push('Allowed exceptions:');
        ALLOWED_BRANCHES.forEach(branch => {
            errors.push(`  ${branch}`);
        });

        return { valid: false, errors };
    }

    // Extract prefix and validate
    const match = branchName.match(/^([A-Z]+)-(\d+)$/);
    if (match) {
        const [, prefix, _id] = match;

        if (!PREFIXES[prefix]) {
            errors.push(`Invalid prefix "${prefix}"`);
            errors.push(`Valid prefixes: ${Object.keys(PREFIXES).join(', ')}`);
            return { valid: false, errors };
        }

    }

    return { valid: true, errors: [] };
}

function main() {
    const branchName = getCurrentBranch();

    if (!branchName) {
        console.error('Error: Could not determine current branch');
        process.exit(1);
    }

    const { valid, errors } = validateBranchName(branchName);

    if (!valid) {
        console.error('\n❌ Branch name validation failed:\n');
        errors.forEach(error => console.error(`  ${error}`));
        console.error('');
        console.error('To fix this, rename your branch:');
        console.error(`  git branch -m ${branchName} <PREFIX>-<ID>`);
        console.error('');
        process.exit(1);
    }

    console.log(`✅ Branch name "${branchName}" is valid`);
    process.exit(0);
}

main();
