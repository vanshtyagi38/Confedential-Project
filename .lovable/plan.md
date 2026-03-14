

## Plan: API Analytics, Health Check & Versioning

This plan covers three features: (1) an API analytics dashboard in the admin panel, (2) a health-check edge function, and (3) an API versioning system.

---

### 1. Database: `api_request_logs` table

Create a new table to store edge function invocation metrics:

```sql
CREATE TABLE public.api_request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  method text NOT NULL DEFAULT 'POST',
  status_code integer NOT NULL,
  response_time_ms integer NOT NULL,
  error_message text,
  user_id uuid,
  ip_address text,
  api_version text DEFAULT 'v1',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.api_request_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs; service role can insert
CREATE POLICY "Admins can read api logs" ON public.api_request_logs
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert api logs" ON public.api_request_logs
  FOR INSERT TO public WITH CHECK (true);
```

### 2. Edge Function: `health-check`

New function at `supabase/functions/health-check/index.ts` that tests:
- **Database**: Simple query (`SELECT 1`)
- **Auth**: Validates auth service responds
- **Storage**: Checks `chat-images` bucket exists
- **Edge Functions**: Self-check (responding = healthy)

Returns JSON:
```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "...",
  "services": {
    "database": { "status": "up", "latency_ms": 12 },
    "auth": { "status": "up", "latency_ms": 45 },
    "storage": { "status": "up", "latency_ms": 30 }
  }
}
```

Add to `supabase/config.toml`:
```toml
[functions.health-check]
verify_jwt = false
```

### 3. Logging Helper for Edge Functions

Add a shared logging utility that each edge function calls at the end of request processing. This writes to `api_request_logs` with function name, status code, and elapsed time. Update these edge functions to use it:
- `companion-chat`
- `rate-limiter`
- `verify-email-otp`
- `google-onetap`
- `bypass-otp`

Each function gets a `const start = Date.now()` at the top and a log insert before returning.

### 4. Admin Page: `AdminApiAnalytics.tsx`

New admin page showing:
- **Stat cards**: Total requests (24h), error rate %, avg response time, active functions count
- **Line chart**: Requests over time (last 7 days, grouped by hour or day)
- **Bar chart**: Errors by function
- **Table**: Recent requests with function name, status, response time, timestamp

Data fetched from `api_request_logs` table.

### 5. API Versioning

- Add `api_version` column to `api_request_logs` (included above)
- Each edge function accepts an `X-API-Version` header (defaults to `v1`)
- The health-check endpoint returns current supported versions
- This is a lightweight header-based versioning system — no URL path changes needed. When breaking changes are introduced later, functions can branch logic based on the version header.

### 6. Routing & Sidebar

- Add route `/admin/api-analytics` in `App.tsx`
- Add sidebar link in `AdminSidebar.tsx` with `Gauge` icon and label "API Analytics"

---

### Summary of files to create/edit

| File | Action |
|------|--------|
| Migration SQL | Create `api_request_logs` table |
| `supabase/functions/health-check/index.ts` | New edge function |
| `supabase/config.toml` | Add health-check config |
| `supabase/functions/companion-chat/index.ts` | Add request logging |
| `supabase/functions/rate-limiter/index.ts` | Add request logging |
| `supabase/functions/verify-email-otp/index.ts` | Add request logging |
| `supabase/functions/google-onetap/index.ts` | Add request logging |
| `supabase/functions/bypass-otp/index.ts` | Add request logging |
| `src/pages/admin/AdminApiAnalytics.tsx` | New admin page |
| `src/components/admin/AdminSidebar.tsx` | Add link |
| `src/App.tsx` | Add route |

