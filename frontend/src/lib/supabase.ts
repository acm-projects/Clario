import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase frontend configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY in backend/.env.",
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
);