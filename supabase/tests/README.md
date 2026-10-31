# Database authorization tests

The executable tests are `apps/web/tests/database/authorization.test.ts`; run with `npm test` from the repository root. They run the real migration against embedded PostgreSQL with minimal `auth.uid()`, `auth.role()`, users, and storage-table stand-ins. They do not mock the RLS engine or PL/pgSQL transactions.

The tests intentionally use isolated fixture identities and roll each case back. They verify signup metadata cannot assign a role, forbidden column writes, owner isolation, assigned-region officer access, private storage visibility, consent and report ownership, duplicate protection, trusted-only prediction persistence, versioned reviews, audit entries, privacy suppression, evidence thresholds, and anonymous denial.

Before deployment, rerun equivalent checks on the actual Supabase project. Embedded tests do not exercise GoTrue email/session behavior, PostgREST relationship serialization, storage signed-URL generation, or hosted gateway configuration.
