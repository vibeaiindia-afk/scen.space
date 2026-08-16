-- Scen database schema summary
-- Runtime migrations live in server-connector/src/lib/data/migrations.ts
-- Tables: scen_schema_migrations, workspaces, users, memberships, projects, project_versions, scenes, assets, generated_jobs, review_comments, audit_events
-- Tenant key: workspace_id. All application repositories derive workspace scope from signed server sessions.

-- 004 billing + credits
\i migrations/004_billing_credits.sql
