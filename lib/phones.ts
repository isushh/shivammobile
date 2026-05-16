import { supabase } from "./supabase";

export interface Phone {
  id: string;
  brand: string;
  name: string;
  price: string;
  price_numeric: number;
  ram: string | null;
  storage: string | null;
  camera: string | null;
  display: string | null;
  battery: string | null;
  os: string | null;
  color: string | null;
  emi: boolean;
  is_active: boolean;
  is_new_launch: boolean;
  bestseller_rank: number | null;
  launched_at: string | null;
  image_url: string | null;
  source_url: string | null;
}

export async function getPhones(): Promise<Phone[]> {
  const { data, error } = await supabase
    .from("phones")
    .select("*")
    .eq("is_active", true)
    .order("bestseller_rank", { ascending: true, nullsFirst: false });
  if (error) { console.error("getPhones error:", error); return []; }
  return (data ?? []) as Phone[];
}

export async function getNewLaunches(days = 60): Promise<Phone[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase
    .from("phones")
    .select("*")
    .eq("is_active", true)
    .gte("launched_at", since.toISOString().split("T")[0])
    .order("launched_at", { ascending: false });
  if (error) { console.error("getNewLaunches error:", error); return []; }
  return (data ?? []) as Phone[];
}

export async function getPhoneBrands(): Promise<string[]> {
  const { data, error } = await supabase
    .from("phones").select("brand").eq("is_active", true);
  if (error) return [];
  const brands = [...new Set((data ?? []).map((r: any) => r.brand as string))].sort();
  return brands;
}
