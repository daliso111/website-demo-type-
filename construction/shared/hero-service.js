import { getSupabaseClient } from './supabase-client.js';
import { getMediaAsset, getMediaPublicUrl } from './homepage-media-service.js';

const COLUMNS = 'id,record_type,heading,background_video_asset_id,poster_asset_id,poster_alt_text,video_enabled,loop_enabled,mobile_video_enabled,playback_rate,is_visible,published_at,created_at,updated_at,updated_by';

async function normalize(record) {
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
    id: record.id,
    recordType: record.record_type,
    heading: record.heading || '',
    backgroundVideoAssetId: record.background_video_asset_id || '',
    posterAssetId: record.poster_asset_id || '',
    posterAltText: record.poster_alt_text || '',
    videoEnabled: record.video_enabled !== false,
    loopEnabled: record.loop_enabled !== false,
    mobileVideoEnabled: record.mobile_video_enabled !== false,
    playbackRate: Number(record.playback_rate || 1),
    isVisible: record.is_visible,
    status: record.record_type,
    publishedAt: record.published_at,
    updatedAt: record.updated_at,
    media: { videoAsset, posterAsset, videoUrl, posterUrl }
  };
}

function payload(data) {
  return {
    record_type: 'draft',
    heading: data.heading?.trim() || null,
    background_video_asset_id: data.backgroundVideoAssetId || null,
    poster_asset_id: data.posterAssetId || null,
    poster_alt_text: data.posterAltText?.trim() || null,
    video_enabled: data.videoEnabled !== false && Boolean(data.backgroundVideoAssetId),
    loop_enabled: Boolean(data.loopEnabled),
    mobile_video_enabled: Boolean(data.mobileVideoEnabled),
    playback_rate: Number(data.playbackRate || 1),
    is_visible: Boolean(data.isVisible)
  };
}

async function getByType(type) {
  const client = await getSupabaseClient();
  let query = client.from('hero_settings').select(COLUMNS).eq('record_type', type);
  if (type === 'published') query = query.eq('is_visible', true);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return normalize(data);
}

export const getHeroDraft = () => getByType('draft');
export const getPublishedHero = () => getByType('published');

export async function saveHeroDraft(data) {
  const client = await getSupabaseClient();
  const { data: record, error } = await client.from('hero_settings').upsert(payload(data), { onConflict: 'record_type' }).select(COLUMNS).single();
  if (error) throw error;
  return normalize(record);
}

export async function publishHero() {
  const client = await getSupabaseClient();
  const { data, error } = await client.rpc('publish_hero_draft');
  if (error) throw error;
  return normalize(data);
}

export async function unpublishHero() {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('hero_settings').update({ is_visible: false }).eq('record_type', 'published').select(COLUMNS).maybeSingle();
  if (error) throw error;
  return normalize(data);
}

export async function updateHeroDraftVisibility(isVisible) {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('hero_settings').update({ is_visible: Boolean(isVisible) }).eq('record_type', 'draft').select(COLUMNS).single();
  if (error) throw error;
  return normalize(data);
}
