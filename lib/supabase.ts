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
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: true, updated_at: new Date().toISOString() })
    .eq('id', staffId);

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