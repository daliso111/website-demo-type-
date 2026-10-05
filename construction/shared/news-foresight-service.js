import { getSupabaseClient } from './supabase-client.js';
import { getMediaAsset, getMediaPublicUrl } from './homepage-media-service.js';

const COLUMNS='id,article_key,record_type,category,title,summary,publication_date,image_asset_id,image_alt,article_url,is_featured,sort_order,is_visible,published_at,created_by,updated_by,created_at,updated_at';
export const UUID_PATTERN=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVALID_ARTICLE_KEY_MESSAGE='The News article has an invalid identifier. Create a valid UUID before saving.';

export function createUuid() {
  if(typeof globalThis.crypto?.randomUUID==='function') {
    return globalThis.crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,(character)=>{
    const random=Math.floor(Math.random()*16);
    const value=character==='x'?random:(random&0x3)|0x8;
    return value.toString(16);
  });
}

export const createArticleKey=createUuid;

function isValidArticleKey(value) {
  return UUID_PATTERN.test(String(value||''));
}

export function assertValidArticleKey(value) {
  if(!isValidArticleKey(value)) throw new Error(INVALID_ARTICLE_KEY_MESSAGE);
}

function normalizeArticleKey(value) {
  const key=String(value||'');
  if(isValidArticleKey(key)) return key;
  if(key) console.warn('News article draft had an invalid identifier; generated a valid UUID before saving.',{articleKey:key});
  return createUuid();
}

function imageAltForSave(value) {
  const trimmed=String(value||'').trim();
  if(trimmed.toLowerCase()==='non') return 'Construction works underway at a Zambian border facility.';
  return trimmed||null;
}

function articleUrlForSave(value) {
  const trimmed=String(value||'').trim();
  if(!trimmed) return null;
  if(trimmed.startsWith('#')) return trimmed;
  try {
    const url=new URL(trimmed);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','fbclid','gclid'].forEach(parameter=>url.searchParams.delete(parameter));
    return url.toString();
  } catch(error) {
    return trimmed;
  }
}

async function normalize(record) {
  const imageAsset=await getMediaAsset(record.image_asset_id);
  return {
    id:record.article_key,
    articleKey:record.article_key,
    rowId:record.id,
    category:record.category||'',
    title:record.title||'',
    summary:record.summary||'',
    publicationDate:record.publication_date||'',
    imageAssetId:record.image_asset_id||'',
    image:await getMediaPublicUrl(imageAsset),
    imageAsset,
    imageAlt:imageAltForSave(record.image_alt)||'',
    articleUrl:articleUrlForSave(record.article_url)||'',
    featured:Boolean(record.is_featured),
    order:record.sort_order+1,
    visible:Boolean(record.is_visible),
    status:record.record_type,
    publishedAt:record.published_at,
    updatedAt:record.updated_at
  };
}

function payload(data,key) {
  return {
    article_key:key,
    record_type:'draft',
    category:data.category?.trim()||null,
    title:data.title?.trim()||'',
    summary:data.summary?.trim()||null,
    publication_date:data.publicationDate||null,
    image_asset_id:data.imageAssetId||null,
    image_alt:imageAltForSave(data.imageAlt),
    article_url:articleUrlForSave(data.articleUrl),
    is_featured:Boolean(data.featured),
    sort_order:Math.max(0,Number(data.order||1)-1),
    is_visible:Boolean(data.visible)
  };
}

async function all(type,visibleOnly=false) {
  const client=await getSupabaseClient();
  let query=client.from('news_articles').select(COLUMNS).eq('record_type',type).order('sort_order',{ascending:true}).order('publication_date',{ascending:false,nullsFirst:false});
  if(visibleOnly)query=query.eq('is_visible',true);
  const {data,error}=await query;
  if(error)throw error;
  return Promise.all((data||[]).map(normalize));
}

export async function getNewsArticleDrafts() {
  const [drafts,published]=await Promise.all([all('draft'),all('published')]);
  const live=new Set(published.map(article=>article.articleKey));
  return drafts.map(article=>({...article,status:live.has(article.articleKey)?'published':'draft',isPublished:live.has(article.articleKey)}));
}

export const getPublishedNewsArticles=()=>all('published',true);

export async function createNewsArticleDraft(data) {
  const key=normalizeArticleKey(data.articleKey);
  assertValidArticleKey(key);
  console.info('[News] saving draft',{hasValidArticleKey:isValidArticleKey(key),isNewArticle:true});
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('news_articles').upsert(payload(data,key),{onConflict:'article_key,record_type'}).select(COLUMNS).single();
  if(error)throw error;
  return normalize(row);
}

export async function updateNewsArticleDraft(articleKey,data) {
  const key=normalizeArticleKey(articleKey||data.articleKey);
  assertValidArticleKey(key);
  console.info('[News] saving draft',{hasValidArticleKey:isValidArticleKey(key),isNewArticle:false});
  const client=await getSupabaseClient();
  const {data:row,error}=await client.from('news_articles').upsert(payload(data,key),{onConflict:'article_key,record_type'}).select(COLUMNS).single();
  if(error)throw error;
  return normalize(row);
}

export async function duplicateNewsArticleDraft(articleKey) {
  assertValidArticleKey(articleKey);
  const articles=await getNewsArticleDrafts();
  const source=articles.find(article=>article.articleKey===articleKey);
  if(!source)throw new Error('News article draft not found.');
  const duplicateKey=createUuid();
  assertValidArticleKey(duplicateKey);
  return createNewsArticleDraft({...source,articleKey:duplicateKey,title:`${source.title} (copy)`,order:articles.length+1,status:'draft'});
}

export async function deleteNewsArticleDraft(articleKey) {
  assertValidArticleKey(articleKey);
  const client=await getSupabaseClient();
  const {error}=await client.from('news_articles').delete().eq('article_key',articleKey).eq('record_type','draft');
  if(error)throw error;
}

export async function deleteNewsArticleCompletely(articleKey) {
  assertValidArticleKey(articleKey);
  const client=await getSupabaseClient();
  const {error}=await client.from('news_articles').delete().eq('article_key',articleKey);
  if(error)throw error;
}

export async function reorderNewsArticleDrafts(articleKeys) {
  articleKeys.forEach(assertValidArticleKey);
  const client=await getSupabaseClient();
  for(let index=0;index<articleKeys.length;index+=1) {
    const {error}=await client.from('news_articles').update({sort_order:index}).eq('article_key',articleKeys[index]).eq('record_type','draft');
    if(error)throw error;
  }
  return getNewsArticleDrafts();
}

export async function publishNewsArticles() {
  const client=await getSupabaseClient();
  const {data,error}=await client.rpc('publish_news_articles');
  if(error)throw error;
  return Promise.all((data||[]).map(normalize));
}

export async function unpublishNewsArticles() {
  const client=await getSupabaseClient();
  const {error}=await client.rpc('unpublish_news_articles');
  if(error)throw error;
}
