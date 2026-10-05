import { getPublishedFeaturedProjects } from './featured-projects-service.js';

console.info('[Featured Projects] loader started');

function projectSection(project,index){
  const section=document.createElement('section');section.className=`work-section work-section--${project.layout}`;if(index===0)section.id='projects';section.dataset.featuredProject='';
  section.innerHTML=`${index===0?'<div class="container work-section-header"><h2>Our Capabilities</h2><a href="#projects">View All \u2192</a></div>':''}<div class="container work-inner"><div class="work-feature"><div class="work-image"><img></div></div><div class="work-content"><h2></h2><p></p><a class="work-link"></a></div></div>`;
  const image=section.querySelector('img');image.src=project.image;image.alt=project.imageAlt;
  section.querySelector('.work-content h2').textContent=project.title;section.querySelector('.work-content p').textContent=project.description||'';
  const link=section.querySelector('.work-link');link.textContent=project.buttonLabel||'View project';link.href=project.buttonUrl||'#projects';
  if(project.layout==='image-right'){const inner=section.querySelector('.work-inner'),feature=section.querySelector('.work-feature'),content=section.querySelector('.work-content');inner.replaceChildren(content,feature);}
  return section;
}

async function load(){
  const fallback=[...document.querySelectorAll('[data-featured-project-fallback]')];if(!fallback.length)return;
  try{const projects=await getPublishedFeaturedProjects();console.info('[Featured Projects] published projects',{count:projects.length});if(!projects.length||projects.some(project=>!project.image||!project.imageAlt))return;
    const fragment=document.createDocumentFragment();projects.forEach((project,index)=>fragment.append(projectSection(project,index)));fallback[0].before(fragment);fallback.forEach(node=>node.remove());
  }catch(error){console.error('[Featured Projects] public loader failed:',error);}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
