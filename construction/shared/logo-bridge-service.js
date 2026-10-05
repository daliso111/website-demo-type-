import { getSupabaseClient } from './supabase-client.js';
import { getMediaAsset, getMediaPublicUrl } from './homepage-media-service.js';

const SETTINGS_COLUMNS='id,record_type,eyebrow,heading,description,is_visible,published_at,created_by,updated_by,created_at,updated_at';
const ITEM_COLUMNS='id,logo_key,record_type,organization_name,logo_asset_id,alt_text,sort_order,is_visible,published_at,created_by,updated_by,created_at,updated_at';
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createLogoKey() {
  if (typeof globalThis.crypto?.randomUUID!=='function') throw new Error('This browser cannot generate secure logo identifiers.');
  return globalThis.crypto.randomUUID();
}

function normalizeLogoKey(value) {
  const key=String(value||'');
  return UUID_PATTERN.test(key)?key:createLogoKey();
}

function normalizeSettings(record,type='draft') {
  if (!record) return type==='draft'?{
    id:'',recordType:'draft',eyebrow:'OUR PARTNERS',heading:'Built through strong partnerships',
    description:'We work closely with clients, consultants, suppliers, and skilled trades to deliver dependable construction work.',
    visible:true,status:'draft',publishedAt:null,updatedAt:null
  }:null;
  return {
    id:record.id,recordType:record.record_type,eyebrow:record.eyebrow||'',heading:record.heading||'',
    description:record.description||'',visible:Boolean(record.is_visible),status:record.record_type,
    publishedAt:record.published_at,updatedAt:record.updated_at
  };
}

async function normalizeItem(record) {
  const logoAsset=await getMediaAsset(record.logo_asset_id);
  return {
    id:record.logo_key,logoKey:record.logo_key,rowId:record.id,organizationName:record.organization_name||'',
    logoAssetId:record.logo_asset_id||'',logoAsset,logo:await getMediaPublicUrl(logoAsset),altText:record.alt_text||'',
    order:Number(record.sort_order)+1,visible:Boolean(record.is_visible),status:record.record_type,
    publishedAt:record.published_at,updatedAt:record.updated_at,
    usage:record.record_type==='published'?['Logo Bridge (published)']:['Logo Bridge (draft)']
  };
}

function itemPayload(data,logoKey) {
  return {
    logo_key:logoKey,record_type:'draft',organization_name:String(data.organizationName||'').trim(),
    logo_asset_id:data.logoAssetId||null,alt_text:String(data.altText||'').trim()||null,
    sort_order:Math.max(0,Number(data.order||1)-1),is_visible:data.visible!==false
  };
}

async function getSettings(type) {
  const client=await getSupabaseClient();
  const {data,error}=await client.from('logo_bridge_settings').select(SETTINGS_COLUMNS).eq('record_type',type).maybeSingle();
  if (error) throw error;
  return normalizeSettings(data,type);
}

async function getItems(type,visibleOnly=false) {
  const client=await getSupabaseClient();
  let query=client.from('logo_bridge_items').select(ITEM_COLUMNS).eq('record_type',type).order('sort_order',{ascending:true});
  if (visibleOnly) query=query.eq('is_visible',true);
  const {data,error}=await query;
  if (error) throw error;
  return Promise.all((data||[]).map(normalizeItem));
}

export const getLogoBridgeDraftSettings=()=>getSettings('draft');
export const getPublishedLogoBridgeSettings=()=>getSettings('published');

export async function getLogoBridgeDraftItems() {
  const [drafts,published]=await Promise.all([getItems('draft'),getItems('published')]);
  const live=new Set(published.map((item)=>item.logoKey));
  return drafts.map((item)=>({...item,status:live.has(item.logoKey)?'published':'draft',isPublished:live.has(item.logoKey),usage:[`Logo Bridge (draft${live.has(item.logoKey)?' + published':''})`]}));
}

export const getPublishedLogoBridgeItems=()=>getItems('published',true);

export async function saveLogoBridgeDraftSettings(data) {
  const client=await getSupabaseClient();
  const payload={
    record_type:'draft',eyebrow:String(data.eyebrow||'').trim()||'OUR PARTNERS',
    heading:String(data.heading||'').trim()||'Built through strong partnerships',
    description:String(data.description||'').trim()||null,is_visible:data.visible!==false
  };
  const {data:row,error}=await client.from('logo_bridge_settings').upsert(payload,{onConflict:'record_type'}).select(SETTINGS_COLUMNS).single();
  if (error) throw error;
  return normalizeSettings(row,'draft');
}

export async function createLogoBridgeDraftItem(data) {
  const logoKey=normalizeLogoKey(data.logoKey);
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('logo_bridge_items').upsert(itemPayload(data,logoKey),{onConflict:'logo_key,record_type'}).select(ITEM_COLUMNS).single();
  if (error) throw error;
  return normalizeItem(row);
}

export async function updateLogoBridgeDraftItem(logoKey,data) {
  const key=normalizeLogoKey(logoKey||data.logoKey);
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('logo_bridge_items').upsert(itemPayload(data,key),{onConflict:'logo_key,record_type'}).select(ITEM_COLUMNS).single();
  if (error) throw error;
  return normalizeItem(row);
}

export async function duplicateLogoBridgeDraftItem(logoKey) {
  const items=await getLogoBridgeDraftItems();
  const source=items.find((item)=>item.logoKey===logoKey);
  if (!source) throw new Error('Logo draft not found.');
  return createLogoBridgeDraftItem({...source,logoKey:createLogoKey(),organizationName:`${source.organizationName} (copy)`,order:items.length+1,status:'draft'});
}

export async function deleteLogoBridgeDraftItem(logoKey) {
  const client=await getSupabaseClient();
  const {error}=await client.from('logo_bridge_items').delete().eq('logo_key',logoKey).eq('record_type','draft');
  if (error) throw error;
  const remaining=await getItems('draft');
  for(let index=0;index<remaining.length;index+=1){
    const {error:orderError}=await client.from('logo_bridge_items').update({sort_order:index}).eq('logo_key',remaining[index].logoKey).eq('record_type','draft');
    if(orderError)throw orderError;
  }
}

export async function deleteLogoBridgeItemCompletely(logoKey) {
  const client=await getSupabaseClient();
  const {error}=await client.from('logo_bridge_items').delete().eq('logo_key',logoKey);
  if (error) throw error;
  const remaining=await getItems('draft');
  for(let index=0;index<remaining.length;index+=1){
    const {error:orderError}=await client.from('logo_bridge_items').update({sort_order:index}).eq('logo_key',remaining[index].logoKey).eq('record_type','draft');
    if(orderError)throw orderError;
  }
}

export async function reorderLogoBridgeDraftItems(logoKeys) {
  const client=await getSupabaseClient();
  for (let index=0;index<logoKeys.length;index+=1) {
    const {error}=await client.from('logo_bridge_items').update({sort_order:index}).eq('logo_key',logoKeys[index]).eq('record_type','draft');
    if (error) throw error;
  }
  return getLogoBridgeDraftItems();
}

export async function publishLogoBridge() {
  const client=await getSupabaseClient();
  const {error}=await client.rpc('publish_logo_bridge');
  if (error) throw error;
  const [settings,items]=await Promise.all([getPublishedLogoBridgeSettings(),getPublishedLogoBridgeItems()]);
  return {settings,items};
}

export async function unpublishLogoBridge() {
  const client=await getSupabaseClient();
  const {error}=await client.rpc('unpublish_logo_bridge');
  if (error) throw error;
  return getPublishedLogoBridgeSettings();
}
