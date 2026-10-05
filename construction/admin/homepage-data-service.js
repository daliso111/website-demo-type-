import { homepageMockData } from './mock-homepage-data.js';

const STORAGE_KEY = 'hilltop.homepage.admin.v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

function normalizeHero(hero = {}) {
  return {
    id: hero.id || 'hero',
    heading: hero.heading || 'Building Lasting Value',
    backgroundVideoAssetId: hero.backgroundVideoAssetId || '',
    posterAssetId: hero.posterAssetId || '',
    posterAltText: hero.posterAltText || '',
    loopEnabled: hero.loopEnabled !== false,
    mobileVideoEnabled: hero.mobileVideoEnabled !== false,
    playbackRate: [0.75, 1, 1.25].includes(Number(hero.playbackRate)) ? Number(hero.playbackRate) : 1,
    isVisible: hero.isVisible !== false,
    status: 'draft',
    updatedAt: hero.updatedAt || null
  };
}

function readState() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const result = saved ? JSON.parse(saved) : clone(homepageMockData);
    result.hero = normalizeHero(result.hero);
    if (!Array.isArray(result.homepageSections)) result.homepageSections=clone(homepageMockData.homepageSections);
    if (!result.homepageSections.some((section)=>section.id==='logos')) {
      result.homepageSections.forEach((section)=>{if(Number(section.order)>=5)section.order=Number(section.order)+1;});
      result.homepageSections.push({id:'logos',label:'Logo Bridge',order:5,visible:true,status:'draft'});
      result.homepageSections.sort((left,right)=>left.order-right.order).forEach((section,index)=>{section.order=index+1;});
    }
    return result;
  } catch (error) {
    console.warn('Using fresh mock data because saved dashboard data could not be read.', error);
    return clone(homepageMockData);
  }
}

let state = readState();

function persist() {
  state.meta.lastSaved = new Date().toISOString();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return clone(state);
}

export function getHomepageData() {
  return clone(state);
}

export function saveHomepageSection(sectionKey, value) {
  state[sectionKey] = clone(value);
  return persist();
}

export function updateHomepageData(mutator) {
  const draft = clone(state);
  mutator(draft);
  state = draft;
  return persist();
}

export function publishHomepageSection(sectionKey, itemId) {
  return updateHomepageData((draft) => {
    const target = draft[sectionKey];
    if (Array.isArray(target)) {
      const item = target.find((entry) => entry.id === itemId);
      if (item) item.status = 'published';
    } else if (target && itemId && Array.isArray(target.statistics)) {
      const item = target.statistics.find((entry) => entry.id === itemId);
      if (item) item.status = 'published';
    } else if (target) {
      target.status = 'published';
    }
    draft.meta.lastPublished = new Date().toISOString();
  });
}

export function deleteHomepageItem(sectionKey, itemId, nestedKey) {
  return updateHomepageData((draft) => {
    const collection = nestedKey ? draft[sectionKey][nestedKey] : draft[sectionKey];
    const index = collection.findIndex((entry) => entry.id === itemId);
    if (index >= 0) collection.splice(index, 1);
    collection.forEach((entry, position) => { entry.order = position + 1; });
  });
}

export function reorderHomepageItems(sectionKey, orderedIds, nestedKey) {
  return updateHomepageData((draft) => {
    const collection = nestedKey ? draft[sectionKey][nestedKey] : draft[sectionKey];
    const byId = new Map(collection.map((item) => [item.id, item]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    reordered.forEach((item, index) => { item.order = index + 1; });
    if (nestedKey) draft[sectionKey][nestedKey] = reordered;
    else draft[sectionKey] = reordered;
  });
}

export function resetHomepageData() {
  state = clone(homepageMockData);
  return persist();
}

export { STORAGE_KEY };
