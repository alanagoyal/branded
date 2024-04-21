"use server";

import { Database } from "@/types/supabase";
import { createClient } from "@supabase/supabase-js";

export async function supabaseAdmin() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    }
  );

  return supabase;
}
