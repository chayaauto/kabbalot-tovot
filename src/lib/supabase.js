import { createClient } from '@supabase/supabase-js';

// Public project address and public (anon) key. Safe to ship in the browser:
// what each user may read or change is enforced by row-level security in the database.
const SUPABASE_URL = 'https://zfayegzjyuqbvesmwisz.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmYXllZ3pqeXVxYnZlc213aXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjkzNTIsImV4cCI6MjEwODg0NTM1Mn0.pnh4_uAp-JHnBsSpnGbSoYSB6SaXX8C9hj3YOVQE5sM';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
