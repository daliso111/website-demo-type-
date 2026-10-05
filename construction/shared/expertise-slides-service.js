import { getSupabaseClient } from './supabase-client.js';
import { getMediaAsset, getMediaPublicUrl } from './homepage-media-service.js';

const SETTINGS_COLUMNS='id,record_type,section_label,is_visible,published_at,created_by,updated_by,created_at,updated_at';
const SLIDE_COLUMNS='id,slide_key,record_type,eyebrow,heading,description,cta_label,cta_url,background_image_asset_id,image_alt,focal_x,focal_y,overlay_opacity,sort_order,is_visible,published_at,created_by,updated_by,created_at,updated_at';
const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createSlideKey() {
  if (typeof globalThis.crypto?.randomUUID==='function') return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(character)=>{
    const random=Math.floor(Math.random()*16);
    return (character==='x'?random:(random&0x3)|0x8).toString(16);
  });
}

function normalizeSlideKey(value) {
  const key=String(value||'');
  return UUID_PATTERN.test(key)?key:createSlideKey();
}

function normalizeSettings(record,type='draft') {
  if (!record) {
    return type==='draft'?{ id:'',recordType:'draft',sectionLabel:'OUR EXPERTISE',visible:true,status:'draft',publishedAt:null,updatedAt:null }:null;
  }
  return {
    id:record.id,
    recordType:record.record_type,
    sectionLabel:record.section_label||'OUR EXPERTISE',
    visible:Boolean(record.is_visible),
    status:record.record_type,
    publishedAt:record.published_at,
    updatedAt:record.updated_at
  };
}

async function normalizeSlide(record) {
  const imageAsset=await getMediaAsset(record.background_image_asset_id);
  const heading=record.heading||'';
  return {
    id:record.slide_key,
    slideKey:record.slide_key,
    rowId:record.id,
    eyebrow:record.eyebrow||'',
    heading,
    title:heading,
    description:record.description||'',
    ctaLabel:record.cta_label||'',
    ctaUrl:record.cta_url||'',
    buttonLabel:record.cta_label||'',
    buttonUrl:record.cta_url||'',
    backgroundImageAssetId:record.background_image_asset_id||'',
    imageAssetId:record.background_image_asset_id||'',
    imageAsset,
    image:await getMediaPublicUrl(imageAsset),
    imageAlt:record.image_alt||'',
    focalX:Number(record.focal_x??50),
    focalY:Number(record.focal_y??50),
    overlayOpacity:Number(record.overlay_opacity??.45),
    order:Number(record.sort_order)+1,
    visible:Boolean(record.is_visible),
    status:record.record_type,
    publishedAt:record.published_at,
    updatedAt:record.updated_at
  };
}

function slidePayload(data,slideKey) {
  return {
    slide_key:slideKey,
    record_type:'draft',
    eyebrow:String(data.eyebrow||'').trim()||null,
    heading:String(data.heading??data.title??'').trim(),
    description:String(data.description||'').trim()||null,
    cta_label:String(data.ctaLabel??data.buttonLabel??'').trim()||null,
    cta_url:String(data.ctaUrl??data.buttonUrl??'').trim()||null,
    background_image_asset_id:data.backgroundImageAssetId||data.imageAssetId||null,
    image_alt:String(data.imageAlt||'').trim()||null,
    focal_x:Number.isFinite(Number(data.focalX))?Number(data.focalX):50,
    focal_y:Number.isFinite(Number(data.focalY))?Number(data.focalY):50,
    overlay_opacity:Number.isFinite(Number(data.overlayOpacity))?Number(data.overlayOpacity):.45,
    sort_order:Math.max(0,Number(data.order||1)-1),
    is_visible:data.visible!==false
  };
}

async function getSettings(type) {
  const client=await getSupabaseClient();
  const {data,error}=await client.from('expertise_section_settings').select(SETTINGS_COLUMNS).eq('record_type',type).maybeSingle();
  if (error) throw error;
  return normalizeSettings(data,type);
}

async function getSlides(type,visibleOnly=false) {
  const client=await getSupabaseClient();
  let query=client.from('expertise_slides').select(SLIDE_COLUMNS).eq('record_type',type).order('sort_order',{ascending:true});
  if (visibleOnly) query=query.eq('is_visible',true);
  const {data,error}=await query;
  if (error) throw error;
  return Promise.all((data||[]).map(normalizeSlide));
}

export const getExpertiseSectionDraft=()=>getSettings('draft');
export const getPublishedExpertiseSection=()=>getSettings('published');

export async function getExpertiseSlideDrafts() {
  const [drafts,published]=await Promise.all([getSlides('draft'),getSlides('published')]);
  const live=new Set(published.map((slide)=>slide.slideKey));
  return drafts.map((slide)=>({...slide,status:live.has(slide.slideKey)?'published':'draft',isPublished:live.has(slide.slideKey)}));
}

export const getPublishedExpertiseSlides=()=>getSlides('published',true);

export async function saveExpertiseSectionDraft(data) {
  const client=await getSupabaseClient();
  const payload={record_type:'draft',section_label:String(data.sectionLabel||'').trim()||'OUR EXPERTISE',is_visible:data.visible!==false};
  const {data:row,error}=await client.from('expertise_section_settings').upsert(payload,{onConflict:'record_type'}).select(SETTINGS_COLUMNS).single();
  if (error) throw error;
  return normalizeSettings(row,'draft');
}

export async function createExpertiseSlideDraft(data) {
  const slideKey=normalizeSlideKey(data.slideKey);
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('expertise_slides').upsert(slidePayload(data,slideKey),{onConflict:'slide_key,record_type'}).select(SLIDE_COLUMNS).single();
  if (error) throw error;
  return normalizeSlide(row);
}

export async function updateExpertiseSlideDraft(slideKey,data) {
  const key=normalizeSlideKey(slideKey||data.slideKey);
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('expertise_slides').upsert(slidePayload(data,key),{onConflict:'slide_key,record_type'}).select(SLIDE_COLUMNS).single();
  if (error) throw error;
  return normalizeSlide(row);
}

export async function duplicateExpertiseSlideDraft(slideKey) {
  const slides=await getExpertiseSlideDrafts();
  const source=slides.find((slide)=>slide.slideKey===slideKey);
  if (!source) throw new Error('Expertise slide draft not found.');
  return createExpertiseSlideDraft({...source,slideKey:createSlideKey(),heading:`${source.heading} (copy)`,order:slides.length+1,status:'draft'});
}

export async function deleteExpertiseSlideDraft(slideKey) {
  const client=await getSupabaseClient();
  const {error}=await client.from('expertise_slides').delete().eq('slide_key',slideKey).eq('record_type','draft');
  if (error) throw error;
}

export async function deleteExpertiseSlideCompletely(slideKey) {
  const client=await getSupabaseClient();
  const {error}=await client.from('expertise_slides').delete().eq('slide_key',slideKey);
  if (error) throw error;
}

export async function reorderExpertiseSlideDrafts(slideKeys) {
  const client=await getSupabaseClient();
  for (let index=0;index<slideKeys.length;index+=1) {
    const {error}=await client.from('expertise_slides').update({sort_order:index}).eq('slide_key',slideKeys[index]).eq('record_type','draft');
    if (error) throw error;
  }
  return getExpertiseSlideDrafts();
}

export async function publishExpertiseSection() {
  const client=await getSupabaseClient();
  const {error}=await client.rpc('publish_expertise_section');
  if (error) throw error;
  const [settings,slides]=await Promise.all([getPublishedExpertiseSection(),getPublishedExpertiseSlides()]);
  return {settings,slides};
}

export async function unpublishExpertiseSection() {
  const client=await getSupabaseClient();
  const {error}=await client.rpc('unpublish_expertise_section');
  if (error) throw error;
  return getPublishedExpertiseSection();
}
