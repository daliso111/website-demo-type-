import { getPublishedLogoBridgeSettings, getPublishedLogoBridgeItems } from './logo-bridge-service.js?v=20260713-logo-bridge2';

console.info('[Logo Bridge] loader started');

function hasPlaceholder(value) {
  return String(value||'').toLowerCase().includes('placeholder');
}

function preloadImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(url);image.onerror=()=>reject(new Error('A published Logo Bridge image could not be loaded.'));image.src=url;
  });
}

function logoItem(item) {
  const listItem=document.createElement('li');
  listItem.className='logo-bridge__item';
  listItem.dataset.logoName=String(item.organizationName||'').trim().toLowerCase();
  const image=document.createElement('img');
  image.className='logo-bridge__logo';image.src=item.logo;image.alt=item.altText;image.loading='lazy';image.decoding='async';
  listItem.append(image);return listItem;
}

async function loadLogoBridge() {
  const section=document.querySelector('.logo-bridge');
  if (!section) return;
  const grid=section.querySelector('.logo-bridge__grid');
  try {
    const [settings,logos]=await Promise.all([getPublishedLogoBridgeSettings(),getPublishedLogoBridgeItems()]);
    console.info('[Logo Bridge] published logos',{count:logos.length});
    if (!settings) return;
    if (settings.visible===false) { section.hidden=true;return; }
    const valid=logos.filter((item)=>item.visible&&item.organizationName&&item.logo&&item.altText&&!hasPlaceholder(item.organizationName)&&!hasPlaceholder(item.altText)&&!hasPlaceholder(item.logoAsset?.original_filename));
    if (!valid.length) return;
    await Promise.all(valid.map((item)=>preloadImage(item.logo)));
    section.querySelector('.logo-bridge__eyebrow').textContent=settings.eyebrow;
    section.querySelector('#logo-bridge-title').textContent=settings.heading;
    const description=section.querySelector('.logo-bridge__description');
    description.textContent=settings.description||'';description.hidden=!settings.description;
    grid.dataset.logoCount=String(valid.length);
    grid.replaceChildren(...valid.map(logoItem));grid.hidden=false;
  } catch(error) {
    console.error('[Logo Bridge] public loader failed; retaining the static bridge text.',error?.message||'Unknown error');
  }
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadLogoBridge,{once:true});
else loadLogoBridge();
