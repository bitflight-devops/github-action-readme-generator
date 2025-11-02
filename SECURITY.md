# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.8.x   | :white_check_mark: |
| 1.7.x   | :white_check_mark: |
| < 1.7   | :x:                |

## Reporting a Vulnerability

We take the security of our GitHub Action seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via one of the following methods:

1. **Email**: Send an email to [jamie@bitflight.io](mailto:jamie@bitflight.io) with the subject line "SECURITY: GitHub Action Readme Generator"
2. **GitHub Security Advisories**: Use [GitHub's security advisory feature](https://github.com/bitflight-devops/github-action-readme-generator/security/advisories/new) to privately report vulnerabilities

### What to Include in Your Report

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- We will acknowledge receipt of your vulnerability report within 3 business days
- We will send you a more detailed response within 7 days indicating the next steps
- We will keep you informed about the progress towards a fix and full announcement
- We may ask for additional information or guidance during our investigation

### Disclosure Policy

- We will credit you in the release notes when the vulnerability is fixed (unless you prefer to remain anonymous)
- We ask that you do not publicly disclose the vulnerability until we have had a chance to address it
- We will make a public disclosure once a fix is available, typically within 90 days of the initial report

## Security Best Practices for Users

When using this GitHub Action:

1. **Pin to a specific version**: Always use a specific version tag (e.g., `v1.8.0`) rather than `@main` or `@latest` in production workflows
2. **Review permissions**: Ensure your workflow only grants the minimum necessary permissions
3. **Audit dependencies**: Regularly check for security advisories affecting this action's dependencies
4. **Keep updated**: Stay informed about new releases and security patches

## Security Update Notifications

To receive security updates:

- Watch this repository for releases
- Subscribe to GitHub Security Advisories for this repository
- Follow our [releases page](https://github.com/bitflight-devops/github-action-readme-generator/releases)

Thank you for helping to keep GitHub Action Readme Generator and our users safe!
