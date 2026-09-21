import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
);

export type OISnapshot = {
  id: number;
  ts: string;
  index_name: string;
  spot: number;
  max_pain: number;
  pcr: number;
  range_low: number;
  range_high: number;
  top_res_strike: number | null;
  top_res_oi: number | null;
  top_sup_strike: number | null;
  top_sup_oi: number | null;
};