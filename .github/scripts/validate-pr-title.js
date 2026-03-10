#!/usr/bin/env node
/* eslint-disable turbo/no-undeclared-env-vars */

/**
 * Validates PR title format: [<branch_name>] <description>
 * 
 * The branch name in brackets must match the actual source branch name.
 * Description must be meaningful (not empty, at least 10 characters).
 * 
 * Supported formats:
 * - [AUTH-123] <description> - Feature branches
 * - [CORE-456] <description> - Feature branches
 * - [INTEG-789] <description> - Feature branches
 * - [WEEK-1] <description> - Weekly sprint branches
 */

const PR_TITLE = process.env.PR_TITLE;
const BRANCH_NAME = process.env.BRANCH_NAME;

// Pattern: [<branch_name>] <description>
const PR_TITLE_PATTERN = /^\[([^\]]+)\]\s+(.+)$/;

// Minimum description length
const MIN_DESCRIPTION_LENGTH = 10;

function validatePRTitle(prTitle, branchName) {
    const errors = [];

    if (!prTitle) {
        errors.push('PR title is empty');
        return { valid: false, errors };
    }

    if (!branchName) {
        errors.push('Branch name could not be determined');
        return { valid: false, errors };
    }

    // Check if title matches the pattern
    const match = prTitle.match(PR_TITLE_PATTERN);

    if (!match) {
        errors.push(`PR title does not follow the required format`);
        errors.push('');
        errors.push('Required format: [<branch_name>] <description>');
        errors.push('');
        errors.push(`Your branch: ${branchName}`);
        errors.push(`Expected format: [${branchName}] <your description here>`);
        errors.push('');
        errors.push('Examples:');
        errors.push('  [AUTH-123] Add JWT token validation');
        errors.push('  [CORE-456] Refactor database connection pool');
        errors.push('  [INTEG-789] Integrate Stripe payment gateway');
        errors.push('  [WEEK-1] Sprint 1 deliverables');

        return { valid: false, errors };
    }

    const [, titleBranchName, description] = match;

    const isWeekFormat = /^WEEK-\d+$/.test(titleBranchName);

    // Validate branch name matches
    if (!isWeekFormat && titleBranchName !== branchName) {
        errors.push(`Branch name in PR title does not match actual branch name`);
        errors.push('');
        errors.push(`PR title has: [${titleBranchName}]`);
        errors.push(`Actual branch: ${branchName}`);
        errors.push('');
        errors.push(`Correct format: [${branchName}] ${description}`);

        return { valid: false, errors };
    }

    // Validate description
    const trimmedDescription = description.trim();

    if (trimmedDescription.length === 0) {
        errors.push('Description cannot be empty');
        errors.push(`Format: [${branchName}] <add meaningful description here>`);
        return { valid: false, errors };
    }

    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH) {
        errors.push(`Description is too short (${trimmedDescription.length} characters)`);
        errors.push(`Minimum length: ${MIN_DESCRIPTION_LENGTH} characters`);
        errors.push('');
        errors.push('Please provide a meaningful description of what this PR does');
        return { valid: false, errors };
    }

    // Check for common placeholder text
    const placeholders = [
        'description',
        'add description',
        'todo',
        'wip',
        'work in progress',
        'test',
        'testing'
    ];

    const descriptionLower = trimmedDescription.toLowerCase();
    for (const placeholder of placeholders) {
        if (descriptionLower === placeholder) {
            errors.push(`Description appears to be a placeholder: "${trimmedDescription}"`);
            errors.push('Please provide a meaningful description of the changes');
            return { valid: false, errors };
        }
    }

    return { valid: true, errors: [], branchName: titleBranchName, description: trimmedDescription, isWeekFormat };
}

function main() {
    console.log('🔍 Validating PR title...\n');
    console.log(`PR Title: "${PR_TITLE}"`);
    console.log(`Branch:   "${BRANCH_NAME}"\n`);

    const { valid, errors, description, isWeekFormat, branchName: titleBranchName } = validatePRTitle(PR_TITLE, BRANCH_NAME);

    if (!valid) {
        console.error('❌ PR title validation failed:\n');
        errors.forEach(error => console.error(`  ${error}`));
        console.error('');
        process.exit(1);
    }

    console.log('✅ PR title is valid!');
    if (isWeekFormat) {
        console.log(`   Sprint: [${titleBranchName}]`);
        console.log(`   Source branch: ${BRANCH_NAME}`);
    } else {
        console.log(`   Branch: [${BRANCH_NAME}]`);
    }
    console.log(`   Description: ${description}`);
    console.log('');
    process.exit(0);
}

main();