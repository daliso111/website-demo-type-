import { getPublishedExpertiseSection, getPublishedExpertiseSlides } from './expertise-slides-service.js';

console.info('[Expertise] loader started');

function preloadImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(url);
    image.onerror=()=>reject(new Error('A published Expertise image could not be loaded.'));
    image.src=url;
  });
}

async function loadExpertise() {
  const section=document.querySelector('.expertise-scroll');
  if (!section) return;
  try {
    const [settings,slides]=await Promise.all([
      getPublishedExpertiseSection(),
      getPublishedExpertiseSlides()
    ]);
    console.info('[Expertise] published slides',{count:slides.length});
    if (!settings?.visible || !slides.length) return;
    const valid=slides.every((slide)=>slide.heading&&slide.description&&slide.image&&slide.imageAlt);
    if (!valid) {
      console.warn('[Expertise] Published data was incomplete; retaining fallback content.');
      return;
    }
    await Promise.all(slides.map((slide)=>preloadImage(slide.image)));
    document.dispatchEvent(new CustomEvent('hilltop:expertise-slides',{detail:{settings,slides}}));
  } catch(error) {
    console.error('[Expertise] public loader failed; retaining fallback content.',error?.message||'Unknown error');
  }
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadExpertise,{once:true});
else loadExpertise();
