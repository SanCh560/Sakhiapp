# 🚀 Complete Supabase Database Setup Guide for Sakhi

This guide shows you step-by-step how to create the complete 19-table database architecture, vector search indexes, Row Level Security policies, and seed data in your Supabase Cloud account.

---

## 🛠️ Method 1: Web Dashboard (Easiest & Fastest - 2 Minutes)

### Step 1: Log in to Supabase
1. Open **[supabase.com](https://supabase.com)** and log in to your account.
2. Click **New Project** (or open an existing project).

### Step 2: Open SQL Editor
1. In your project dashboard, click on the **SQL Editor** icon on the left sidebar (the `>_` terminal symbol).
2. Click **+ New Query** at the top left.

### Step 3: Run the 4 Migration Files Sequentially
Open each migration file from your project folder `supabase/migrations/`, paste it into the SQL Editor, and click **RUN**:

1. **Migration 1 (Schema & Extensions)**:
   - File: [`supabase/migrations/20260809000001_initial_schema.sql`](file:///C:/Users/mimis/.gemini/antigravity/scratch/sakhi-solo-female-travel/supabase/migrations/20260809000001_initial_schema.sql)
   - Action: Paste & click **RUN** (Creates 19 tables & `pgvector`/`uuid` extensions).

2. **Migration 2 (Indexes & RAG Vector Search)**:
   - File: [`supabase/migrations/20260809000002_indexes_and_vector.sql`](file:///C:/Users/mimis/.gemini/antigravity/scratch/sakhi-solo-female-travel/supabase/migrations/20260809000002_indexes_and_vector.sql)
   - Action: Paste & click **RUN** (Creates performance B-Tree indexes & `ivfflat` vector index).

3. **Migration 3 (Row Level Security & Privacy)**:
   - File: [`supabase/migrations/20260809000003_row_level_security.sql`](file:///C:/Users/mimis/.gemini/antigravity/scratch/sakhi-solo-female-travel/supabase/migrations/20260809000003_row_level_security.sql)
   - Action: Paste & click **RUN** (Enforces RLS privacy policies).

4. **Migration 4 (Baseline Seed Data)**:
   - File: [`supabase/migrations/20260809000004_seed_data.sql`](file:///C:/Users/mimis/.gemini/antigravity/scratch/sakhi-solo-female-travel/supabase/migrations/20260809000004_seed_data.sql)
   - Action: Paste & click **RUN** (Seeds baseline Prague data).

---

## ⚡ Method 2: Developer Supabase CLI

If you use the Supabase CLI:

```bash
# 1. Install Supabase CLI (if not installed)
npm install -g supabase

# 2. Login to your Supabase account
supabase login

# 3. Link your local project to your Supabase project ID
supabase link --project-ref your-supabase-project-id

# 4. Push all migrations in supabase/migrations/
supabase db push
```

---

## 🔑 Step 4: Connect the Web App to Supabase

After running the migrations, get your API keys from **Project Settings ➡️ API**:

1. Copy **Project URL**
2. Copy **anon (public)** key
3. Open your project [`.env`](file:///C:/Users/mimis/.gemini/antigravity/scratch/aura-solo-female-travel/.env) file and paste them:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
