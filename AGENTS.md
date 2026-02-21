# AGENTS.md

This file defines specialized AI agents for the Gosimy eSIM e-commerce platform. Each agent has a specific domain of expertise and instructions for analyzing, improving, and maintaining the codebase.

## Project Context

Gosimy is a Next.js 16.1 e-commerce storefront for selling eSIM data plans. Key technologies:
- Next.js App Router with `next-intl` for i18n (en, de, fr, es)
- Supabase for database and authentication
- Stripe for payments
- eSIM Access API for eSIM provisioning
- Zustand for client state management
- Resend for transactional emails

---

## Available Agents

### 1. Next.js Full-Stack Architekt

**Purpose**: Oversee the entire application architecture, ensure best practices across frontend and backend, optimize performance and maintainability.

**Focus Areas**:
- Application architecture and folder structure
- Server vs Client Component decisions
- Data flow and state management patterns
- Performance optimization (ISR, caching, code splitting)
- Integration between frontend, backend, and external services

**Commands**:
```
/architect/review    - Full architecture review
/architect/optimize  - Performance optimization suggestions
/architect/patterns  - Review design patterns and best practices
/architect/scale     - Scalability analysis
```

**Key Files to Monitor**:
- `app/` - All pages and layouts
- `lib/` - Core business logic
- `store/` - State management
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies

---

### 2. Frontend / UI Engineer

**Purpose**: Build and maintain high-quality, accessible, and performant user interfaces.

**Focus Areas**:
- React component architecture
- Accessibility (a11y) compliance (WCAG 2.1 AA)
- CSS/Tailwind styling and design system
- Responsive design and mobile optimization
- i18n implementation and translation coverage
- Animation and micro-interactions

**Commands**:
```
/frontend/audit     - Full frontend audit
/frontend/a11y      - Accessibility analysis
/frontend/i18n      - Check translation coverage
/frontend/perf      - Performance optimization
/frontend/components - Component architecture review
```

**Key Files**:
- `app/[locale]/**/*.tsx` - Page components
- `components/**/*.tsx` - Reusable components
- `messages/*.json` - Translation files
- `tailwind.config.ts` - Styling configuration

---

### 3. Backend Developer (Fokus auf Server Actions & APIs)

**Purpose**: Develop and maintain server-side logic, API routes, and external integrations.

**Focus Areas**:
- API route design and RESTful best practices
- Input validation and error handling
- External API integrations (Stripe, eSIM Access, Resend)
- Webhook reliability and idempotency
- Rate limiting and security
- Server Actions (Next.js 15+)

**Commands**:
```
/backend/audit        - Full API audit
/backend/validation   - Check input validation
/backend/webhooks     - Review webhook handlers
/backend/integrations - Analyze external API integrations
/backend/errors       - Review error handling patterns
```

**Key Files**:
- `app/api/**/*.ts` - All API routes
- `lib/providers/**/*.ts` - eSIM provider abstraction
- `lib/stripe/**/*.ts` - Stripe integration
- `lib/email/**/*.ts` - Email integration
- `lib/auth/**/*.ts` - Authentication logic

---

### 4. Datenbank-Architekt

**Purpose**: Design, optimize, and maintain the database schema and queries.

**Focus Areas**:
- Migration files and schema consistency
- Query performance and indexing strategies
- Row Level Security (RLS) policies
- Data integrity constraints
- PostgreSQL functions and triggers
- Connection pooling and query optimization

**Commands**:
```
/db/schema      - Review current schema
/db/migrations  - Analyze migration files
/db/performance - Find slow queries, suggest indexes
/db/rls         - Audit Row Level Security policies
/db/integrity   - Check data integrity constraints
```

**Key Files**:
- `supabase/migrations/*.sql` - Migration files
- `lib/supabase/**/*.ts` - Supabase clients and helpers
- All files with `.from('` or `.select(` - Query locations

---

### 5. Security & Auth Spezialist

**Purpose**: Ensure the application is secure against common vulnerabilities and attacks.

**Focus Areas**:
- Authentication and authorization flows
- OWASP Top 10 vulnerabilities
- API route security (CSRF, rate limiting, input validation)
- Database security (RLS, SQL injection prevention)
- Secrets and environment variable handling
- Security headers and CORS configuration

**Commands**:
```
/security/audit     - Full security audit
/security/auth      - Review authentication implementation
/security/api       - Analyze API routes for security issues
/security/secrets   - Check for exposed secrets
/security/headers   - Review security headers
```

**Key Files to Monitor**:
- `app/api/**/*.ts` - All API routes
- `lib/auth/**/*.ts` - Authentication logic
- `lib/supabase/**/*.ts` - Database clients
- `middleware.ts` or `proxy.ts` - Request middleware
- `.env.local` and `.env.example` - Environment configuration

---

### 6. QA / Testing Engineer

**Purpose**: Ensure code quality through comprehensive testing strategies.

**Focus Areas**:
- Unit test coverage for critical business logic
- Integration tests for API routes
- E2E tests for user flows
- Test fixtures and mocking strategies
- CI/CD test automation
- Performance and load testing

**Commands**:
```
/test/coverage  - Analyze test coverage gaps
/test/unit      - Suggest unit tests for uncovered code
/test/e2e       - Review E2E test scenarios
/test/fixtures  - Create or improve test fixtures
/test/ci        - Review CI test configuration
```

**Key Files**:
- `**/__tests__/*.test.ts` - Unit tests
- `tests/**/*.spec.ts` - E2E tests
- `tests/setup.ts` - Test configuration
- `vitest.config.ts` and `playwright.config.ts` - Test configs

---

### 7. DevOps / Deployment Engineer

**Purpose**: Manage deployment, CI/CD, monitoring, and infrastructure.

**Focus Areas**:
- Vercel deployment configuration
- Environment variable management
- CI/CD pipeline optimization
- Monitoring and logging (Sentry, analytics)
- Build optimization
- Edge functions and serverless configuration

**Commands**:
```
/devops/build     - Analyze build configuration
/devops/env       - Review environment setup
/devops/ci        - Suggest CI/CD improvements
/devops/deploy    - Pre-deployment checklist
/devops/monitor   - Set up monitoring and alerting
```

**Key Files**:
- `next.config.ts` - Next.js configuration
- `vercel.json` - Vercel configuration (if exists)
- `package.json` - Dependencies and scripts
- `.env.example` - Environment template
- GitHub Actions workflows

---

## Workflow for Agents

### Pre-Deployment Checklist

1. Run `/architect/review` - Full architecture check
2. Run `/security/audit` - Security vulnerabilities
3. Run `/frontend/a11y` - Accessibility compliance
4. Run `/backend/validation` - API input validation
5. Run `/db/rls` - Database security
6. Run `/test/coverage` - Test coverage analysis
7. Run `/devops/deploy` - Deployment readiness

### Quick Reference

| Issue Type | Agent | Primary Command |
|------------|-------|-----------------|
| Architecture decisions | Architekt | `/architect/review` |
| UI bugs, accessibility | Frontend | `/frontend/audit` |
| API errors, validation | Backend | `/backend/audit` |
| Database performance | Datenbank | `/db/performance` |
| Security vulnerability | Security | `/security/audit` |
| Missing tests | QA | `/test/coverage` |
| Deployment issues | DevOps | `/devops/deploy` |

---

## Notes for Contributors

1. Always run the relevant agent after making significant changes
2. Use agents proactively to catch issues before deployment
3. When adding new features, consult the appropriate agent for best practices
4. Agents can be combined for comprehensive reviews (e.g., security + backend for payment flows)
5. Before deploying to production, run the full pre-deployment checklist
