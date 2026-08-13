# Security Policy

## Public repository rules

This repository must not contain production credentials, tenant secrets, private customer data, internal employee data, service-role keys, API tokens, signing keys, passwords, private endpoints, or unredacted production identifiers.

Use environment variables and deployment-secret stores for all sensitive configuration. Commit only placeholder values in `.env.example`.

## If a secret is exposed

1. Revoke or rotate it immediately.
2. Remove it from the current branch and deployment configuration.
3. Review repository history and related logs for exposure.
4. Replace the affected credential before redeploying.

Do not post active credentials or personal data in public issues, pull requests, screenshots, examples, or documentation.
