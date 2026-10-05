import { getSupabaseClient } from './supabase-client.js';
import { getMediaAsset, getMediaPublicUrl } from './homepage-media-service.js';

const SETTINGS_COLUMNS = 'id,record_type,eyebrow,heading,introduction,background_video_asset_id,poster_asset_id,video_enabled,loop_enabled,mobile_video_enabled,overlay_opacity,playback_rate,reduced_motion_fallback,is_visible,published_at,created_by,updated_by,created_at,updated_at';
const STAT_COLUMNS = 'id,statistic_key,record_type,value,prefix,suffix,description,sort_order,is_visible,published_at,created_by,updated_by,created_at,updated_at';

async function normalizeSettings(record) {
  if (!record) return null;
  const [videoAsset, posterAsset] = await Promise.all([
    getMediaAsset(record.background_video_asset_id),
    getMediaAsset(record.poster_asset_id)
  ]);
  const [videoUrl, posterUrl] = await Promise.all([
    getMediaPublicUrl(videoAsset),
    getMediaPublicUrl(posterAsset)
  ]);
  return {
    id:record.id,
    recordType:record.record_type,
    eyebrow:record.eyebrow || '',
    heading:record.heading || '',
    introduction:record.introduction || '',
    backgroundVideoAssetId:record.background_video_asset_id || '',
    posterAssetId:record.poster_asset_id || '',
    videoEnabled:record.video_enabled !== false,
    loopEnabled:record.loop_enabled !== false,
    mobileVideoEnabled:record.mobile_video_enabled === true,
    overlayOpacity:Number(record.overlay_opacity ?? 0.72),
    playbackRate:Number(record.playback_rate ?? 0.75),
    reducedMotionFallback:record.reduced_motion_fallback || 'poster',
    isVisible:record.is_visible !== false,
    status:record.record_type,
    publishedAt:record.published_at,
    createdAt:record.created_at,
    updatedAt:record.updated_at,
    media:{ videoAsset, posterAsset, videoUrl, posterUrl }
  };
}

function settingsPayload(data) {
  return {
    record_type:'draft',
    eyebrow:data.eyebrow?.trim() || null,
    heading:data.heading?.trim() || null,
    introduction:data.introduction?.trim() || null,
    background_video_asset_id:data.backgroundVideoAssetId || null,
    poster_asset_id:data.posterAssetId || null,
    video_enabled:data.videoEnabled !== false,
    loop_enabled:data.loopEnabled !== false,
    mobile_video_enabled:data.mobileVideoEnabled === true,
    overlay_opacity:Number(data.overlayOpacity ?? 0.72),
    playback_rate:Number(data.playbackRate ?? 0.75),
    reduced_motion_fallback:data.reducedMotionFallback || 'poster',
    is_visible:data.isVisible !== false
  };
}

function normalizeStatistic(record) {
  return {
    id:record.statistic_key,
    databaseId:record.id,
    recordType:record.record_type,
    value:record.value || '',
    prefix:record.prefix || '',
    suffix:record.suffix || '',
    description:record.description || '',
    order:Number(record.sort_order || 0),
    visible:record.is_visible !== false,
    status:record.record_type,
    publishedAt:record.published_at,
    updatedAt:record.updated_at
  };
}

async function getSettingsByType(recordType) {
  const client = await getSupabaseClient();
  let query = client.from('business_snapshot_settings').select(SETTINGS_COLUMNS).eq('record_type',recordType);
  if (recordType === 'published') query = query.eq('is_visible',true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return normalizeSettings(data);
}

export const getBusinessSnapshotDraft = () => getSettingsByType('draft');
export const getPublishedBusinessSnapshot = () => getSettingsByType('published');

export async function saveBusinessSnapshotDraft(data) {
  const client = await getSupabaseClient();
  const { data:record, error } = await client.from('business_snapshot_settings')
    .upsert(settingsPayload(data),{ onConflict:'record_type' }).select(SETTINGS_COLUMNS).single();
  if (error) throw error;
  return normalizeSettings(record);
}

export async function publishBusinessSnapshot() {
  const client = await getSupabaseClient();
  const { data, error } = await client.rpc('publish_business_snapshot');
  if (error) throw error;
  return normalizeSettings(data);
}

export async function unpublishBusinessSnapshot() {
  const client = await getSupabaseClient();
  const { data, error } = await client.rpc('unpublish_business_snapshot');
  if (error) throw error;
  return normalizeSettings(data);
}

export async function getBusinessSnapshotStatistics(recordType = 'draft') {
  const client = await getSupabaseClient();
  let query = client.from('business_snapshot_statistics').select(STAT_COLUMNS).eq('record_type',recordType);
  if (recordType === 'published') query = query.eq('is_visible',true);
  const { data, error } = await query.order('sort_order',{ ascending:true });
  if (error) throw error;
  return (data || []).map(normalizeStatistic);
}

export async function saveBusinessSnapshotStatistics(items) {
  const client = await getSupabaseClient();
  const normalized = (items || []).map((item,index) => ({
    statistic_key:String(item.id || crypto.randomUUID()),
    record_type:'draft',
    value:String(item.value || ''),
    prefix:String(item.prefix || '') || null,
    suffix:String(item.suffix || '') || null,
    description:String(item.description || '') || null,
    sort_order:index + 1,
    is_visible:item.visible !== false
  }));
  const { data:existing, error:readError } = await client.from('business_snapshot_statistics')
    .select('statistic_key').eq('record_type','draft');
  if (readError) throw readError;
  if (normalized.length) {
    const { error:upsertError } = await client.from('business_snapshot_statistics')
      .upsert(normalized,{ onConflict:'statistic_key,record_type' });
    if (upsertError) throw upsertError;
  }
  const retained = new Set(normalized.map((item) => item.statistic_key));
  const removed = (existing || []).map((item) => item.statistic_key).filter((key) => !retained.has(key));
  if (removed.length) {
    const { error:deleteError } = await client.from('business_snapshot_statistics')
      .delete().eq('record_type','draft').in('statistic_key',removed);
    if (deleteError) throw deleteError;
  }
  return getBusinessSnapshotStatistics('draft');
}
