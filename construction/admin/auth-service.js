import { getSupabaseClient } from '../shared/supabase-client.js';

export async function getAdminSession() {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signInAdmin(email, password) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function requestAdminPasswordReset(email, redirectTo) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return data;
}

export async function updateAdminPassword(password) {
  const client = await getSupabaseClient();
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data.user;
}

export async function signOutAdmin() {
  const client = await getSupabaseClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getAdminProfileForUser(userId) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('admin_profiles')
    .select('id,user_id,email,display_name,role,is_active')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getCurrentAdminProfile() {
  const client = await getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;
  const profile = await getAdminProfileForUser(userData.user.id);
  if (!profile || !profile.is_active || !['admin', 'editor'].includes(profile.role)) return null;
  return profile;
}

export async function subscribeToAdminAuth(callback) {
  const client = await getSupabaseClient();
  const { data } = client.auth.onAuthStateChange((event, session) => callback(event, session));
  return () => data.subscription.unsubscribe();
}
