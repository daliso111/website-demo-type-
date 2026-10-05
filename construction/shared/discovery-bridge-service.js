import { getSupabaseClient } from './supabase-client.js';

const SINGLETON_ID = 'homepage';
const COLUMNS = 'id,main_paragraph,button_label,button_url,text_alignment,status,is_visible,published_at,created_at,updated_at,updated_by';

function mapPayload(data, status) {
  return {
    id: SINGLETON_ID,
    main_paragraph: data.mainParagraph,
    button_label: data.buttonLabel,
    button_url: data.buttonUrl,
    text_alignment: data.textAlignment,
    status,
    is_visible: Boolean(data.isVisible)
  };
}

async function upsertDiscoveryBridge(data, status) {
  const client = await getSupabaseClient();
  const { data: record, error } = await client
    .from('discovery_bridge_settings')
    .upsert(mapPayload(data, status), { onConflict: 'id' })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return record;
}

export async function getDiscoveryBridge() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('discovery_bridge_settings')
    .select(COLUMNS)
    .eq('id', SINGLETON_ID)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function saveDiscoveryBridgeDraft(data) {
  return upsertDiscoveryBridge(data, 'draft');
}

export function publishDiscoveryBridge(data) {
  return upsertDiscoveryBridge(data, 'published');
}

export async function unpublishDiscoveryBridge() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('discovery_bridge_settings')
    .update({ status: 'draft' })
    .eq('id', SINGLETON_ID)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateDiscoveryBridgeVisibility(isVisible) {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('discovery_bridge_settings')
    .update({ is_visible: Boolean(isVisible) })
    .eq('id', SINGLETON_ID)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function getPublishedDiscoveryBridge() {
  const client = await getSupabaseClient();
  const { data, error } = await client
    .from('discovery_bridge_settings')
    .select('main_paragraph,button_label,button_url,text_alignment')
    .eq('id', SINGLETON_ID)
    .eq('status', 'published')
    .eq('is_visible', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export { SINGLETON_ID };

