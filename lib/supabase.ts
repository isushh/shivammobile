import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'customer' | 'staff' | 'owner';

export interface Product {
  id: number;
  brand: string;
  name: string;
  price: string;
  emi: boolean;
  ram: string;
  storage: string;
  camera: string;
  display: string;
  battery: string;
  os: string;
  color: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Sign up a new user
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: UserRole
) {
  // Check if owner already exists when registering as owner
  if (role === 'owner') {
    if (email !== 'iamsushant3073@gmail.com') {
      return { data: null, error: { message: 'Unauthorized email. Only iamsushant3073@gmail.com can be registered as the owner.' } };
    }
    const { data: ownerExists } = await supabase.rpc('owner_exists');
    if (ownerExists) {
      return { data: null, error: { message: 'Owner account already exists. Only one owner is allowed.' } };
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      },
    },
  });

  return { data, error };
}

// Sign in
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { data, error };
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Get current session
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Get current user's profile
export async function getProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return data;
}

// Get all pending staff requests (owner only)
export async function getPendingStaff(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'staff')
    .eq('is_approved', false)
    .order('created_at', { ascending: false });

  return data || [];
}

// Get all staff (owner only)
export async function getAllStaff(): Promise<Profile[]> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'staff')
    .order('created_at', { ascending: false });

  return data || [];
}

// Approve a staff member (owner only)
export async function approveStaff(staffId: string) {
  const { error } = await supabase.rpc('approve_and_confirm_staff', { staff_profile_id: staffId });

  return { error };
}

// Reject/remove a staff member (owner only)
export async function rejectStaff(staffId: string) {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', staffId);

  return { error };
}

// Listen for auth state changes
export function onAuthStateChange(callback: (session: any) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
}

// Record staff attendance
export async function recordAttendance(userId: string, type: "IN" | "OUT", lat?: number, lng?: number) {
  const { data, error } = await supabase
    .from('attendance')
    .insert([{ staff_id: userId, type, latitude: lat, longitude: lng }])
    .select()
    .single();
    
  return { data, error };
}

// Get attendance history for a specific staff member today
export async function getAttendanceHistory(userId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('staff_id', userId)
    .order('created_at', { ascending: false });
    
  return { data, error };
}

// Get all attendance for all staff members today
export async function getTodayAllAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      profiles!attendance_staff_id_fkey_profile (full_name)
    `)
    .eq('date', today)
    .order('created_at', { ascending: true });
    
  return { data, error };
}

// Get shop location from settings
export async function getShopLocation() {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'shop_location')
    .single();
    
  return { 
    lat: data?.value?.lat || 26.383, 
    lng: data?.value?.lng || 85.4833, 
    error 
  };
}

// Update shop location in settings
export async function updateShopLocation(lat: number, lng: number) {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'shop_location', value: { lat, lng } });
    
  return { error };
}

// --- INVENTORY SYSTEM ---

export interface InventoryItem {
  id: string;
  brand: string;
  model: string;
  imei: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  type: 'SALE' | 'NEW_STOCK' | 'RETURN';
  quantity: number;
  date: string;
  created_at: string;
  updated_at?: string;
  staff_id: string;
  last_edited_by?: string;
  is_deleted?: boolean;
  deleted_by?: string;
  deleted_at?: string;
  inventory?: {
    brand: string;
    model: string;
  };
  profiles?: { full_name: string };
  editor?: { full_name: string };
  remover?: { full_name: string };
}

export async function getInventory(): Promise<InventoryItem[]> {
  const { data } = await supabase
    .from('inventory')
    .select('*, profiles:last_edited_by(full_name)')
    .order('brand', { ascending: true });
  return (data as any) || [];
}

export async function updateProductStockManual(productId: string, newQuantity: number, userId: string) {
  const { error } = await supabase
    .from('inventory')
    .update({ 
      quantity: newQuantity, 
      last_edited_by: userId, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', productId);
  return { error };
}

export async function addInventoryTransaction(
  item: { brand: string, model: string, imei?: string },
  type: 'SALE' | 'NEW_STOCK' | 'RETURN',
  quantity: number,
  date: string,
  staffId: string
) {
  let productId: string;
  const { data: existing } = await supabase
    .from('inventory')
    .select('id, quantity')
    .eq('brand', item.brand)
    .eq('model', item.model)
    .maybeSingle();

  if (existing) {
    productId = existing.id;
    let newQty = existing.quantity;
    if (type === 'SALE' || type === 'RETURN') newQty -= quantity; 
    if (type === 'NEW_STOCK') newQty += quantity;
    await supabase.from('inventory').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', productId);
  } else {
    const { data: created } = await supabase
      .from('inventory')
      .insert([{ brand: item.brand, model: item.model, imei: item.imei, quantity: type === 'NEW_STOCK' ? quantity : -quantity }])
      .select()
      .single();
    productId = created!.id;
  }

  const { error } = await supabase
    .from('inventory_logs')
    .insert([{ product_id: productId, type, quantity, date, staff_id: staffId }]);

  return { error };
}

export async function getInventoryLogs(startDate: string, endDate: string, includeDeleted = false): Promise<InventoryLog[]> {
  let query = supabase
    .from('inventory_logs')
    .select(`
      *, 
      inventory(brand, model),
      profiles:staff_id(full_name),
      editor:last_edited_by(full_name),
      remover:deleted_by(full_name)
    `)
    .order('created_at', { ascending: false });

  if (startDate === endDate) {
    query = query.eq('date', startDate);
  } else {
    query = query.gte('date', startDate).lte('date', endDate);
  }

  if (!includeDeleted) {
    query = query.eq('is_deleted', false);
  } else {
    query = query.eq('is_deleted', true);
  }
    
  const { data } = await query;
  return (data as any) || [];
}

export async function updateInventoryLog(logId: string, newQty: number, userId: string) {
  const { data: oldLog } = await supabase.from('inventory_logs').select('*').eq('id', logId).single();
  if (!oldLog) return { error: { message: 'Log not found' } };

  const delta = newQty - oldLog.quantity;
  const { data: inv } = await supabase.from('inventory').select('quantity').eq('id', oldLog.product_id).single();
  
  let invDelta = 0;
  if (oldLog.type === 'SALE' || oldLog.type === 'RETURN') invDelta = -delta;
  else if (oldLog.type === 'NEW_STOCK') invDelta = delta;

  const { error: invErr } = await supabase.from('inventory')
    .update({ quantity: (inv?.quantity || 0) + invDelta, updated_at: new Date().toISOString() })
    .eq('id', oldLog.product_id);

  if (invErr) return { error: invErr };

  const { error } = await supabase.from('inventory_logs')
    .update({ 
      quantity: newQty, 
      last_edited_by: userId, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', logId);

  return { error };
}

export async function deleteInventoryLog(logId: string, userId: string) {
  const { data: log } = await supabase.from('inventory_logs').select('*').eq('id', logId).single();
  if (!log) return { error: { message: 'Log not found' } };

  // Reverse inventory quantity
  const { data: inv } = await supabase.from('inventory').select('quantity').eq('id', log.product_id).single();
  let reverseDelta = 0;
  if (log.type === 'SALE' || log.type === 'RETURN') reverseDelta = log.quantity;
  else if (log.type === 'NEW_STOCK') reverseDelta = -log.quantity;

  await supabase.from('inventory')
    .update({ quantity: (inv?.quantity || 0) + reverseDelta, updated_at: new Date().toISOString() })
    .eq('id', log.product_id);

  const { error } = await supabase.from('inventory_logs')
    .update({ 
      is_deleted: true, 
      deleted_by: userId, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', logId);

  return { error };
}

export async function getOpeningStock(date: string): Promise<number> {
  const { data } = await supabase
    .from('inventory_logs')
    .select('type, quantity')
    .eq('is_deleted', false)
    .lt('date', date);
    
  let total = 0;
  data?.forEach(log => {
    if (log.type === 'NEW_STOCK') total += log.quantity;
    else total -= log.quantity;
  });
  
  return total;
}