import { getPublishedHero } from './hero-service.js';

console.info('[Hero] loader started');

function whenDomReady() {
  if (document.readyState !== 'loading') return Promise.resolve();
  return new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once:true }));
}

function preloadPoster(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(url);
    image.onerror = () => reject(new Error('The published Hero poster could not be loaded.'));
    image.src = url;
  });
}

async function loadPublicHero() {
  const heroElement = document.querySelector('[data-homepage-hero]');
  if (!heroElement) throw new Error('The public Hero element was not found.');

  console.info('[Hero] requesting published Hero');
  const hero = await getPublishedHero();
  console.info('[Hero] published Hero result', {
    found: Boolean(hero),
    recordType: hero?.recordType,
    visible: hero?.isVisible,
    videoAssetId: hero?.backgroundVideoAssetId,
    posterAssetId: hero?.posterAssetId
  });

  if (!hero || hero.recordType !== 'published' || hero.isVisible !== true) {
    heroElement.classList.remove('hero--media-loading');
    heroElement.classList.add('hero--media-unavailable');
    return;
  }

  const videoUrl = hero.media?.videoUrl || '';
  const posterUrl = hero.media?.posterUrl || '';
  const videoAsset = hero.media?.videoAsset || null;
  console.info('[Hero] media resolved', {
    hasVideoUrl: Boolean(videoUrl),
    hasPosterUrl: Boolean(posterUrl)
  });
  console.info('[Hero] video asset', {
    id: hero.backgroundVideoAssetId,
    found: Boolean(videoAsset),
    mediaType: videoAsset?.media_type,
    mimeType: videoAsset?.mime_type,
    hasStoragePath: Boolean(videoAsset?.storage_path)
  });
  console.info('[Hero] video URL resolved', Boolean(videoUrl));

  if (!posterUrl) throw new Error('The published Hero is missing its required poster URL.');
  await preloadPoster(posterUrl);

  const mediaElement = heroElement.querySelector('[data-hero-media]');
  const headingElement = heroElement.querySelector('[data-hero-heading]');

  if (!mediaElement || !headingElement) throw new Error('The public Hero DOM hooks are incomplete.');

  mediaElement.style.backgroundImage = `url("${posterUrl.replace(/"/g, '%22')}")`;
  heroElement.dataset.heroSource = 'supabase';
  heroElement.setAttribute('role', 'img');
  heroElement.setAttribute('aria-label', hero.posterAltText || '');

  if (hero.heading) headingElement.textContent = hero.heading;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileViewport = window.matchMedia('(max-width: 640px)').matches;
  const shouldPlayVideo = Boolean(videoUrl) && hero.videoEnabled && !reducedMotion && (!mobileViewport || hero.mobileVideoEnabled);
  console.info('[Hero] playback decision', {
    videoEnabled: hero.videoEnabled,
    prefersReducedMotion: reducedMotion,
    mobileViewport,
    mobileVideoEnabled: hero.mobileVideoEnabled,
    shouldPlayVideo
  });
  if (!shouldPlayVideo) {
    heroElement.classList.remove('hero--media-loading');
    console.info('[Hero] published Hero rendered with poster fallback');
    return;
  }

  const video = document.createElement('video');
  video.className = 'hero__background-video';
  video.poster = posterUrl;
  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = hero.loopEnabled;
  video.preload = 'metadata';
  video.setAttribute('aria-hidden', 'true');
  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = videoAsset?.mime_type || 'video/mp4';
  video.appendChild(source);
  video.addEventListener('loadedmetadata', () => {
    video.playbackRate = Number(hero.playbackRate) || 1;
    console.info('[Hero] video metadata loaded', { mimeType:source.type });
  });
  video.addEventListener('playing', () => {
    heroElement.classList.add('hero--video-playing');
  });
  video.addEventListener('error', () => {
    console.error('[Hero] video failed', {
      code: video.error?.code,
      message: video.error?.message
    });
  });
  mediaElement.replaceChildren(video);
  heroElement.classList.remove('hero--media-loading');
  video.load();

  try {
    await video.play();
    console.info('[Hero] published video Hero rendered');
  } catch (error) {
    console.warn('[Hero] autoplay was blocked; using poster fallback:', error);
    heroElement.classList.remove('hero--video-playing');
    video.remove();
    console.info('[Hero] published Hero rendered with poster fallback');
  }
}

whenDomReady().then(loadPublicHero).catch((error) => {
  const heroElement = document.querySelector('[data-homepage-hero]');
  console.error('[Hero] media loading failed:', error);
  if (heroElement) {
    const mediaElement = heroElement.querySelector('[data-hero-media]');
    if (mediaElement) mediaElement.style.removeProperty('background-image');
    heroElement.classList.remove('hero--media-loading', 'hero--video-playing');
    heroElement.classList.add('hero--media-unavailable');
  }
});
