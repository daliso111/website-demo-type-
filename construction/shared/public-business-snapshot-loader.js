import { getPublishedBusinessSnapshot, getBusinessSnapshotStatistics } from './business-snapshot-service.js';

function ready() {
  if (document.readyState !== 'loading') return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('DOMContentLoaded',resolve,{ once:true }));
}

function applyContent(section,snapshot,statistics) {
  const eyebrow=section.querySelector('.business-snapshot__eyebrow');
  const heading=section.querySelector('#business-snapshot-title');
  const summary=section.querySelector('.business-snapshot__summary');
  const metrics=section.querySelector('.business-snapshot__metrics');
  if (eyebrow && snapshot.eyebrow) eyebrow.textContent=snapshot.eyebrow;
  if (heading && snapshot.heading) heading.textContent=snapshot.heading;
  if (summary) { summary.textContent=snapshot.introduction || ''; summary.hidden=!snapshot.introduction; }
  if (metrics && statistics.length) {
    metrics.replaceChildren(...statistics.map((item) => {
      const article=document.createElement('article');article.className='business-metric';
      const strong=document.createElement('strong');strong.textContent=`${item.prefix}${item.value}${item.suffix}`;
      const description=document.createElement('p');description.textContent=item.description;
      article.append(strong,description);return article;
    }));
  }
}

async function loadBusinessSnapshot() {
  const section=document.querySelector('[data-business-snapshot]');
  if (!section) return;
  try {
    const snapshot=await getPublishedBusinessSnapshot();
    if (!snapshot || snapshot.recordType!=='published' || snapshot.isVisible!==true) return;
    const statistics=await getBusinessSnapshotStatistics('published');
    if (!statistics.length) return;
    applyContent(section,snapshot,statistics);
    section.style.setProperty('--snapshot-overlay',String(snapshot.overlayOpacity));
    const media=section.querySelector('[data-business-snapshot-media]');
    const posterUrl=snapshot.media?.posterUrl || '';
    const videoUrl=snapshot.media?.videoUrl || '';
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const usePoster=Boolean(posterUrl) && !(reduced && snapshot.reducedMotionFallback==='solid');
    if (usePoster) {
      media.style.backgroundImage=`url("${posterUrl.replace(/"/g,'%22')}")`;
      section.classList.add('business-snapshot--has-poster');
    }
    const mobile=window.matchMedia('(max-width: 640px)').matches;
    const shouldPlay=Boolean(snapshot.videoEnabled && videoUrl && !reduced && (!mobile || snapshot.mobileVideoEnabled));
    if (!shouldPlay) return;
    const video=document.createElement('video');
    video.className='business-snapshot__video';
    video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;
    video.loop=Boolean(snapshot.loopEnabled);video.preload='metadata';video.poster=posterUrl;
    video.setAttribute('aria-hidden','true');
    const source=document.createElement('source');source.src=videoUrl;source.type=snapshot.media?.videoAsset?.mime_type || 'video/mp4';video.append(source);
    video.addEventListener('loadedmetadata',()=>{video.playbackRate=Number(snapshot.playbackRate) || 0.75;});
    video.addEventListener('playing',()=>section.classList.add('business-snapshot--video-active'),{ once:true });
    video.addEventListener('error',()=>{section.classList.remove('business-snapshot--video-active');video.remove();});
    media.prepend(video);video.load();
    try { await video.play(); }
    catch { video.remove(); section.classList.remove('business-snapshot--video-active'); }
  } catch(error) {
    console.info('Using the built-in Business Snapshot fallback.',error.message);
  }
}

ready().then(loadBusinessSnapshot);
