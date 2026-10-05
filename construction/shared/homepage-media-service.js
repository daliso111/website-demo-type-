import { getSupabaseClient, getSupabaseConfiguration } from './supabase-client.js';

export const HOMEPAGE_MEDIA_BUCKET = 'homepage-media';
export const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
export const MAX_HERO_VIDEO_BYTES = 49 * 1024 * 1024;
export const MAX_PROJECT_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_NEWS_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_EXPERTISE_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_LOGO_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_SNAPSHOT_VIDEO_BYTES = 49 * 1024 * 1024;
export const MAX_SNAPSHOT_POSTER_BYTES = 8 * 1024 * 1024;
const TUS_CLIENT_URL = 'https://cdn.jsdelivr.net/npm/tus-js-client@4.3.1/+esm';
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const COLUMNS = 'id,bucket_name,storage_path,original_filename,media_type,mime_type,size_bytes,width,height,duration_seconds,alt_text,is_public,created_by,created_at,updated_at';
const RESUME_PATH_PREFIX = 'hilltop.hero-video-upload.v1:';
let activeVideoUpload = null;
let activeSnapshotVideoUpload = null;
const SNAPSHOT_RESUME_PATH_PREFIX = 'hilltop.business-snapshot-video-upload.v1:';

function cleanName(name) {
  return name.replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'video';
}

function extension(file) {
  return ({ 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/avif':'avif', 'video/mp4':'mp4', 'video/webm':'webm' })[file.type];
}

function uniquePath(file, folder) {
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${cleanName(file.name)}.${extension(file)}`;
}

function resumeKey(file) {
  return `${RESUME_PATH_PREFIX}${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

function savedResumePath(file) {
  try { return localStorage.getItem(resumeKey(file)); } catch { return null; }
}

function rememberResumePath(file, path) {
  try { localStorage.setItem(resumeKey(file), path); } catch { /* TUS can still upload without persisted path metadata. */ }
}

function forgetResumePath(file) {
  try { localStorage.removeItem(resumeKey(file)); } catch { /* Best effort only. */ }
}

function deriveResumableEndpoint(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error('The configured Supabase URL is invalid.'); }
  const projectRef = parsed.hostname.split('.')[0];
  if (!projectRef) throw new Error('The Supabase project reference could not be derived from the configured URL.');
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

function uploadErrorStatus(error) {
  try { return error?.originalResponse?.getStatus?.() || 0; } catch { return 0; }
}

function emitState(context, state, changes = {}) {
  context.state = state;
  Object.assign(context, changes);
  context.options.onStateChange?.({ state, storagePath:context.storagePath, file:context.file, ...changes });
}

function emitProgress(context, bytesUploaded, bytesTotal) {
  const now = performance.now();
  const elapsed = Math.max((now - context.progressTime) / 1000, 0.001);
  const speedBps = context.hasProgressSample ? Math.max(0, (bytesUploaded - context.progressBytes) / elapsed) : 0;
  const etaSeconds = speedBps > 0 ? Math.max(0, (bytesTotal - bytesUploaded) / speedBps) : null;
  context.progressTime = now;
  context.progressBytes = bytesUploaded;
  context.hasProgressSample = true;
  context.options.onProgress?.({ bytesUploaded, bytesTotal, percentage:bytesTotal ? bytesUploaded / bytesTotal * 100 : 0, speedBps, etaSeconds });
}

async function requireAdminSession(client) {
  const { data:{ session }, error } = await client.auth.getSession();
  if (error) throw error;
  if (!session?.access_token) {
    const authError = new Error('Your administrator session has expired. Sign in again before uploading.');
    authError.code = 'AUTH_REQUIRED';
    throw authError;
  }
  return session;
}

async function cleanupUploadedObject(client, storagePath) {
  const { error } = await client.storage.from(HOMEPAGE_MEDIA_BUCKET).remove([storagePath]);
  if (error) {
    console.error('Homepage media cleanup failed; orphaned Storage path:', storagePath, error);
    return false;
  }
  console.info('Homepage media cleanup completed:', storagePath);
  return true;
}

export async function createMediaAsset(metadata) {
  const client = await getSupabaseClient();
  const { data, error } = await client.from('media_assets').insert(metadata).select(COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function getMediaAsset(id) {
  if (!id) return null;
  const client = await getSupabaseClient();
  const { data, error } = await client.from('media_assets').select(COLUMNS).eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMediaPublicUrl(asset) {
  if (!asset) return '';
  const client = await getSupabaseClient();
  return client.storage.from(asset.bucket_name).getPublicUrl(asset.storage_path).data.publicUrl;
}

export async function getHomepageImageAssets() {
  const client = await getSupabaseClient();
  const { data:assets, error } = await client.from('media_assets').select(COLUMNS).eq('media_type', 'image').order('created_at', { ascending:false });
  if (error) throw error;
  if (!assets?.length) return [];

  const usageByAsset = new Map();
  const ids=assets.map((asset) => asset.id);
  const [projectResult,newsResult,expertiseResult,logoResult]=await Promise.all([
    client.from('featured_projects').select('project_key,record_type,title,image_asset_id').in('image_asset_id',ids),
    client.from('news_articles').select('article_key,record_type,title,image_asset_id').in('image_asset_id',ids),
    client.from('expertise_slides').select('slide_key,record_type,heading,background_image_asset_id').in('background_image_asset_id',ids),
    client.from('logo_bridge_items').select('logo_key,record_type,organization_name,logo_asset_id').in('logo_asset_id',ids)
  ]);
  if (projectResult.error) console.warn('[Media Library] Project usage could not be loaded:', projectResult.error);
  else (projectResult.data || []).forEach((project) => {
    const usage = usageByAsset.get(project.image_asset_id) || [];
    usage.push(`${project.title || 'Untitled project'} (${project.record_type})`);
    usageByAsset.set(project.image_asset_id, usage);
  });
  if(newsResult.error)console.warn('[Media Library] News usage could not be loaded:',newsResult.error);
  else(newsResult.data||[]).forEach((article)=>{
    const usage=usageByAsset.get(article.image_asset_id)||[];
    usage.push(`${article.title||'Untitled news article'} (${article.record_type})`);
    usageByAsset.set(article.image_asset_id,usage);
  });
  if(expertiseResult.error)console.warn('[Media Library] Expertise usage could not be loaded:',expertiseResult.error);
  else(expertiseResult.data||[]).forEach((slide)=>{
    const usage=usageByAsset.get(slide.background_image_asset_id)||[];
    usage.push(`${slide.heading||'Untitled Expertise slide'} (${slide.record_type})`);
    usageByAsset.set(slide.background_image_asset_id,usage);
  });
  if(logoResult.error)console.warn('[Media Library] Logo Bridge usage could not be loaded:',logoResult.error);
  else(logoResult.data||[]).forEach((logo)=>{
    const usage=usageByAsset.get(logo.logo_asset_id)||[];
    usage.push(`${logo.organization_name||'Untitled logo'} (${logo.record_type})`);
    usageByAsset.set(logo.logo_asset_id,usage);
  });

  return Promise.all(assets.map(async (asset) => ({
    ...asset,
    publicUrl:await getMediaPublicUrl(asset),
    usedBy:usageByAsset.get(asset.id) || []
  })));
}

export async function getNewsArticleImageAssets() {
  const assets=await getHomepageImageAssets();
  return assets.map((asset)=>({
    ...asset,
    preferred:asset.storage_path?.startsWith('news-foresight/images/')||false
  })).sort((left,right)=>Number(right.preferred)-Number(left.preferred));
}

export async function getExpertiseSlideImageAssets() {
  const assets=await getHomepageImageAssets();
  return assets.map((asset)=>({
    ...asset,
    preferred:asset.storage_path?.startsWith('expertise/images/')||false
  })).sort((left,right)=>Number(right.preferred)-Number(left.preferred));
}

export async function getLogoBridgeImageAssets() {
  const assets=await getHomepageImageAssets();
  return assets.map((asset)=>({
    ...asset,
    preferred:asset.storage_path?.startsWith('logo-bridge/logos/')||false
  })).sort((left,right)=>Number(right.preferred)-Number(left.preferred));
}

export async function getBusinessSnapshotMediaAssets(kind) {
  if (!['video','poster'].includes(kind)) throw new Error('Choose either Business Snapshot video or poster assets.');
  const client = await getSupabaseClient();
  let query = client.from('media_assets').select(COLUMNS);
  query = kind === 'video' ? query.eq('media_type','video') : query.in('media_type',['poster','image']);
  const { data, error } = await query.order('created_at',{ ascending:false });
  if (error) throw error;
  const assets = await Promise.all((data || []).map(async (asset) => ({
    ...asset,
    publicUrl:await getMediaPublicUrl(asset),
    preferred:asset.storage_path?.startsWith('business-snapshot/') || false
  })));
  return assets.sort((left,right) => Number(right.preferred)-Number(left.preferred));
}

export async function updateMediaMetadata(id, changes) {
  const allowed = Object.fromEntries(Object.entries(changes).filter(([key]) => ['alt_text','width','height','duration_seconds','is_public'].includes(key)));
  const client = await getSupabaseClient();
  const { data, error } = await client.from('media_assets').update(allowed).eq('id', id).select(COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function isMediaAssetInUse(id) {
  const client = await getSupabaseClient();
  const [heroResult,snapshotResult,projectResult,newsResult,expertiseResult] = await Promise.all([
    client.from('hero_settings').select('id').or(`background_video_asset_id.eq.${id},poster_asset_id.eq.${id}`).limit(1),
    client.from('business_snapshot_settings').select('id').or(`background_video_asset_id.eq.${id},poster_asset_id.eq.${id}`).limit(1),
    client.from('featured_projects').select('id').eq('image_asset_id',id).limit(1),
    client.from('news_articles').select('id').eq('image_asset_id',id).limit(1),
    client.from('expertise_slides').select('id').eq('background_image_asset_id',id).limit(1)
  ]);
  if (heroResult.error) throw heroResult.error;
  if (snapshotResult.error) throw snapshotResult.error;
  if(projectResult.error)throw projectResult.error;
  if(newsResult.error)throw newsResult.error;
  if(expertiseResult.error)throw expertiseResult.error;
  return heroResult.data.length>0||snapshotResult.data.length>0||projectResult.data.length>0||newsResult.data.length>0||expertiseResult.data.length>0;
}

export async function deleteMediaAsset(id) {
  const asset = await getMediaAsset(id);
  if (!asset) return;
  if (await isMediaAssetInUse(id)) throw new Error('This media asset is used by draft or published homepage content. Remove it from that content before deleting it.');
  const client = await getSupabaseClient();
  const { error:storageError } = await client.storage.from(asset.bucket_name).remove([asset.storage_path]);
  if (storageError) throw storageError;
  const { error } = await client.from('media_assets').delete().eq('id', id);
  if (error) throw error;
}

async function buildTusUpload(context) {
  const [{ Upload }, client, config] = await Promise.all([import(TUS_CLIENT_URL), getSupabaseClient(), getSupabaseConfiguration()]);
  if (!config.configured) throw new Error('Supabase is not configured.');
  context.client = client;
  context.session = await requireAdminSession(client);
  context.endpoint = deriveResumableEndpoint(config.url);

  context.upload = new Upload(context.file, {
    endpoint: context.endpoint,
    retryDelays: [0, 3000, 5000, 10000, 20000],
    headers: { authorization:`Bearer ${context.session.access_token}`, 'x-upsert':'false' },
    metadata: { bucketName:HOMEPAGE_MEDIA_BUCKET, objectName:context.storagePath, contentType:context.file.type, cacheControl:'3600' },
    uploadDataDuringCreation: true,
    removeFingerprintOnSuccess: true,
    chunkSize: TUS_CHUNK_SIZE,
    onProgress: (uploaded, total) => emitProgress(context, uploaded, total),
    onError: (error) => handleTusError(context, error),
    onSuccess: () => finishTusUpload(context)
  });
}

async function handleTusError(context, error) {
  const status = uploadErrorStatus(error);
  if ((status === 401 || status === 403) && !context.tokenRefreshAttempted) {
    context.tokenRefreshAttempted = true;
    try {
      const session = await requireAdminSession(context.client);
      context.upload.options.headers.authorization = `Bearer ${session.access_token}`;
      emitState(context, 'Resuming', { message:'Session refreshed. Resuming upload…' });
      context.upload.start();
      return;
    } catch (sessionError) {
      sessionError.code = 'AUTH_REQUIRED';
      emitState(context, 'Failed', { error:sessionError, message:sessionError.message });
      context.reject(sessionError);
      activeVideoUpload = null;
      return;
    }
  }
  context.lastError = error;
  emitState(context, 'Failed', { error, message:error?.message || 'The resumable video upload failed.' });
}

async function finishTusUpload(context) {
  emitState(context, 'Processing metadata', { message:'Registering uploaded video…' });
  try {
    const asset = await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,
      storage_path:context.storagePath,
      original_filename:context.file.name,
      media_type:'video',
      mime_type:context.file.type,
      size_bytes:context.file.size,
      width:context.options.width || null,
      height:context.options.height || null,
      duration_seconds:context.options.durationSeconds || null,
      is_public:true
    });
    const publicUrl = await getMediaPublicUrl(asset);
    forgetResumePath(context.file);
    emitProgress(context, context.file.size, context.file.size);
    emitState(context, 'Complete', { asset, publicUrl, message:'Video upload complete.' });
    context.resolve({ asset, publicUrl });
    activeVideoUpload = null;
  } catch (error) {
    const cleaned = await cleanupUploadedObject(context.client, context.storagePath);
    if (cleaned) {
      forgetResumePath(context.file);
      context.storagePath = uniquePath(context.file, 'hero/videos');
      rememberResumePath(context.file, context.storagePath);
    }
    const wrapped = new Error(`Video uploaded, but media metadata could not be saved. Cleanup ${cleaned ? 'succeeded' : 'failed'}. ${error.message}`);
    context.lastError = wrapped;
    context.needsNewUpload = true;
    emitState(context, 'Failed', { error:wrapped, message:wrapped.message });
  }
}

async function startOrResumeTus(context) {
  emitState(context, 'Preparing upload', { message:'Preparing resumable upload…' });
  await buildTusUpload(context);
  const previousUploads = await context.upload.findPreviousUploads();
  if (previousUploads.length) {
    context.upload.resumeFromPreviousUpload(previousUploads[0]);
    emitState(context, 'Resuming', { message:'Resuming previous upload…' });
  } else {
    emitState(context, 'Uploading', { message:'Uploading video…' });
  }
  context.progressTime = performance.now();
  context.progressBytes = 0;
  context.hasProgressSample = false;
  context.upload.start();
}

export function validateHeroVideoFile(file) {
  if (!file) throw new Error('Choose a Hero video to upload.');
  if (!VIDEO_TYPES.has(file.type)) throw new Error('Hero video must be an MP4 or WebM file.');
  if (file.size <= 0) throw new Error('The selected video is empty.');
  if (file.size > MAX_HERO_VIDEO_BYTES) throw new Error('This video exceeds the current 49 MB Hero upload limit. Compress the video or increase the Supabase Storage limit before uploading.');
  return true;
}

export function uploadHeroVideoResumable(file, options = {}) {
  try { validateHeroVideoFile(file); } catch (error) { return Promise.reject(error); }
  if (activeVideoUpload && !['Complete','Cancelled'].includes(activeVideoUpload.state)) return Promise.reject(new Error('Another Hero video upload is already active.'));

  return new Promise((resolve, reject) => {
    const context = {
      file, options, resolve, reject, state:'Validating', upload:null, client:null,
      storagePath:savedResumePath(file) || uniquePath(file, 'hero/videos'),
      tokenRefreshAttempted:false, lastError:null, needsNewUpload:false,
      progressTime:performance.now(), progressBytes:0, hasProgressSample:false
    };
    activeVideoUpload = context;
    rememberResumePath(file, context.storagePath);
    emitState(context, 'Validating', { message:'Validating selected video…' });
    startOrResumeTus(context).catch((error) => {
      context.lastError = error;
      emitState(context, 'Failed', { error, message:error.message });
      if (error.code === 'AUTH_REQUIRED') { reject(error); activeVideoUpload = null; }
    });
  });
}

export async function pauseHeroVideoUpload() {
  if (!activeVideoUpload?.upload || !['Uploading','Resuming'].includes(activeVideoUpload.state)) return false;
  await activeVideoUpload.upload.abort(false);
  emitState(activeVideoUpload, 'Paused', { message:'Upload paused.' });
  return true;
}

export function resumeHeroVideoUpload() {
  if (!activeVideoUpload?.upload || activeVideoUpload.state !== 'Paused') return false;
  emitState(activeVideoUpload, 'Resuming', { message:'Resuming upload…' });
  activeVideoUpload.progressTime = performance.now();
  activeVideoUpload.hasProgressSample = false;
  activeVideoUpload.upload.start();
  return true;
}

export async function cancelHeroVideoUpload() {
  const context = activeVideoUpload;
  if (!context) return false;
  try { await context.upload?.abort(true); }
  catch (error) { console.info('TUS termination was not confirmed; the unfinished upload can expire safely.', error.message); }
  forgetResumePath(context.file);
  const cancelled = new Error('Video upload cancelled.');
  cancelled.code = 'UPLOAD_CANCELLED';
  emitState(context, 'Cancelled', { message:cancelled.message });
  context.reject(cancelled);
  activeVideoUpload = null;
  return true;
}

export async function retryHeroVideoUpload() {
  const context = activeVideoUpload;
  if (!context || context.state !== 'Failed') return false;
  context.tokenRefreshAttempted = false;
  context.lastError = null;
  if (context.needsNewUpload || !context.upload) {
    context.needsNewUpload = false;
    await startOrResumeTus(context);
  } else {
    emitState(context, 'Resuming', { message:'Retrying upload…' });
    context.progressTime = performance.now();
    context.hasProgressSample = false;
    context.upload.start();
  }
  return true;
}

export function getHeroVideoUploadState() {
  return activeVideoUpload ? { state:activeVideoUpload.state, file:activeVideoUpload.file, storagePath:activeVideoUpload.storagePath } : null;
}

export async function uploadHomepageMedia(file, options = {}) {
  const mediaType = options.mediaType || (file?.type?.startsWith('video/') ? 'video' : 'poster');
  if (mediaType === 'video') return uploadHeroVideoResumable(file, options);
  if (mediaType !== 'poster') throw new Error('Only Hero video and poster uploads are supported.');
  if (!file || !IMAGE_TYPES.has(file.type)) throw new Error('Hero posters must be JPEG, PNG, WebP, or AVIF files.');
  if (!file.size) throw new Error('Hero poster images cannot be empty.');
  const path = uniquePath(file, 'hero/posters');
  const client = await getSupabaseClient();
  await requireAdminSession(client);
  options.onProgress?.(5);
  const { error:uploadError } = await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path, file, { contentType:file.type, cacheControl:'3600', upsert:false });
  if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);
  options.onProgress?.(85);
  try {
    const asset = await createMediaAsset({ bucket_name:HOMEPAGE_MEDIA_BUCKET, storage_path:path, original_filename:file.name, media_type:'poster', mime_type:file.type, size_bytes:file.size, width:options.width||null, height:options.height||null, duration_seconds:null, alt_text:options.altText||null, is_public:true });
    options.onProgress?.(100);
    return { asset, publicUrl:await getMediaPublicUrl(asset) };
  } catch (error) {
    const cleaned = await cleanupUploadedObject(client, path);
    throw new Error(`Poster metadata could not be saved. Cleanup ${cleaned ? 'succeeded' : 'failed'}. ${error.message}`);
  }
}

export async function uploadFeaturedProjectImage(file, options = {}) {
  if (!file || !IMAGE_TYPES.has(file.type)) throw new Error('Project images must be JPEG, PNG, WebP, or AVIF files.');
  if (!file.size || file.size > MAX_PROJECT_IMAGE_BYTES) throw new Error('Project images must be between 1 byte and 8 MB.');
  const path=uniquePath(file,'featured-projects/images');
  const client=await getSupabaseClient();await requireAdminSession(client);options.onProgress?.(5);
  const{error:uploadError}=await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
  if(uploadError)throw new Error(`Project image upload failed: ${uploadError.message}`);options.onProgress?.(85);
  try{const asset=await createMediaAsset({bucket_name:HOMEPAGE_MEDIA_BUCKET,storage_path:path,original_filename:file.name,media_type:'image',mime_type:file.type,size_bytes:file.size,width:options.width||null,height:options.height||null,duration_seconds:null,alt_text:options.altText||null,is_public:true});options.onProgress?.(100);return{asset,publicUrl:await getMediaPublicUrl(asset)};}
  catch(error){const cleaned=await cleanupUploadedObject(client,path);throw new Error(`Project image metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);}
}

export async function uploadNewsArticleImage(file,options={}) {
  if(!file||!IMAGE_TYPES.has(file.type))throw new Error('News images must be JPEG, PNG, WebP, or AVIF files.');
  if(!file.size||file.size>MAX_NEWS_IMAGE_BYTES)throw new Error('News images must be between 1 byte and 8 MB.');
  const path=uniquePath(file,'news-foresight/images');
  const client=await getSupabaseClient();
  await requireAdminSession(client);
  options.onProgress?.(5);
  const{error:uploadError}=await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
  if(uploadError)throw new Error(`News image upload failed: ${uploadError.message}`);
  options.onProgress?.(85);
  try {
    const asset=await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,storage_path:path,original_filename:file.name,
      media_type:'image',mime_type:file.type,size_bytes:file.size,width:options.width||null,
      height:options.height||null,duration_seconds:null,alt_text:options.altText||null,is_public:true
    });
    options.onProgress?.(100);
    return{asset,publicUrl:await getMediaPublicUrl(asset)};
  } catch(error) {
    const cleaned=await cleanupUploadedObject(client,path);
    throw new Error(`News image metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);
  }
}

export async function uploadExpertiseSlideImage(file,options={}) {
  if(!file||!IMAGE_TYPES.has(file.type))throw new Error('Expertise images must be JPEG, PNG, WebP, or AVIF files.');
  if(!file.size||file.size>MAX_EXPERTISE_IMAGE_BYTES)throw new Error('Expertise images must be between 1 byte and 8 MB.');
  const path=uniquePath(file,'expertise/images');
  const client=await getSupabaseClient();
  await requireAdminSession(client);
  options.onProgress?.(5);
  const {error:uploadError}=await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
  if(uploadError)throw new Error(`Expertise image upload failed: ${uploadError.message}`);
  options.onProgress?.(85);
  try {
    const asset=await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,storage_path:path,original_filename:file.name,
      media_type:'image',mime_type:file.type,size_bytes:file.size,width:options.width||null,
      height:options.height||null,duration_seconds:null,alt_text:options.altText||null,is_public:true
    });
    options.onProgress?.(100);
    return {asset,publicUrl:await getMediaPublicUrl(asset)};
  } catch(error) {
    const cleaned=await cleanupUploadedObject(client,path);
    throw new Error(`Expertise image metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);
  }
}

export async function uploadLogoBridgeImage(file,options={}) {
  if(!file||!IMAGE_TYPES.has(file.type))throw new Error('Logo images must be JPEG, PNG, WebP, or AVIF files. Transparent PNG or WebP is recommended.');
  if(!file.size||file.size>MAX_LOGO_IMAGE_BYTES)throw new Error('Logo images must be between 1 byte and 4 MB.');
  const path=uniquePath(file,'logo-bridge/logos');
  const client=await getSupabaseClient();
  await requireAdminSession(client);
  options.onProgress?.(5);
  const {error:uploadError}=await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
  if(uploadError)throw new Error(`Logo image upload failed: ${uploadError.message}`);
  options.onProgress?.(85);
  try {
    const asset=await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,storage_path:path,original_filename:file.name,
      media_type:'image',mime_type:file.type,size_bytes:file.size,width:options.width||null,
      height:options.height||null,duration_seconds:null,alt_text:options.altText||null,is_public:true
    });
    options.onProgress?.(100);
    return {asset,publicUrl:await getMediaPublicUrl(asset)};
  } catch(error) {
    const cleaned=await cleanupUploadedObject(client,path);
    throw new Error(`Logo uploaded, but media metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);
  }
}

function snapshotResumeKey(file) {
  return `${SNAPSHOT_RESUME_PATH_PREFIX}${file.name}:${file.size}:${file.lastModified}:${file.type}`;
}

function savedSnapshotResumePath(file) {
  try { return localStorage.getItem(snapshotResumeKey(file)); } catch { return null; }
}

function rememberSnapshotResumePath(file,path) {
  try { localStorage.setItem(snapshotResumeKey(file),path); } catch { /* Resuming is still available for this page session. */ }
}

function forgetSnapshotResumePath(file) {
  try { localStorage.removeItem(snapshotResumeKey(file)); } catch { /* Best effort only. */ }
}

async function finishSnapshotTusUpload(context) {
  emitState(context,'Processing metadata',{ message:'Registering Business Snapshot video…' });
  try {
    const asset=await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,
      storage_path:context.storagePath,
      original_filename:context.file.name,
      media_type:'video',
      mime_type:context.file.type,
      size_bytes:context.file.size,
      width:context.options.width || null,
      height:context.options.height || null,
      duration_seconds:context.options.durationSeconds || null,
      alt_text:null,
      is_public:true
    });
    const publicUrl=await getMediaPublicUrl(asset);
    forgetSnapshotResumePath(context.file);
    emitProgress(context,context.file.size,context.file.size);
    emitState(context,'Complete',{ asset,publicUrl,message:'Business Snapshot video upload complete.' });
    context.resolve({ asset,publicUrl });
    activeSnapshotVideoUpload=null;
  } catch(error) {
    const cleaned=await cleanupUploadedObject(context.client,context.storagePath);
    if (cleaned) {
      forgetSnapshotResumePath(context.file);
      context.storagePath=uniquePath(context.file,'business-snapshot/videos');
      rememberSnapshotResumePath(context.file,context.storagePath);
    }
    const wrapped=new Error(`Video uploaded, but Business Snapshot media metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);
    context.lastError=wrapped;context.needsNewUpload=true;
    emitState(context,'Failed',{ error:wrapped,message:wrapped.message });
  }
}

async function handleSnapshotTusError(context,error) {
  const status=uploadErrorStatus(error);
  if ((status===401 || status===403) && !context.tokenRefreshAttempted) {
    context.tokenRefreshAttempted=true;
    try {
      const session=await requireAdminSession(context.client);
      context.upload.options.headers.authorization=`Bearer ${session.access_token}`;
      emitState(context,'Resuming',{ message:'Session refreshed. Resuming Business Snapshot upload…' });
      context.upload.start();return;
    } catch(sessionError) {
      sessionError.code='AUTH_REQUIRED';emitState(context,'Failed',{ error:sessionError,message:sessionError.message });
      context.reject(sessionError);activeSnapshotVideoUpload=null;return;
    }
  }
  context.lastError=error;
  emitState(context,'Failed',{ error,message:error?.message || 'The Business Snapshot video upload failed.' });
}

async function buildSnapshotTusUpload(context) {
  const [{ Upload },client,config]=await Promise.all([import(TUS_CLIENT_URL),getSupabaseClient(),getSupabaseConfiguration()]);
  if (!config.configured) throw new Error('Supabase is not configured.');
  context.client=client;context.session=await requireAdminSession(client);context.endpoint=deriveResumableEndpoint(config.url);
  context.upload=new Upload(context.file,{
    endpoint:context.endpoint,
    retryDelays:[0,3000,5000,10000,20000],
    headers:{ authorization:`Bearer ${context.session.access_token}`,'x-upsert':'false' },
    metadata:{ bucketName:HOMEPAGE_MEDIA_BUCKET,objectName:context.storagePath,contentType:context.file.type,cacheControl:'3600' },
    uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,chunkSize:TUS_CHUNK_SIZE,
    onProgress:(uploaded,total)=>emitProgress(context,uploaded,total),
    onError:(error)=>handleSnapshotTusError(context,error),
    onSuccess:()=>finishSnapshotTusUpload(context)
  });
}

async function startOrResumeSnapshotTus(context) {
  emitState(context,'Preparing upload',{ message:'Preparing resumable Business Snapshot upload…' });
  await buildSnapshotTusUpload(context);
  const previous=await context.upload.findPreviousUploads();
  if (previous.length) { context.upload.resumeFromPreviousUpload(previous[0]);emitState(context,'Resuming',{ message:'Resuming previous Business Snapshot upload…' }); }
  else emitState(context,'Uploading',{ message:'Uploading Business Snapshot video…' });
  context.progressTime=performance.now();context.progressBytes=0;context.hasProgressSample=false;context.upload.start();
}

export function validateBusinessSnapshotVideoFile(file) {
  if (!file) throw new Error('Choose a Business Snapshot video to upload.');
  if (!VIDEO_TYPES.has(file.type)) throw new Error('Business Snapshot video must be an MP4 or WebM file.');
  if (file.size<=0) throw new Error('The selected video is empty.');
  if (file.size>MAX_SNAPSHOT_VIDEO_BYTES) throw new Error('This video exceeds the 49 MB Business Snapshot upload limit.');
  return true;
}

export function uploadBusinessSnapshotVideo(file,options={}) {
  try { validateBusinessSnapshotVideoFile(file); } catch(error) { return Promise.reject(error); }
  if (activeSnapshotVideoUpload && !['Complete','Cancelled'].includes(activeSnapshotVideoUpload.state)) return Promise.reject(new Error('Another Business Snapshot video upload is already active.'));
  return new Promise((resolve,reject)=>{
    const context={
      file,options,resolve,reject,state:'Validating',upload:null,client:null,
      storagePath:savedSnapshotResumePath(file) || uniquePath(file,'business-snapshot/videos'),
      tokenRefreshAttempted:false,lastError:null,needsNewUpload:false,
      progressTime:performance.now(),progressBytes:0,hasProgressSample:false
    };
    activeSnapshotVideoUpload=context;rememberSnapshotResumePath(file,context.storagePath);
    emitState(context,'Validating',{ message:'Validating Business Snapshot video…' });
    startOrResumeSnapshotTus(context).catch((error)=>{
      context.lastError=error;emitState(context,'Failed',{ error,message:error.message });
      if (error.code==='AUTH_REQUIRED') { reject(error);activeSnapshotVideoUpload=null; }
    });
  });
}

export async function pauseBusinessSnapshotVideoUpload() {
  if (!activeSnapshotVideoUpload?.upload || !['Uploading','Resuming'].includes(activeSnapshotVideoUpload.state)) return false;
  await activeSnapshotVideoUpload.upload.abort(false);emitState(activeSnapshotVideoUpload,'Paused',{ message:'Business Snapshot upload paused.' });return true;
}

export function resumeBusinessSnapshotVideoUpload() {
  if (!activeSnapshotVideoUpload?.upload || activeSnapshotVideoUpload.state!=='Paused') return false;
  emitState(activeSnapshotVideoUpload,'Resuming',{ message:'Resuming Business Snapshot upload…' });
  activeSnapshotVideoUpload.progressTime=performance.now();activeSnapshotVideoUpload.hasProgressSample=false;activeSnapshotVideoUpload.upload.start();return true;
}

export async function cancelBusinessSnapshotVideoUpload() {
  const context=activeSnapshotVideoUpload;if (!context) return false;
  try { await context.upload?.abort(true); } catch(error) { console.info('Business Snapshot TUS termination was not confirmed.',error.message); }
  forgetSnapshotResumePath(context.file);
  const cancelled=new Error('Business Snapshot video upload cancelled.');cancelled.code='UPLOAD_CANCELLED';
  emitState(context,'Cancelled',{ message:cancelled.message });context.reject(cancelled);activeSnapshotVideoUpload=null;return true;
}

export async function retryBusinessSnapshotVideoUpload() {
  const context=activeSnapshotVideoUpload;if (!context || context.state!=='Failed') return false;
  context.tokenRefreshAttempted=false;context.lastError=null;
  if (context.needsNewUpload || !context.upload) { context.needsNewUpload=false;await startOrResumeSnapshotTus(context); }
  else { emitState(context,'Resuming',{ message:'Retrying Business Snapshot upload…' });context.progressTime=performance.now();context.hasProgressSample=false;context.upload.start(); }
  return true;
}

export function getBusinessSnapshotVideoUploadState() {
  return activeSnapshotVideoUpload ? { state:activeSnapshotVideoUpload.state,file:activeSnapshotVideoUpload.file,storagePath:activeSnapshotVideoUpload.storagePath } : null;
}

export async function uploadBusinessSnapshotPoster(file,options={}) {
  if (!file || !IMAGE_TYPES.has(file.type)) throw new Error('Business Snapshot posters must be JPEG, PNG, WebP, or AVIF files.');
  if (!file.size || file.size>MAX_SNAPSHOT_POSTER_BYTES) throw new Error('Business Snapshot posters must be between 1 byte and 8 MB.');
  const path=uniquePath(file,'business-snapshot/posters');
  const client=await getSupabaseClient();await requireAdminSession(client);options.onProgress?.(5);
  const { error:uploadError }=await client.storage.from(HOMEPAGE_MEDIA_BUCKET).upload(path,file,{ contentType:file.type,cacheControl:'3600',upsert:false });
  if (uploadError) throw new Error(`Business Snapshot poster upload failed: ${uploadError.message}`);
  options.onProgress?.(85);
  try {
    const asset=await createMediaAsset({
      bucket_name:HOMEPAGE_MEDIA_BUCKET,storage_path:path,original_filename:file.name,media_type:'poster',mime_type:file.type,
      size_bytes:file.size,width:options.width||null,height:options.height||null,duration_seconds:null,alt_text:options.altText||null,is_public:true
    });
    options.onProgress?.(100);return { asset,publicUrl:await getMediaPublicUrl(asset) };
  } catch(error) {
    const cleaned=await cleanupUploadedObject(client,path);
    throw new Error(`Business Snapshot poster metadata could not be saved. Cleanup ${cleaned?'succeeded':'failed'}. ${error.message}`);
  }
}
