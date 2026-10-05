import { getPublishedNewsArticles } from './news-foresight-service.js';

console.info('[News & Foresight] loader started');

function preloadImage(url) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(url);
    image.onerror=()=>reject(new Error('A published News image could not be loaded.'));
    image.src=url;
  });
}

function articleCard(article) {
  const card=document.createElement('article');
  card.className=`news-card${article.featured?' news-card--featured':''}`;
  card.dataset.newsArticle=article.articleKey;

  const imageLink=document.createElement('a');
  imageLink.className='news-card__image-link';
  imageLink.href=article.articleUrl;
  imageLink.setAttribute('aria-label',`Read ${article.title}`);
  const imageWrap=document.createElement('div');
  imageWrap.className='news-card__image';
  const image=document.createElement('img');
  image.src=article.image;
  image.alt=article.imageAlt;
  image.loading='lazy';
  image.decoding='async';
  imageWrap.append(image);
  imageLink.append(imageWrap);

  const content=document.createElement('div');
  content.className='news-card__content';
  const category=document.createElement('p');
  category.className='news-card__category';
  category.textContent=article.category;
  content.append(category);
  if(article.publicationDate) {
    const date=document.createElement('time');
    date.className='news-card__date';
    date.dateTime=article.publicationDate;
    date.textContent=article.publicationDate;
    content.append(date);
  }
  const heading=document.createElement('h3');
  heading.className='news-card__title';
  const titleLink=document.createElement('a');
  titleLink.href=article.articleUrl;
  titleLink.textContent=article.title;
  heading.append(titleLink);
  const summary=document.createElement('p');
  summary.className='news-card__excerpt news-card__summary';
  summary.textContent=article.summary;
  content.append(heading,summary);
  card.append(imageLink,content);
  return card;
}

async function loadNews() {
  const grid=document.querySelector('[data-news-foresight-grid]');
  if(!grid)return;
  try {
    const articles=await getPublishedNewsArticles();
    console.info('[News & Foresight] published cards',{count:articles.length});
    if(!articles.length) {
      console.info('[News & Foresight] No visible published cards; retaining fallback content.');
      return;
    }
    const valid=articles.every((article)=>article.category&&article.title&&article.summary&&article.image&&article.imageAlt&&article.articleUrl);
    if(!valid) {
      console.warn('[News & Foresight] Published data was incomplete; retaining fallback content.');
      return;
    }
    await Promise.all(articles.map((article)=>preloadImage(article.image)));
    const fragment=document.createDocumentFragment();
    articles.forEach((article)=>fragment.append(articleCard(article)));
    grid.replaceChildren(fragment);
    console.info('[News & Foresight] Published cards loaded.',{count:articles.length});
  } catch(error) {
    console.error('[News & Foresight] Public loader failed; retaining fallback content.',error?.message||'Unknown error');
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadNews,{once:true});
else loadNews();
