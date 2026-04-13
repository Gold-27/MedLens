# Supabase Setup for MedLens

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to your users
3. Wait for the database to be provisioned

## 2. Database Setup
Run the migration file to create the necessary tables and policies:

```sql
-- Copy the contents of migrations/001_initial_schema.sql
-- Run in the Supabase SQL Editor
```

Alternatively, use the Supabase CLI:
```bash
supabase db push
```

## 3. Authentication Setup
Supabase Auth is automatically enabled. Configure the following:

### Email Authentication
1. Go to Authentication → Providers → Email
2. Enable "Email" provider
3. Configure email templates if needed

### Optional: Social Logins
Add Google, Apple, etc. as needed.

## 4. Environment Variables
Add the following to your `.env` file in the API directory:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Find these values in:
- Project Settings → API → Project URL
- Project Settings → API → anon/public key
- Project Settings → API → service_role key (keep secret!)

## 5. Row Level Security (RLS)
The migration already enables RLS and creates policies. Verify that:
- Users can only access their own cabinet items
- Policies are active in the Supabase Dashboard

## 6. Testing
1. Create a test user via the Supabase Auth UI
2. Verify cabinet_items table permits inserts for that user only

## Notes
- The `users` table is managed by Supabase Auth (in `auth.users` schema)
- No sensitive medical data is stored
- All drug data is fetched fresh from OpenFDA APIs