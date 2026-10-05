import {
  getHomepageData,
  saveHomepageSection,
  updateHomepageData,
  publishHomepageSection,
  deleteHomepageItem,
  reorderHomepageItems,
  resetHomepageData
} from './homepage-data-service.js';
import { getSupabaseConfiguration, getSupabaseClient } from '../shared/supabase-client.js';
import {
  signInAdmin,
  signOutAdmin,
  requestAdminPasswordReset,
  updateAdminPassword,
  getAdminProfileForUser,
  subscribeToAdminAuth
} from './auth-service.js';
import { getDiscoveryBridge, saveDiscoveryBridgeDraft, publishDiscoveryBridge, unpublishDiscoveryBridge } from '../shared/discovery-bridge-service.js';
import { createUuid, UUID_PATTERN } from '../shared/news-foresight-service.js?v=20260713-news2';

let heroServicePromise;
let mediaServicePromise;
const getHeroService = () => heroServicePromise || (heroServicePromise = import('../shared/hero-service.js?v=20260714-poster-hero1'));
const getMediaService = () => mediaServicePromise || (mediaServicePromise = import('../shared/homepage-media-service.js?v=20260714-hero-poster1'));
const getHeroDraft = (...args) => getHeroService().then((service) => service.getHeroDraft(...args));
const getPublishedHero = (...args) => getHeroService().then((service) => service.getPublishedHero(...args));
const saveHeroDraft = (...args) => getHeroService().then((service) => service.saveHeroDraft(...args));
const publishHero = (...args) => getHeroService().then((service) => service.publishHero(...args));
const unpublishHero = (...args) => getHeroService().then((service) => service.unpublishHero(...args));
const uploadHomepageMedia = (...args) => getMediaService().then((service) => service.uploadHomepageMedia(...args));
const uploadHeroVideoResumable = (...args) => getMediaService().then((service) => service.uploadHeroVideoResumable(...args));
const pauseHeroVideoUpload = (...args) => getMediaService().then((service) => service.pauseHeroVideoUpload(...args));
const resumeHeroVideoUpload = (...args) => getMediaService().then((service) => service.resumeHeroVideoUpload(...args));
const cancelHeroVideoUpload = (...args) => getMediaService().then((service) => service.cancelHeroVideoUpload(...args));
const retryHeroVideoUpload = (...args) => getMediaService().then((service) => service.retryHeroVideoUpload(...args));
const validateHeroVideoFile = (...args) => getMediaService().then((service) => service.validateHeroVideoFile(...args));
const uploadFeaturedProjectImage = (...args) => getMediaService().then((service) => service.uploadFeaturedProjectImage(...args));
const getHomepageImageAssets = (...args) => getMediaService().then((service) => service.getHomepageImageAssets(...args));
const uploadExpertiseSlideImage=(...args)=>getMediaService().then((service)=>service.uploadExpertiseSlideImage(...args));
const getExpertiseSlideImageAssets=(...args)=>getMediaService().then((service)=>service.getExpertiseSlideImageAssets(...args));
const uploadNewsArticleImage=(...args)=>getMediaService().then((service)=>service.uploadNewsArticleImage(...args));
const getNewsArticleImageAssets=(...args)=>getMediaService().then((service)=>service.getNewsArticleImageAssets(...args));
const uploadBusinessSnapshotVideo = (...args) => getMediaService().then((service) => service.uploadBusinessSnapshotVideo(...args));
const uploadBusinessSnapshotPoster = (...args) => getMediaService().then((service) => service.uploadBusinessSnapshotPoster(...args));
const pauseBusinessSnapshotVideoUpload = (...args) => getMediaService().then((service) => service.pauseBusinessSnapshotVideoUpload(...args));
const resumeBusinessSnapshotVideoUpload = (...args) => getMediaService().then((service) => service.resumeBusinessSnapshotVideoUpload(...args));
const cancelBusinessSnapshotVideoUpload = (...args) => getMediaService().then((service) => service.cancelBusinessSnapshotVideoUpload(...args));
const retryBusinessSnapshotVideoUpload = (...args) => getMediaService().then((service) => service.retryBusinessSnapshotVideoUpload(...args));
const getBusinessSnapshotMediaAssets = (...args) => getMediaService().then((service) => service.getBusinessSnapshotMediaAssets(...args));
const uploadLogoBridgeImage = (...args) => getMediaService().then((service) => service.uploadLogoBridgeImage(...args));
const getLogoBridgeImageAssets = (...args) => getMediaService().then((service) => service.getLogoBridgeImageAssets(...args));
let snapshotServicePromise;
const getSnapshotService = () => snapshotServicePromise || (snapshotServicePromise = import('../shared/business-snapshot-service.js?v=20260713-1'));
let projectsServicePromise;
const getProjectsService=()=>projectsServicePromise||(projectsServicePromise=import('../shared/featured-projects-service.js?v=20260712-1'));
let newsServicePromise;
const getNewsService=()=>newsServicePromise||(newsServicePromise=import('../shared/news-foresight-service.js?v=20260713-news2'));
let expertiseServicePromise;
const getExpertiseService=()=>expertiseServicePromise||(expertiseServicePromise=import('../shared/expertise-slides-service.js?v=20260713-expertise1'));
let logoBridgeServicePromise;
const getLogoBridgeService=()=>logoBridgeServicePromise||(logoBridgeServicePromise=import('../shared/logo-bridge-service.js?v=20260713-logo-bridge2'));

const navItems = [
  ['overview', 'Overview', '⌂'],
  ['hero', 'Hero', 'H'],
  ['discovery', 'Discovery Bridge', 'D'],
  ['projects', 'Featured Projects', 'P'],
  ['expertise', 'Expertise Slides', 'E'],
  ['logos', 'Logo Bridge', 'L'],
  ['snapshot', 'Business Snapshot', 'B'],
  ['news', 'News & Foresight', 'N'],
  ['media', 'Media Library', 'M'],
  ['settings', 'Homepage Settings', 'S']
];

const workspace = document.querySelector('#workspace');
const shell = document.querySelector('#adminShell');
const sidebarNav = document.querySelector('#sidebarNav');
const breadcrumb = document.querySelector('#breadcrumb');
const notifications = document.querySelector('#notifications');
const confirmationModal = document.querySelector('#confirmationModal');
const projectMediaPicker = document.querySelector('#projectMediaPicker');
const projectMediaSearch = document.querySelector('#projectMediaSearch');
const projectMediaStatus = document.querySelector('#projectMediaStatus');
const projectMediaGrid = document.querySelector('#projectMediaGrid');
const snapshotMediaPicker = document.querySelector('#snapshotMediaPicker');
const snapshotMediaSearch = document.querySelector('#snapshotMediaSearch');
const snapshotMediaStatus = document.querySelector('#snapshotMediaStatus');
const snapshotMediaGrid = document.querySelector('#snapshotMediaGrid');
const newsMediaPicker=document.querySelector('#newsMediaPicker');
const newsMediaSearch=document.querySelector('#newsMediaSearch');
const newsMediaStatus=document.querySelector('#newsMediaStatus');
const newsMediaGrid=document.querySelector('#newsMediaGrid');
const expertiseMediaPicker=document.querySelector('#expertiseMediaPicker');
const expertiseMediaSearch=document.querySelector('#expertiseMediaSearch');
const expertiseMediaStatus=document.querySelector('#expertiseMediaStatus');
const expertiseMediaGrid=document.querySelector('#expertiseMediaGrid');
const logoMediaPicker=document.querySelector('#logoMediaPicker');
const logoMediaSearch=document.querySelector('#logoMediaSearch');
const logoMediaStatus=document.querySelector('#logoMediaStatus');
const logoMediaGrid=document.querySelector('#logoMediaGrid');
const previewModal = document.querySelector('#previewModal');
const homepagePreview = document.querySelector('#homepagePreview');
const authGate = document.querySelector('#authGate');
const loginForm = document.querySelector('#loginForm');
const passwordRecoveryForm = document.querySelector('#passwordRecoveryForm');
const passwordUpdateForm = document.querySelector('#passwordUpdateForm');
const authLoading = document.querySelector('#authLoading');
const authConfiguration = document.querySelector('#authConfiguration');
const authFailure = document.querySelector('#authFailure');
let state = getHomepageData();
let discoveryRecord = null;
let discoveryLoadError = '';
let heroDraft = null;
let publishedHero = null;
let heroLoadError = '';
let heroEditorMedia = { videoAsset: null, posterAsset: null, videoUrl: '', posterUrl: '' };
let currentAdminProfile = null;
let dirty = false;
let activeEditor = null;
let mediaFilter = 'All';
let mediaView = 'grid';
let pendingConfirmation = null;
let previewMode = 'draft';
let bootstrapInProgress = false;
let bootstrapQueued = false;
let authListenerReady = false;
let passwordRecoveryActive = new URLSearchParams(window.location.search).get('mode') === 'reset-password'
  || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
let loginStatusMessage = '';
let heroVideoUploadUi = { state:'Waiting for upload', fileName:'', mimeType:'', bytesUploaded:0, bytesTotal:0, percentage:0, speedBps:0, etaSeconds:null, message:'', error:null, controllerActive:false };
let lastHeroVideoFile = null;
let featuredProjectDrafts = null;
let featuredProjectsLoadError = '';
let projectEditorImage = { asset:null, publicUrl:'' };
let projectMediaAssets = [];
let selectedProjectMediaAssetId = '';
let projectMediaTargetForm = null;
let projectMediaFilter = 'featured';
let newsArticleDrafts=null;
let publishedNewsArticles=null;
let newsLoadError='';
let newsLoading=true;
let newsEditorImage={asset:null,publicUrl:''};
let newsMediaAssets=[];
let selectedNewsMediaAssetId='';
let newsMediaTargetForm=null;
let newsMediaFilter='news';
let expertiseSectionDraft=null;
let publishedExpertiseSection=null;
let expertiseSlideDrafts=null;
let publishedExpertiseSlides=null;
let expertiseLoadError='';
let expertiseLoading=true;
let expertiseEditorImage={asset:null,publicUrl:''};
let expertiseMediaAssets=[];
let selectedExpertiseMediaAssetId='';
let expertiseMediaTargetForm=null;
let expertiseMediaFilter='expertise';
let logoBridgeDraftSettings=null;
let publishedLogoBridgeSettings=null;
let logoBridgeDraftItems=null;
let publishedLogoBridgeItems=null;
let logoBridgeLoadError='';
let logoBridgeLoading=true;
let logoEditorImage={asset:null,publicUrl:''};
let logoMediaAssets=[];
let selectedLogoMediaAssetId='';
let logoMediaTargetForm=null;
let logoMediaFilter='logos';
let snapshotDraft = null;
let publishedSnapshot = null;
let snapshotStatistics = null;
let snapshotLoadError = '';
let snapshotEditorMedia = { videoAsset:null,posterAsset:null,videoUrl:'',posterUrl:'' };
let snapshotVideoUploadUi = { state:'Waiting for upload',fileName:'',mimeType:'',bytesUploaded:0,bytesTotal:0,percentage:0,speedBps:0,etaSeconds:null,message:'',error:null };
let lastSnapshotVideoFile = null;
let snapshotReducedMotionPreview = false;
let snapshotMediaAssets = [];
let selectedSnapshotMediaAssetId = '';
let snapshotMediaKind = 'video';
let snapshotMediaTargetForm = null;

const esc = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const now = () => new Date().toISOString();
const uniqueId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
const route = () => (location.hash.replace('#', '') || 'overview').split('/')[0];
const labelForRoute = (key) => navItems.find((item) => item[0] === key)?.[1] || 'Overview';
const formatDate = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : 'Not edited';

function isValidArticleKey(value) {
  return UUID_PATTERN.test(String(value || ''));
}

function articleKeyForEditor(value) {
  const key = String(value || '');
  return isValidArticleKey(key) ? key : createUuid();
}

function repairNewsArticleFormKey(form) {
  const articleKey = articleKeyForEditor(form?.dataset.id);
  if (form && form.dataset.id !== articleKey) {
    console.warn('News article editor had an invalid identifier; generated a valid UUID before saving.', { articleKey: form.dataset.id });
    form.dataset.id = articleKey;
  }
  if (activeEditor) activeEditor.id = articleKey;
  return articleKey;
}

function isNewsArticleIdentifierError(error) {
  return /invalid input syntax for type uuid|invalid identifier|valid uuid/i.test(String(error?.message || error || ''));
}

function statusBadge(status = 'draft') {
  return `<span class="status-badge status-badge--${esc(status)}">${esc(status)}</span>`;
}

function dismissNotification(id) {
  if (!id) return;
  notifications.querySelector(`[data-notification-id="${id}"]`)?.remove();
}

function notify(message, type = 'success', id = '') {
  dismissNotification(id);
  const item = document.createElement('div');
  item.className = `notification notification--${type}`;
  if (id) item.dataset.notificationId = id;
  item.innerHTML = `<span aria-hidden="true">${type === 'error' ? '!' : type==='warning'?'i':'✓'}</span><span>${esc(message)}</span>`;
  notifications.appendChild(item);
  window.setTimeout(() => item.remove(), 3600);
}

function setDirty(value = true) {
  dirty = value;
  document.querySelector('#saveState').textContent = value ? 'Unsaved changes' : 'All changes saved';
}

function setSaving(form, saving, label = 'Saving…') {
  form?.querySelectorAll('button').forEach((button) => { button.disabled = saving; });
  document.querySelector('#saveState').textContent = saving ? label : (dirty ? 'Unsaved changes' : 'All changes saved');
}

function discoveryToEditor(record) {
  if (!record) return state.discoveryBridge;
  return {
    id: record.id,
    paragraph: record.main_paragraph,
    buttonLabel: record.button_label,
    buttonUrl: record.button_url,
    alignment: record.text_alignment,
    status: record.status,
    visible: record.is_visible,
    updatedAt: record.updated_at
  };
}

function discoveryPayload(data) {
  return {
    mainParagraph: data.paragraph.trim(),
    buttonLabel: data.buttonLabel.trim(),
    buttonUrl: data.buttonUrl.trim(),
    textAlignment: data.alignment,
    isVisible: Boolean(data.visible)
  };
}

function pageHeader(eyebrow, title, description, actions = '') {
  return `<header class="page-header"><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${actions ? `<div class="header-actions">${actions}</div>` : ''}</header>`;
}

function field(name, label, value = '', options = {}) {
  const { type = 'text', help = '', required = false, full = false, placeholder = '', min = '', max = '', step = '', inputmode = '' } = options;
  return `<div class="field${full ? ' field--full' : ''}"><label for="${name}"><span>${esc(label)}</span>${required ? '<span aria-hidden="true">*</span>' : ''}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${required ? 'required' : ''} ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${min !== '' ? `min="${min}"` : ''} ${max !== '' ? `max="${max}"` : ''} ${step !== '' ? `step="${step}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''}>${help ? `<p class="field-help">${esc(help)}</p>` : ''}</div>`;
}

function textarea(name, label, value = '', options = {}) {
  const { help = '', required = false, full = true, maxlength = '' } = options;
  return `<div class="field${full ? ' field--full' : ''}"><label for="${name}"><span>${esc(label)}</span>${required ? '<span aria-hidden="true">*</span>' : ''}</label><textarea id="${name}" name="${name}" ${required ? 'required' : ''} ${maxlength ? `maxlength="${maxlength}"` : ''}>${esc(value)}</textarea>${help ? `<p class="field-help">${esc(help)}</p>` : ''}</div>`;
}

function selectField(name, label, value, choices, options = {}) {
  return `<div class="field${options.full ? ' field--full' : ''}"><label for="${name}">${esc(label)}</label><select id="${name}" name="${name}">${choices.map(([key, text]) => `<option value="${esc(key)}" ${String(key) === String(value) ? 'selected' : ''}>${esc(text)}</option>`).join('')}</select></div>`;
}

function checkbox(name, label, checked) {
  return `<label class="checkbox-row"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''}><span>${esc(label)}</span></label>`;
}

function rangeField(name, label, value, min, max, suffix = '%') {
  return `<div class="field field--full"><label for="${name}">${esc(label)}</label><div class="range-row"><input id="${name}" name="${name}" type="range" min="${min}" max="${max}" value="${esc(value)}" data-range-output="${name}Output"><output class="range-value" id="${name}Output">${esc(value)}${suffix}</output></div></div>`;
}

function workflowFields(item) {
  return `${selectField('status', 'Editorial status', item.status || 'draft', [['draft', 'Draft'], ['published', 'Published'], ['hidden', 'Hidden']])}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible', 'Show on homepage', item.visible !== false)}</div>`;
}

function formActions(options = {}) {
  return `<div class="form-actions"><button class="button button--quiet" type="button" data-action="preview">Preview</button><button class="button button--quiet" type="button" data-action="unpublish-current">Unpublish</button>${options.delete ? '<button class="button button--danger" type="button" data-action="delete-current">Delete</button>' : ''}<button class="button button--quiet" type="submit" name="intent" value="draft">Save draft</button><button class="button button--accent" type="submit" name="intent" value="publish">Publish</button></div>`;
}

function mediaPreview(path, alt, copy = '') {
  return `<div class="media-preview">${path ? `<img src="${esc(path)}" alt="${esc(alt || '')}">` : '<span>No media selected</span>'}${path ? '<span class="media-preview__overlay"></span>' : ''}${copy ? `<div class="media-preview__copy">${copy}</div>` : ''}</div>`;
}

function formatBytes(value) {
  if (!Number(value)) return 'Not available';
  const units = ['B', 'KB', 'MB', 'GB']; let size = Number(value), index = 0;
  while (size >= 1024 && index < units.length - 1) { size /= 1024; index += 1; }
  return `${size.toFixed(index ? 1 : 0)} ${units[index]}`;
}

function formatDimensions(asset) {
  return asset?.width && asset?.height ? `${asset.width} × ${asset.height}px` : 'Not available';
}

function projectImagePanelMarkup(asset, publicUrl) {
  const hasImage = Boolean(asset?.id && publicUrl);
  return `<div class="field field--full" data-project-image-panel>
    <span class="field__label">Project image</span>
    <div class="project-image-panel">
      <div class="project-image-panel__preview">${hasImage ? `<img src="${esc(publicUrl)}" alt="">` : '<span>No image selected</span>'}</div>
      <div class="project-image-panel__details">
        <strong data-project-image-filename>${esc(asset?.original_filename || 'No project image selected')}</strong>
        <dl>
          <div><dt>File type</dt><dd>${esc(asset?.mime_type || '—')}</dd></div>
          <div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div>
          <div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div>
        </dl>
        <div class="header-actions">
          <button type="button" class="button button--quiet" data-action="upload-project-image">Upload new image</button>
          <button type="button" class="button button--quiet" data-action="choose-project-media">Choose from Media Library</button>
          <button type="button" class="button button--text" data-action="remove-project-image" ${hasImage ? '' : 'disabled'}>Remove</button>
        </div>
        <p class="project-image-panel__status" data-project-image-status aria-live="polite"></p>
        <progress class="upload-progress" data-project-upload-progress max="100" value="0" hidden></progress>
      </div>
    </div>
    <input class="visually-hidden" type="file" data-project-image-file accept="image/jpeg,image/png,image/webp,image/avif">
  </div>`;
}

function applyProjectImageSelection(form, asset, publicUrl, options = {}) {
  if (!form) return;
  projectEditorImage = { asset:asset || null, publicUrl:publicUrl || '' };
  form.elements.imageAssetId.value = asset?.id || '';
  form.elements.image.value = publicUrl || '';
  form.elements.imageAlt.required = Boolean(asset?.id);
  form.querySelector('[data-project-image-panel]')?.replaceWith(document.createRange().createContextualFragment(projectImagePanelMarkup(asset, publicUrl)));
  const preview = form.querySelector('.preview-item .media-preview');
  if (preview) preview.innerHTML = publicUrl ? `<img src="${esc(publicUrl)}" alt="${esc(form.elements.imageAlt.value)}"><span class="media-preview__overlay"></span>` : '<span>No media selected</span>';
  if (options.prefillAlt && asset?.alt_text && !form.dataset.projectAltTouched && !form.elements.imageAlt.value.trim()) {
    form.elements.imageAlt.value = asset.alt_text;
    preview?.querySelector('img')?.setAttribute('alt', asset.alt_text);
  }
  setDirty();
}

function filteredProjectMediaAssets() {
  const search = projectMediaSearch.value.trim().toLowerCase();
  return projectMediaAssets.filter((asset) => {
    const inFeaturedProjects = asset.storage_path?.startsWith('featured-projects/images/');
    const matchesFilter = projectMediaFilter === 'all' || inFeaturedProjects;
    const matchesSearch = !search || `${asset.original_filename || ''} ${asset.alt_text || ''}`.toLowerCase().includes(search);
    return matchesFilter && matchesSearch;
  });
}

function renderProjectMediaPicker() {
  const assets = filteredProjectMediaAssets();
  projectMediaGrid.innerHTML = assets.map((asset) => {
    const selected = asset.id === selectedProjectMediaAssetId;
    return `<button type="button" class="media-picker-card" role="option" aria-selected="${selected}" data-project-media-id="${esc(asset.id)}">
      <span class="media-picker-card__image"><img src="${esc(asset.publicUrl)}" alt=""></span>
      <span class="media-picker-card__body">
        <strong>${esc(asset.original_filename)}</strong>
        <dl><div><dt>Type</dt><dd>${esc(asset.mime_type)}</dd></div><div><dt>Size</dt><dd>${esc(formatBytes(asset.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div></dl>
        <span class="media-picker-card__usage">${asset.usedBy?.length ? `Used by ${esc(asset.usedBy.join(', '))}` : 'Not currently used by a Featured Project'}</span>
      </span>
    </button>`;
  }).join('');
  if (!assets.length) projectMediaGrid.innerHTML = '<div class="empty-state"><h3>No matching images</h3><p>Try another search or view all uploaded images.</p></div>';
  const selectedAsset = assets.find((asset) => asset.id === selectedProjectMediaAssetId);
  projectMediaStatus.textContent = selectedAsset ? `${selectedAsset.original_filename} selected. ${assets.length} image${assets.length === 1 ? '' : 's'} shown.` : `${assets.length} image${assets.length === 1 ? '' : 's'} available.`;
  projectMediaPicker.querySelector('[data-action="use-project-media"]').disabled = !selectedAsset;
}

async function openProjectMediaPicker(form) {
  projectMediaTargetForm = form;
  selectedProjectMediaAssetId = form.elements.imageAssetId.value || '';
  projectMediaFilter = 'featured';
  projectMediaSearch.value = '';
  projectMediaPicker.querySelectorAll('[data-project-media-filter]').forEach((button) => button.classList.toggle('is-active', button.dataset.projectMediaFilter === projectMediaFilter));
  projectMediaGrid.innerHTML = '';
  projectMediaStatus.textContent = 'Loading images…';
  projectMediaPicker.querySelector('[data-action="use-project-media"]').disabled = true;
  projectMediaPicker.showModal();
  projectMediaSearch.focus();
  try {
    projectMediaAssets = await getHomepageImageAssets();
    renderProjectMediaPicker();
  } catch (error) {
    projectMediaAssets = [];
    projectMediaStatus.textContent = `Media Library could not be loaded: ${error.message}`;
    projectMediaGrid.innerHTML = '<div class="empty-state"><h3>Images unavailable</h3><p>Close this window and try again.</p></div>';
  }
}

function closeProjectMediaPicker() {
  if (projectMediaPicker.open) projectMediaPicker.close();
  projectMediaTargetForm = null;
  selectedProjectMediaAssetId = '';
}

function expertiseImagePanelMarkup(asset,publicUrl) {
  const hasImage=Boolean(asset?.id&&publicUrl);
  const usage=asset?.usedBy?.length?asset.usedBy.join(', '):'Not currently used by homepage content';
  return `<div class="field field--full" data-expertise-image-panel>
    <span class="field__label">Background image</span>
    <div class="project-image-panel">
      <div class="project-image-panel__preview">${hasImage?`<img src="${esc(publicUrl)}" alt="">`:'<span>No image selected</span>'}</div>
      <div class="project-image-panel__details">
        <strong>${esc(asset?.original_filename||'No Expertise image selected')}</strong>
        <dl>
          <div><dt>File type</dt><dd>${esc(asset?.mime_type||'—')}</dd></div>
          <div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div>
          <div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div>
          <div><dt>Usage</dt><dd>${esc(usage)}</dd></div>
        </dl>
        <div class="header-actions">
          <button type="button" class="button button--quiet" data-action="upload-expertise-image">${hasImage?'Upload replacement':'Upload new image'}</button>
          <button type="button" class="button button--quiet" data-action="choose-expertise-media">${hasImage?'Choose replacement':'Choose from Media Library'}</button>
          <button type="button" class="button button--text" data-action="remove-expertise-image" ${hasImage?'':'disabled'}>Remove</button>
        </div>
        <p class="project-image-panel__status" data-expertise-image-status aria-live="polite"></p>
        <progress class="upload-progress" data-expertise-upload-progress max="100" value="0" hidden></progress>
      </div>
    </div>
    <input class="visually-hidden" type="file" data-expertise-image-file accept="image/jpeg,image/png,image/webp,image/avif">
  </div>`;
}

function applyExpertiseImageSelection(form,asset,publicUrl,options={}) {
  if(!form)return;
  expertiseEditorImage={asset:asset||null,publicUrl:publicUrl||''};
  form.elements.backgroundImageAssetId.value=asset?.id||'';
  form.elements.image.value=publicUrl||'';
  form.elements.imageAlt.required=Boolean(asset?.id);
  form.querySelector('[data-expertise-image-panel]')?.replaceWith(document.createRange().createContextualFragment(expertiseImagePanelMarkup(asset,publicUrl)));
  if(options.prefillAlt&&asset?.alt_text&&!form.dataset.expertiseAltTouched&&!form.elements.imageAlt.value.trim())form.elements.imageAlt.value=asset.alt_text;
  renderExpertiseEditorPreview(form);
  setDirty();
}

function filteredExpertiseMediaAssets() {
  const search=expertiseMediaSearch.value.trim().toLowerCase();
  return expertiseMediaAssets.filter((asset)=>{
    const isExpertise=asset.storage_path?.startsWith('expertise/images/');
    return (expertiseMediaFilter==='all'||isExpertise)&&(!search||`${asset.original_filename||''} ${asset.alt_text||''}`.toLowerCase().includes(search));
  });
}

function renderExpertiseMediaPicker() {
  const assets=filteredExpertiseMediaAssets();
  expertiseMediaGrid.innerHTML=assets.map((asset)=>{
    const selected=asset.id===selectedExpertiseMediaAssetId;
    return `<button type="button" class="media-picker-card" role="option" aria-selected="${selected}" data-expertise-media-id="${esc(asset.id)}">
      <span class="media-picker-card__image"><img src="${esc(asset.publicUrl)}" alt=""></span>
      <span class="media-picker-card__body"><strong>${esc(asset.original_filename)}</strong>
        <dl><div><dt>Type</dt><dd>${esc(asset.mime_type)}</dd></div><div><dt>Size</dt><dd>${esc(formatBytes(asset.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div></dl>
        <span class="media-picker-card__usage">${asset.usedBy?.length?`Used by ${esc(asset.usedBy.join(', '))}`:'Not currently used by homepage content'}</span>
      </span>
    </button>`;
  }).join('');
  if(!assets.length)expertiseMediaGrid.innerHTML='<div class="empty-state"><h3>No matching images</h3><p>Try another search or view all uploaded images.</p></div>';
  const selected=assets.find((asset)=>asset.id===selectedExpertiseMediaAssetId);
  expertiseMediaStatus.textContent=selected?`${selected.original_filename} selected. ${assets.length} image${assets.length===1?'':'s'} shown.`:`${assets.length} image${assets.length===1?'':'s'} available.`;
  expertiseMediaPicker.querySelector('[data-action="use-expertise-media"]').disabled=!selected;
}

async function openExpertiseMediaPicker(form) {
  expertiseMediaTargetForm=form;
  selectedExpertiseMediaAssetId=form.elements.backgroundImageAssetId.value||'';
  expertiseMediaFilter='expertise';
  expertiseMediaSearch.value='';
  expertiseMediaPicker.querySelectorAll('[data-expertise-media-filter]').forEach((button)=>button.classList.toggle('is-active',button.dataset.expertiseMediaFilter===expertiseMediaFilter));
  expertiseMediaGrid.innerHTML='';expertiseMediaStatus.textContent='Loading images…';
  expertiseMediaPicker.querySelector('[data-action="use-expertise-media"]').disabled=true;
  expertiseMediaPicker.showModal();expertiseMediaSearch.focus();
  try{expertiseMediaAssets=await getExpertiseSlideImageAssets();renderExpertiseMediaPicker();}
  catch(error){expertiseMediaAssets=[];expertiseMediaStatus.textContent=`Media Library could not be loaded: ${error.message}`;expertiseMediaGrid.innerHTML='<div class="empty-state"><h3>Images unavailable</h3><p>Close this window and try again.</p></div>';}
}

function closeExpertiseMediaPicker(){if(expertiseMediaPicker.open)expertiseMediaPicker.close();expertiseMediaTargetForm=null;selectedExpertiseMediaAssetId='';}

function logoImagePanelMarkup(asset,publicUrl) {
  const usage=asset?.usedBy?.length?asset.usedBy.join(', '):'Not currently used';
  return `<div class="field field--full logo-image-panel" data-logo-image-panel>
    <span class="field__label">Logo image</span>
    <div class="selected-image-panel">
      <div class="selected-image-panel__preview">${publicUrl?`<img src="${esc(publicUrl)}" alt="">`:'<span>No logo selected</span>'}</div>
      <div class="selected-image-panel__details"><strong data-logo-filename>${esc(asset?.original_filename||'No file selected')}</strong><dl><div><dt>MIME type</dt><dd>${esc(asset?.mime_type||'—')}</dd></div><div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div><div><dt>Usage</dt><dd>${esc(usage)}</dd></div></dl></div>
      <div class="selected-image-panel__actions"><button type="button" class="button button--quiet" data-action="upload-logo-image">${asset?'Replace logo':'Upload new logo'}</button><button type="button" class="button button--quiet" data-action="choose-logo-media">Choose from Media Library</button><button type="button" class="button button--text" data-action="remove-logo-image" ${asset?'':'disabled'}>Remove logo</button></div>
    </div>
    <input class="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp,image/avif" data-logo-image-file>
    <progress class="upload-progress" data-logo-upload-progress max="100" value="0" hidden></progress>
    <p class="field-help" data-logo-image-status>PNG or WebP with transparency is recommended. JPEG and AVIF are also accepted, up to 4 MB.</p>
  </div>`;
}

function applyLogoImageSelection(form,asset,publicUrl,options={}) {
  if(!form)return;
  logoEditorImage={asset:asset||null,publicUrl:publicUrl||''};
  form.elements.logoAssetId.value=asset?.id||'';
  form.elements.logo.value=publicUrl||'';
  if(options.prefillAlt&&asset?.alt_text&&!form.dataset.logoAltTouched&&!form.elements.altText.value.trim())form.elements.altText.value=asset.alt_text;
  setDirty();renderLogoEditorPreview(form);
  const panel=form.querySelector('[data-logo-image-panel]');
  if(panel)panel.outerHTML=logoImagePanelMarkup(asset,publicUrl);
}

function filteredLogoMediaAssets() {
  const search=logoMediaSearch.value.trim().toLowerCase();
  return logoMediaAssets.filter((asset)=>{
    const preferred=asset.storage_path?.startsWith('logo-bridge/logos/');
    const matchesFilter=logoMediaFilter==='all'||preferred;
    const matchesSearch=!search||`${asset.original_filename||''} ${asset.alt_text||''}`.toLowerCase().includes(search);
    return matchesFilter&&matchesSearch;
  });
}

function renderLogoMediaPicker() {
  const assets=filteredLogoMediaAssets();
  logoMediaGrid.innerHTML=assets.map((asset)=>{
    const selected=asset.id===selectedLogoMediaAssetId;
    return `<button type="button" class="media-picker-card" role="option" aria-selected="${selected}" data-logo-media-id="${esc(asset.id)}"><span class="media-picker-card__image"><img src="${esc(asset.publicUrl)}" alt=""></span><span class="media-picker-card__body"><strong>${esc(asset.original_filename)}</strong><dl><div><dt>Type</dt><dd>${esc(asset.mime_type)}</dd></div><div><dt>Size</dt><dd>${esc(formatBytes(asset.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div><div><dt>Usage</dt><dd>${esc(asset.usedBy?.join(', ')||'Unused')}</dd></div></dl>${asset.preferred?'<span class="media-picker-card__preferred">Logo Bridge upload</span>':''}</span></button>`;
  }).join('');
  if(!assets.length)logoMediaGrid.innerHTML='<div class="empty-state"><h3>No matching logo images</h3><p>Upload a logo or show all homepage images.</p></div>';
  const selected=assets.find((asset)=>asset.id===selectedLogoMediaAssetId);
  logoMediaStatus.textContent=selected?`${selected.original_filename} selected. ${assets.length} image${assets.length===1?'':'s'} shown.`:`${assets.length} image${assets.length===1?'':'s'} available. Logo Bridge uploads are listed first.`;
  logoMediaPicker.querySelector('[data-action="use-logo-media"]').disabled=!selected;
}

async function openLogoMediaPicker(form) {
  logoMediaTargetForm=form;selectedLogoMediaAssetId=form.elements.logoAssetId.value;logoMediaSearch.value='';logoMediaGrid.innerHTML='';logoMediaStatus.textContent='Loading logo images…';
  logoMediaPicker.querySelector('[data-action="use-logo-media"]').disabled=true;logoMediaPicker.showModal();logoMediaSearch.focus();
  try{logoMediaAssets=await getLogoBridgeImageAssets();renderLogoMediaPicker();}
  catch(error){logoMediaAssets=[];logoMediaStatus.textContent=`Media Library could not be loaded: ${error.message}`;logoMediaGrid.innerHTML='<div class="empty-state"><h3>Media unavailable</h3><p>Close this window and try again.</p></div>';}
}

function closeLogoMediaPicker(){if(logoMediaPicker.open)logoMediaPicker.close();logoMediaTargetForm=null;selectedLogoMediaAssetId='';}

function newsImagePanelMarkup(asset,publicUrl) {
  const hasImage=Boolean(asset?.id&&publicUrl);
  return `<div class="field field--full" data-news-image-panel>
    <span class="field__label">Article image</span>
    <div class="project-image-panel">
      <div class="project-image-panel__preview">${hasImage?`<img src="${esc(publicUrl)}" alt="">`:'<span>No image selected</span>'}</div>
      <div class="project-image-panel__details">
        <strong>${esc(asset?.original_filename||'No article image selected')}</strong>
        <dl>
          <div><dt>File type</dt><dd>${esc(asset?.mime_type||'—')}</dd></div>
          <div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div>
          <div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div>
        </dl>
        <div class="header-actions">
          <button type="button" class="button button--quiet" data-action="upload-news-image">${hasImage?'Upload replacement':'Upload new image'}</button>
          <button type="button" class="button button--quiet" data-action="choose-news-media">${hasImage?'Choose replacement':'Choose from Media Library'}</button>
          <button type="button" class="button button--text" data-action="remove-news-image" ${hasImage?'':'disabled'}>Remove</button>
        </div>
        <p class="project-image-panel__status" data-news-image-status aria-live="polite"></p>
        <progress class="upload-progress" data-news-upload-progress max="100" value="0" hidden></progress>
      </div>
    </div>
    <input class="visually-hidden" type="file" data-news-image-file accept="image/jpeg,image/png,image/webp,image/avif">
  </div>`;
}

function applyNewsImageSelection(form,asset,publicUrl,options={}) {
  if(!form)return;
  newsEditorImage={asset:asset||null,publicUrl:publicUrl||''};
  form.elements.imageAssetId.value=asset?.id||'';
  form.elements.image.value=publicUrl||'';
  form.elements.imageAlt.required=Boolean(asset?.id);
  form.querySelector('[data-news-image-panel]')?.replaceWith(document.createRange().createContextualFragment(newsImagePanelMarkup(asset,publicUrl)));
  const preview=form.querySelector('[data-news-editor-preview] .preview-item__image');
  if(preview)preview.innerHTML=publicUrl?`<img src="${esc(publicUrl)}" alt="${esc(form.elements.imageAlt.value)}">`:'<span>No image selected</span>';
  if(options.prefillAlt&&asset?.alt_text&&!form.dataset.newsAltTouched&&!form.elements.imageAlt.value.trim()) {
    form.elements.imageAlt.value=asset.alt_text;
    preview?.querySelector('img')?.setAttribute('alt',asset.alt_text);
  }
  setDirty();
}

function filteredNewsMediaAssets() {
  const search=newsMediaSearch.value.trim().toLowerCase();
  return newsMediaAssets.filter((asset)=>{
    const isNews=asset.storage_path?.startsWith('news-foresight/images/');
    const matchesFilter=newsMediaFilter==='all'||isNews;
    const matchesSearch=!search||`${asset.original_filename||''} ${asset.alt_text||''}`.toLowerCase().includes(search);
    return matchesFilter&&matchesSearch;
  });
}

function renderNewsMediaPicker() {
  const assets=filteredNewsMediaAssets();
  newsMediaGrid.innerHTML=assets.map((asset)=>{
    const selected=asset.id===selectedNewsMediaAssetId;
    return `<button type="button" class="media-picker-card" role="option" aria-selected="${selected}" data-news-media-id="${esc(asset.id)}">
      <span class="media-picker-card__image"><img src="${esc(asset.publicUrl)}" alt=""></span>
      <span class="media-picker-card__body"><strong>${esc(asset.original_filename)}</strong>
        <dl><div><dt>Type</dt><dd>${esc(asset.mime_type)}</dd></div><div><dt>Size</dt><dd>${esc(formatBytes(asset.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div></dl>
        <span class="media-picker-card__usage">${asset.usedBy?.length?`Used by ${esc(asset.usedBy.join(', '))}`:'Not currently used by homepage content'}</span>
      </span>
    </button>`;
  }).join('');
  if(!assets.length)newsMediaGrid.innerHTML='<div class="empty-state"><h3>No matching images</h3><p>Try another search or view all uploaded images.</p></div>';
  const selected=assets.find((asset)=>asset.id===selectedNewsMediaAssetId);
  newsMediaStatus.textContent=selected?`${selected.original_filename} selected. ${assets.length} image${assets.length===1?'':'s'} shown.`:`${assets.length} image${assets.length===1?'':'s'} available.`;
  newsMediaPicker.querySelector('[data-action="use-news-media"]').disabled=!selected;
}

async function openNewsMediaPicker(form) {
  newsMediaTargetForm=form;
  selectedNewsMediaAssetId=form.elements.imageAssetId.value||'';
  newsMediaFilter='news';
  newsMediaSearch.value='';
  newsMediaPicker.querySelectorAll('[data-news-media-filter]').forEach((button)=>button.classList.toggle('is-active',button.dataset.newsMediaFilter===newsMediaFilter));
  newsMediaGrid.innerHTML='';newsMediaStatus.textContent='Loading images…';
  newsMediaPicker.querySelector('[data-action="use-news-media"]').disabled=true;
  newsMediaPicker.showModal();newsMediaSearch.focus();
  try{newsMediaAssets=await getNewsArticleImageAssets();renderNewsMediaPicker();}
  catch(error){newsMediaAssets=[];newsMediaStatus.textContent=`Media Library could not be loaded: ${error.message}`;newsMediaGrid.innerHTML='<div class="empty-state"><h3>Images unavailable</h3><p>Close this window and try again.</p></div>';}
}

function closeNewsMediaPicker(){if(newsMediaPicker.open)newsMediaPicker.close();newsMediaTargetForm=null;selectedNewsMediaAssetId='';}

function formatDuration(value) {
  if (!Number.isFinite(Number(value))) return 'Pending validation';
  const seconds = Math.round(Number(value));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatEta(value) {
  if (!Number.isFinite(Number(value))) return 'Estimating…';
  const seconds = Math.max(0, Math.round(Number(value)));
  if (seconds < 60) return `${seconds}s remaining`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s remaining`;
}

function isHeroVideoUploadActive() {
  return ['Validating','Preparing upload','Uploading','Paused','Resuming','Processing metadata'].includes(heroVideoUploadUi.state);
}

function canControlHeroVideoUpload() {
  return ['Validating','Preparing upload','Uploading','Paused','Resuming','Failed'].includes(heroVideoUploadUi.state);
}

function updateHeroVideoUploadUi(changes = {}) {
  if (changes.state && changes.state !== 'Failed' && !Object.prototype.hasOwnProperty.call(changes,'error')) changes.error = null;
  heroVideoUploadUi = { ...heroVideoUploadUi, ...changes };
  const card = workspace.querySelector('[data-hero-media-card="video"]');
  if (!card) return;
  const setText = (selector, value) => { const node=card.querySelector(selector); if(node)node.textContent=value; };
  setText('[data-upload-state]', heroVideoUploadUi.state);
  setText('[data-upload-message]', heroVideoUploadUi.message || '');
  setText('[data-upload-selected-name]', heroVideoUploadUi.fileName || heroEditorMedia.videoAsset?.original_filename || 'No video selected');
  setText('[data-upload-mime]', heroVideoUploadUi.mimeType || heroEditorMedia.videoAsset?.mime_type || '—');
  setText('[data-upload-byte-count]', `${formatBytes(heroVideoUploadUi.bytesUploaded)} of ${formatBytes(heroVideoUploadUi.bytesTotal)}`);
  setText('[data-upload-percentage]', `${Number(heroVideoUploadUi.percentage||0).toFixed(1)}%`);
  setText('[data-upload-speed]', heroVideoUploadUi.speedBps ? `${formatBytes(heroVideoUploadUi.speedBps)}/s` : '—');
  setText('[data-upload-eta]', heroVideoUploadUi.speedBps ? formatEta(heroVideoUploadUi.etaSeconds) : '—');
  const progress=card.querySelector('[data-video-upload-progress]');if(progress)progress.value=Number(heroVideoUploadUi.percentage||0);
  const state=heroVideoUploadUi.state;
  const toggle=(action,show)=>{const button=card.querySelector(`[data-action="${action}"]`);if(button)button.hidden=!show;};
  toggle('pause-hero-upload',['Uploading','Resuming'].includes(state));
  toggle('resume-hero-upload',state==='Paused');
  toggle('cancel-hero-upload',canControlHeroVideoUpload());
  toggle('retry-hero-upload',state==='Failed');
  workspace.querySelectorAll('[data-form="hero"] [data-action="upload-hero-media"]').forEach((button)=>{button.disabled=isHeroVideoUploadActive()||(state==='Failed'&&heroVideoUploadUi.controllerActive);});
  const publishButton=workspace.querySelector('[data-form="hero"] button[value="publish"]');if(publishButton)publishButton.disabled=isHeroVideoUploadActive();
}

function inspectHeroFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const finish = (metadata) => { URL.revokeObjectURL(url); resolve(metadata); };
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => finish({ width:video.videoWidth||null, height:video.videoHeight||null, durationSeconds:Number.isFinite(video.duration)?video.duration:null });
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected video could not be read or validated.')); };
      video.src = url;
    } else {
      const image = new Image();
      image.onload = () => finish({ width:image.naturalWidth||null, height:image.naturalHeight||null });
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The selected poster image could not be read or validated.')); };
      image.src = url;
    }
  });
}

function heroPreviewMarkup(item) {
  const videoUrl = heroEditorMedia.videoUrl;
  const posterUrl = heroEditorMedia.posterUrl;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showVideo = videoUrl && !reducedMotion;
  return `<div class="media-preview hero-media-preview" data-hero-preview data-device="desktop">${showVideo ? `<video src="${esc(videoUrl)}" poster="${esc(posterUrl)}" autoplay muted playsinline ${item.loopEnabled ? 'loop' : ''} data-hero-preview-video></video>` : posterUrl ? `<img src="${esc(posterUrl)}" alt="${esc(item.posterAltText||'')}">` : '<div class="hero-media-preview__empty">No Hero video or poster selected</div>'}<div class="media-preview__copy"><h3>${esc(item.heading)}</h3></div>${!showVideo && posterUrl ? `<span class="hero-media-preview__label">${videoUrl?'Poster fallback preview':'Poster background preview'}</span>` : ''}</div>`;
}

function videoUploadControl(item) {
  const asset = heroEditorMedia.videoAsset;
  const state=heroVideoUploadUi.state;
  return `<article class="hero-upload-card hero-upload-card--video" data-hero-media-card="video"><div><p class="field__label">Background video <span class="field-help">(optional)</span></p><strong data-media-filename>${esc(asset?.original_filename || 'No video uploaded')}</strong><dl><div><dt>Duration</dt><dd data-media-duration>${formatDuration(asset?.duration_seconds)}</dd></div><div><dt>File size</dt><dd data-media-size>${formatBytes(asset?.size_bytes)}</dd></div></dl><p class="field-help">Optional. Without a video, the poster image is used as the permanent Hero background.</p></div><div class="hero-upload-card__actions"><button type="button" class="button button--quiet" data-action="upload-hero-media" data-media-type="video" ${isHeroVideoUploadActive()?'disabled':''}>${asset ? 'Replace video' : 'Upload video'}</button><button type="button" class="button button--quiet" data-action="remove-hero-media" data-media-type="video" ${!isHeroVideoUploadActive()&&state!=='Failed'&&(asset||heroVideoUploadUi.fileName) ? '' : 'disabled'}>Remove video</button></div><div class="hero-upload-state"><div class="hero-upload-state__heading"><strong data-upload-state>${esc(state)}</strong><span data-upload-percentage>${Number(heroVideoUploadUi.percentage||0).toFixed(1)}%</span></div><p data-upload-message>${esc(heroVideoUploadUi.message||'')}</p><dl><div><dt>Selected file</dt><dd data-upload-selected-name>${esc(heroVideoUploadUi.fileName||asset?.original_filename||'No video selected')}</dd></div><div><dt>MIME type</dt><dd data-upload-mime>${esc(heroVideoUploadUi.mimeType||asset?.mime_type||'—')}</dd></div><div><dt>Transferred</dt><dd data-upload-byte-count>${formatBytes(heroVideoUploadUi.bytesUploaded)} of ${formatBytes(heroVideoUploadUi.bytesTotal)}</dd></div><div><dt>Speed</dt><dd data-upload-speed>${heroVideoUploadUi.speedBps?`${formatBytes(heroVideoUploadUi.speedBps)}/s`:'—'}</dd></div><div><dt>ETA</dt><dd data-upload-eta>${heroVideoUploadUi.speedBps?formatEta(heroVideoUploadUi.etaSeconds):'—'}</dd></div></dl><progress data-video-upload-progress max="100" value="${Number(heroVideoUploadUi.percentage||0)}"></progress><div class="hero-upload-state__actions"><button type="button" class="button button--quiet" data-action="pause-hero-upload" ${['Uploading','Resuming'].includes(state)?'':'hidden'}>Pause</button><button type="button" class="button button--quiet" data-action="resume-hero-upload" ${state==='Paused'?'':'hidden'}>Resume</button><button type="button" class="button button--quiet" data-action="cancel-hero-upload" ${canControlHeroVideoUpload()?'':'hidden'}>Cancel</button><button type="button" class="button button--quiet" data-action="retry-hero-upload" ${state==='Failed'?'':'hidden'}>Retry</button></div></div></article>`;
}

function posterUploadControl(item) {
  const asset = heroEditorMedia.posterAsset;
  return `<article class="hero-upload-card hero-upload-card--poster" data-hero-media-card="poster">${heroEditorMedia.posterUrl ? `<img class="hero-upload-card__thumbnail" src="${esc(heroEditorMedia.posterUrl)}" alt="">` : '<div class="hero-upload-card__thumbnail hero-upload-card__thumbnail--empty">No poster</div>'}<div><p class="field__label">Poster image</p><strong data-media-filename>${esc(asset?.original_filename || 'No poster uploaded')}</strong><p class="field-help">JPEG, PNG, WebP, or AVIF.</p></div><div class="hero-upload-card__actions"><button type="button" class="button button--quiet" data-action="upload-hero-media" data-media-type="poster">${asset ? 'Replace poster' : 'Upload poster'}</button><button type="button" class="button button--quiet" data-action="remove-hero-media" data-media-type="poster" ${asset ? '' : 'disabled'}>Remove poster</button></div></article>`;
}

function renderNav() {
  sidebarNav.innerHTML = `<p class="sidebar__group">Homepage</p>${navItems.map(([key, label, icon]) => `<a href="#${key}" class="${route() === key ? 'is-active' : ''}" data-route="${key}"><b class="nav-icon" aria-hidden="true">${icon}</b><span>${esc(label)}</span></a>`).join('')}`;
}

function renderOverview() {
  const discovery = discoveryToEditor(discoveryRecord);
  const expertiseItems=expertiseSlideDrafts??[];
  const allItems = [...state.featuredProjects, ...expertiseItems, ...state.newsArticles, ...state.businessSnapshot.statistics];
  const drafts = allItems.filter((item) => item.status === 'draft').length + [state.hero, discovery, state.businessSnapshot.settings].filter((item) => item.status === 'draft').length;
  const published = allItems.filter((item) => item.status === 'published').length + [state.hero, discovery, state.businessSnapshot.settings].filter((item) => item.status === 'published').length;
  const missingMedia = [...state.featuredProjects, ...expertiseItems, ...state.newsArticles].filter((item) => !item.image).length;
  const missingAlt = [...state.featuredProjects, ...expertiseItems, ...state.newsArticles].filter((item) => item.image && !item.imageAlt).length + state.mediaAssets.filter((asset) => asset.type === 'image' && !asset.altText).length;
  const recent = [...state.featuredProjects, ...expertiseItems, ...state.newsArticles, state.hero, discovery].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)).slice(0, 5);
  workspace.innerHTML = `${pageHeader('Control room', 'Homepage overview', 'Review content readiness, warnings, and recent editorial activity before publishing.', '<button class="button button--primary" data-action="preview">Preview homepage</button>')}
    <section class="summary-grid" aria-label="Homepage summary">
      <article class="summary-card"><strong class="summary-card__value">${state.homepageSections.filter((item) => item.visible).length}</strong><p>Visible homepage sections</p></article>
      <article class="summary-card"><strong class="summary-card__value">${drafts}</strong><p>Draft items</p></article>
      <article class="summary-card summary-card--positive"><strong class="summary-card__value">${published}</strong><p>Published items</p></article>
      <article class="summary-card summary-card--warning"><strong class="summary-card__value">${missingMedia + missingAlt}</strong><p>Content warnings</p></article>
    </section>
    <div class="dashboard-grid"><div>
      <section class="panel"><header class="panel__header"><h2>Homepage sections</h2><span>${state.homepageSections.length} total</span></header><div class="panel__body"><ul class="status-list">${state.homepageSections.sort((a,b) => a.order-b.order).map((section) => { const current = section.id === 'discovery' ? {...section,status:discovery.status,visible:discovery.visible} : section; return `<li class="status-row"><div class="status-row__main"><span class="connection-dot"></span><div><strong>${esc(current.label)}</strong><small>Position ${current.order}</small></div></div><div>${statusBadge(current.visible ? current.status : 'hidden')} <a class="button button--text" href="#${current.id === 'snapshot' ? 'snapshot' : current.id}">Quick edit</a></div></li>`; }).join('')}</ul></div></section>
      <section class="panel"><header class="panel__header"><h2>Recently edited</h2></header><div class="panel__body"><ul class="status-list">${recent.map((item) => `<li class="status-row"><div class="status-row__main"><div><strong>${esc(item.title || item.heading || item.id)}</strong><small>${formatDate(item.updatedAt)}</small></div></div>${statusBadge(item.status)}</li>`).join('')}</ul></div></section>
    </div><aside><section class="panel"><header class="panel__header"><h2>Content health</h2></header><div class="panel__body"><ul class="status-list"><li class="status-row"><div class="status-row__main"><span class="warning-dot"></span><div><strong>${missingMedia} missing media</strong><small>Add imagery before publishing.</small></div></div></li><li class="status-row"><div class="status-row__main"><span class="warning-dot"></span><div><strong>${missingAlt} missing alt text</strong><small>Editorial warning, drafts may still save.</small></div></div></li></ul></div></section><section class="panel"><header class="panel__header"><h2>Local prototype</h2></header><div class="panel__body"><p class="field-help">All changes are stored in this browser only. No backend, account, or public website content is connected.</p></div></section></aside></div>`;
}

function renderHero() {
  const item = heroDraft || state.hero;
  heroEditorMedia = { videoAsset:item.media?.videoAsset||null, posterAsset:item.media?.posterAsset||null, videoUrl:item.media?.videoUrl||'', posterUrl:item.media?.posterUrl||'' };
  workspace.innerHTML = `${pageHeader('Homepage section', 'Hero', 'Edit the opening message and its media without changing the public homepage.')}
    ${heroLoadError ? `<div class="database-state database-state--error" role="alert">Supabase could not load the Hero. The initial mock value is shown for safety. ${esc(heroLoadError)}</div>` : ''}
    <form class="editor-form" data-form="hero"><div class="form-layout"><div>
      <section class="form-section"><h2>Content</h2><div class="form-grid">${field('heading','Main heading',item.heading,{required:true,help:'Recommended: 25–65 characters.'})}</div></section>
      <section class="form-section"><h2>Media and presentation</h2><input type="hidden" name="backgroundVideoAssetId" value="${esc(item.backgroundVideoAssetId||'')}"><input type="hidden" name="posterAssetId" value="${esc(item.posterAssetId||'')}"><div class="hero-upload-stack">${videoUploadControl(item)}${posterUploadControl(item)}</div><div class="form-grid hero-presentation-fields">${field('posterAltText','Poster alt text',item.posterAltText,{full:true,help:'Describe the poster image shown while the video loads or when motion is reduced.'})}<div class="field"><span class="field__label">Loop video</span>${checkbox('loopEnabled','Loop the muted Hero video',item.loopEnabled !== false)}</div><div class="field"><span class="field__label">Mobile video</span>${checkbox('mobileVideoEnabled','Play video on mobile',item.mobileVideoEnabled !== false)}</div>${selectField('playbackRate','Playback speed',String(item.playbackRate||1),[['0.75','0.75×'],['1','1×'],['1.25','1.25×']])}${selectField('status','Editorial status',publishedHero?.isVisible?'published':'draft',[['draft','Draft'],['published','Published']])}<div class="field"><span class="field__label">Visibility</span>${checkbox('isVisible','Show on homepage after publishing',item.isVisible !== false)}</div></div><input class="visually-hidden" type="file" data-hero-file><progress class="upload-progress" data-upload-progress max="100" value="0" hidden></progress></section>
      ${formActions()}
    </div><aside class="preview-card"><header class="preview-card__header"><strong>Hero preview</strong><div class="device-toggle"><button type="button" class="is-active">Desktop</button><button type="button">Mobile</button></div></header><div class="preview-card__body">${heroPreviewMarkup(item)}</div></aside></div></form>`;
  const previewVideo=workspace.querySelector('[data-hero-preview-video]');if(previewVideo)previewVideo.playbackRate=Number(item.playbackRate||1);
  updateHeroVideoUploadUi();
}

function renderDiscovery() {
  const item = discoveryToEditor(discoveryRecord);
  workspace.innerHTML = `${pageHeader('Homepage section', 'Discovery Bridge', 'Manage the values statement between the hero and Featured Projects.')}
    ${discoveryLoadError ? `<div class="database-state database-state--error" role="alert">Supabase could not load this record. The existing mock value is shown for safety. ${esc(discoveryLoadError)}</div>` : ''}
    <form class="editor-form" data-form="discovery"><div class="form-layout"><div><section class="form-section"><h2>Bridge content</h2><div class="form-grid">${textarea('paragraph','Main paragraph',item.paragraph,{required:true,maxlength:500,help:'Recommended: 180–320 characters.'})}${field('buttonLabel','Learn More button label',item.buttonLabel,{required:true})}${field('buttonUrl','Learn More destination',item.buttonUrl,{type:'url',required:true})}${selectField('alignment','Text alignment',item.alignment,[['left','Left'],['center','Centre'],['right','Right']])}${selectField('status','Editorial status',item.status,[['draft','Draft'],['published','Published']])}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show on homepage',item.visible !== false)}</div></div></section>${formActions()}</div><aside class="preview-card"><header class="preview-card__header"><strong>Section preview</strong><span>${statusBadge(item.status)}</span></header><div class="preview-card__body"><div class="preview-discovery preview-section" data-discovery-preview style="text-align:${esc(item.alignment)}"><p data-discovery-preview-paragraph>${esc(item.paragraph)}</p><button class="button button--primary" type="button" style="margin-top:28px" data-discovery-preview-button>${esc(item.buttonLabel)}</button></div><p class="field-help">Last saved ${formatDate(item.updatedAt)}</p></div></aside></div></form>`;
}

const collectionConfig = {
  projects: { key: 'featuredProjects', label: 'Featured Projects', singular: 'project', description: 'Manage homepage project blocks, their layout direction, media, and publication state.' },
  expertise: { key: 'expertiseSlides', label: 'Expertise Slides', singular: 'slide', description: 'Manage the sticky expertise story without changing its public scroll behavior.' },
  news: { key: 'newsArticles', label: 'News & Foresight', singular: 'article', description: 'Manage homepage editorial cards and publication details.' }
};

function collectionImage(item) { return item.image || ''; }
function collectionTitle(item) { return item.title || item.heading || 'Untitled item'; }

function renderCollection(routeKey) {
  const config = collectionConfig[routeKey];
  const source=routeKey==='projects'?(featuredProjectDrafts??state.featuredProjects):routeKey==='news'?(newsArticleDrafts??[]):routeKey==='expertise'?(expertiseSlideDrafts??[]):state[config.key];
  const items = [...source].sort((a,b) => a.order-b.order);
  const add = `<button class="button button--accent" data-action="add-item" data-collection="${routeKey}">Add ${config.singular}</button>`;
  const collectionActions=routeKey==='projects'?`${add}<button class="button button--quiet" data-action="unpublish-projects">Unpublish</button><button class="button button--accent" data-action="publish-projects">Publish collection</button>`:routeKey==='news'?`${add}<button class="button button--quiet" data-action="unpublish-news">Unpublish</button><button class="button button--accent" data-action="publish-news">Publish collection</button>`:routeKey==='expertise'?`${add}<button class="button button--quiet" data-action="unpublish-expertise">Unpublish</button><button class="button button--accent" data-action="publish-expertise">Publish section</button>`:add;
  const expertiseSettings=expertiseSectionDraft||{sectionLabel:'OUR EXPERTISE',visible:true,status:'draft'};
  workspace.innerHTML = `${pageHeader('Homepage collection', config.label, config.description, collectionActions)}
    ${routeKey==='projects'&&featuredProjectsLoadError?`<div class="database-state database-state--error" role="alert">Featured Projects could not load from Supabase. ${esc(featuredProjectsLoadError)}</div>`:''}
    ${routeKey==='news'&&newsLoadError?`<div class="database-state database-state--error" role="alert">News &amp; Foresight could not load from Supabase. ${esc(newsLoadError)}</div>`:''}
    ${routeKey==='news'&&newsLoading?'<div class="database-state" role="status">Loading News &amp; Foresight drafts from Supabase…</div>':''}
    ${routeKey==='expertise'&&expertiseLoadError?`<div class="database-state database-state--error" role="alert">Expertise Slides could not load from Supabase. ${esc(expertiseLoadError)}</div>`:''}
    ${routeKey==='expertise'&&expertiseLoading?'<div class="database-state" role="status">Loading Expertise drafts from Supabase…</div>':''}
    ${routeKey==='expertise'?`<form class="editor-form" data-form="expertise-settings"><section class="form-section"><h2>Section settings</h2><div class="form-grid">${field('sectionLabel','Section label',expertiseSettings.sectionLabel,{required:true,help:'This can later be changed to HOW WE DELIVER without changing code.'})}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',expertiseSettings.visible!==false)}</div></div><div class="form-actions"><button class="button button--accent" type="submit" name="intent" value="draft">Save section settings</button></div></section></form>`:''}
    <div class="collection-toolbar"><p class="field-help">Drag rows to reorder, or use the keyboard-friendly arrow controls.</p><button class="button button--quiet" data-action="preview">Preview section</button></div>
    ${items.length ? `<table class="data-table" data-sortable="${routeKey}"><thead><tr><th>Order</th><th>Media</th><th>${routeKey === 'news' ? 'Category' : 'Title'}</th><th>${routeKey === 'projects' ? 'Layout' : routeKey === 'news' ? 'Publication' : 'Slide'}</th>${routeKey==='news'?'<th>Featured</th>':''}<th>Status</th><th>Visible</th><th>Last edited</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map((item,index) => `<tr draggable="true" data-id="${item.id}"><td data-label="Order"><span class="drag-handle" aria-label="Drag ${esc(collectionTitle(item))}">⋮⋮</span> ${item.order}<div class="order-controls"><button type="button" data-action="move-item" data-direction="up" data-collection="${routeKey}" data-id="${item.id}" aria-label="Move up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-action="move-item" data-direction="down" data-collection="${routeKey}" data-id="${item.id}" aria-label="Move down" ${index === items.length-1 ? 'disabled' : ''}>↓</button></div></td><td data-label="Media">${collectionImage(item) ? `<img class="table-thumb" src="${esc(collectionImage(item))}" alt="">` : '<span>Missing</span>'}</td><td data-label="Title"><span class="data-table__title">${esc(routeKey === 'news' ? item.category : collectionTitle(item))}</span>${routeKey === 'news' ? `<br>${esc(item.title)}` : ''}</td><td data-label="Details">${routeKey === 'projects' ? esc(item.layout.replace('-', ' ')) : routeKey === 'news' ? formatDate(item.publicationDate) : `${String(item.order).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}`}</td>${routeKey==='news'?`<td data-label="Featured">${item.featured?'Yes':'No'}</td>`:''}<td data-label="Status">${statusBadge(item.status)}</td><td data-label="Visible">${item.visible ? 'Yes' : 'No'}</td><td data-label="Edited">${formatDate(item.updatedAt)}</td><td data-label="Actions"><div class="row-actions"><button data-action="edit-item" data-collection="${routeKey}" data-id="${item.id}">Edit</button><button data-action="duplicate-item" data-collection="${routeKey}" data-id="${item.id}">Duplicate</button><button data-action="delete-item" data-collection="${routeKey}" data-id="${item.id}">Delete draft</button>${routeKey==='news'?`<button data-action="delete-news-completely" data-id="${item.id}">Delete completely</button>`:routeKey==='expertise'?`<button data-action="delete-expertise-completely" data-id="${item.id}">Delete completely</button>`:''}</div></td></tr>`).join('')}</tbody></table>` : emptyState(`No ${config.label.toLowerCase()} yet`, `Add the first ${config.singular} to begin shaping this homepage section.`, add)}`;
  setupDragAndDrop();
}

function emptyState(title, text, action = '') { return `<div class="empty-state"><h3>${esc(title)}</h3><p>${esc(text)}</p>${action}</div>`; }

function renderItemEditor(routeKey, item, isNew = false) {
  if (routeKey === 'news') {
    const articleKey = articleKeyForEditor(item?.articleKey || item?.id);
    item = { ...item, id: articleKey, articleKey };
  }
  activeEditor = { routeKey, id: item.id, isNew };
  const config = collectionConfig[routeKey];
  let fields = '';
  let preview = '';
  if (routeKey === 'projects') {
    projectEditorImage = { asset:item.imageAsset || null, publicUrl:item.image || '' };
    fields = `${field('title','Project title',item.title,{required:true})}${textarea('description','Description',item.description,{required:true,maxlength:420})}<input type="hidden" name="imageAssetId" value="${esc(item.imageAssetId||'')}"><input type="hidden" name="image" value="${esc(item.image||'')}">${projectImagePanelMarkup(projectEditorImage.asset,projectEditorImage.publicUrl)}${field('imageAlt','Image alt text',item.imageAlt,{full:true,required:!!item.image})}${field('buttonLabel','Button label',item.buttonLabel)}${field('buttonUrl','Button destination',item.buttonUrl,{type:'url'})}${selectField('layout','Layout direction',item.layout,[['image-left','Image left, text right'],['image-right','Text left, image right']])}${field('order','Display order',item.order,{type:'number',min:1})}${selectField('status','Editorial status',item.status||'draft',[['draft','Draft'],['published','Published']])}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',item.visible!==false)}</div>`;
    preview = `<div class="preview-item">${mediaPreview(item.image,item.imageAlt)}<h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><span class="arrow-link">${esc(item.buttonLabel)} →</span></div>`;
  } else if (routeKey === 'expertise') {
    expertiseEditorImage={asset:item.imageAsset||null,publicUrl:item.image||''};
    const heading=item.heading||item.title||'',ctaLabel=item.ctaLabel??item.buttonLabel??'',ctaUrl=item.ctaUrl??item.buttonUrl??'',total=Math.max(1,(expertiseSlideDrafts||[]).length),sectionLabel=expertiseSectionDraft?.sectionLabel||'OUR EXPERTISE';
    fields = `${field('eyebrow','Slide eyebrow',item.eyebrow||'',{help:'Optional; when blank, the section label is shown.'})}${field('heading','Heading',heading,{required:true})}${textarea('description','Description',item.description,{required:true,maxlength:420})}<input type="hidden" name="backgroundImageAssetId" value="${esc(item.backgroundImageAssetId||item.imageAssetId||'')}"><input type="hidden" name="image" value="${esc(item.image||'')}">${expertiseImagePanelMarkup(expertiseEditorImage.asset,expertiseEditorImage.publicUrl)}${field('imageAlt','Image alt text',item.imageAlt,{full:true,required:!!item.image,help:'Meaningfully describe the visible image.'})}${field('focalX','Horizontal focal point',item.focalX??50,{type:'number',min:0,max:100,step:.01})}${field('focalY','Vertical focal point',item.focalY??50,{type:'number',min:0,max:100,step:.01})}${rangeField('overlayOpacity','Overlay opacity',Math.round(Number(item.overlayOpacity??.45)*100),0,100)}${field('ctaLabel','CTA label',ctaLabel)}${field('ctaUrl','CTA URL',ctaUrl,{type:'url'})}${field('order','Display order',item.order,{type:'number',min:1})}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',item.visible!==false)}</div><div class="field field--full"><span class="field__label">Visual focal point</span><div class="focal-preview" data-focal-selector>${item.image?`<img src="${esc(item.image)}" alt="${esc(item.imageAlt||'')}" style="object-position:${Number(item.focalX??50)}% ${Number(item.focalY??50)}%">`:'<span>No image selected</span>'}<span class="focal-preview__point" style="left:${Number(item.focalX??50)}%;top:${Number(item.focalY??50)}%"></span></div><p class="field-help">Click the image to update both focal-point fields.</p></div>`;
    preview = `<div class="expertise-preview" data-expertise-editor-preview style="--expertise-preview-overlay:${Number(item.overlayOpacity??.45)}"><img src="${esc(item.image||'')}" alt="${esc(item.imageAlt||'')}" style="object-position:${Number(item.focalX??50)}% ${Number(item.focalY??50)}%"><div class="expertise-preview__content"><p class="expertise-preview__meta"><span data-expertise-preview-label>${esc(item.eyebrow||sectionLabel)}</span><span data-expertise-preview-counter>${String(item.order).padStart(2,'0')} / ${String(total).padStart(2,'0')}</span></p><h3>${esc(heading)}</h3><p data-expertise-preview-description>${esc(item.description)}</p><a class="arrow-link" data-expertise-preview-cta href="${esc(ctaUrl||'#projects')}" ${ctaLabel&&ctaUrl?'':'hidden'}>${esc(ctaLabel)} <img src="../assets/right-arrow-green.svg" alt=""></a></div><div class="expertise-preview__progress"><span style="width:${Math.min(100,item.order/total*100)}%"></span></div></div>`;
  } else {
    newsEditorImage={asset:item.imageAsset||null,publicUrl:item.image||''};
    fields = `${field('category','Category',item.category,{required:true})}${field('title','Article title',item.title,{required:true,help:'Editorial guidance: 35–80 characters.'})}${textarea('summary','Summary',item.summary,{required:true,help:'Editorial guidance: 90–180 characters.'})}${field('publicationDate','Publication date',item.publicationDate,{type:'date'})}<input type="hidden" name="imageAssetId" value="${esc(item.imageAssetId||'')}"><input type="hidden" name="image" value="${esc(item.image||'')}">${newsImagePanelMarkup(newsEditorImage.asset,newsEditorImage.publicUrl)}${field('imageAlt','Image alt text',item.imageAlt,{full:true,required:!!item.image,help:'Describe the image meaningfully; do not repeat the filename.'})}${field('articleUrl','Article URL',item.articleUrl,{type:'url',full:true,help:'Use a full URL or an on-page #anchor.'})}<div class="field"><span class="field__label">Featured article</span>${checkbox('featured','Feature this article',item.featured)}</div>${field('order','Display order',item.order,{type:'number',min:1})}<div class="field"><span class="field__label">Editorial state</span><p>${statusBadge(item.status||'draft')}</p></div><div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',item.visible!==false)}</div>`;
    preview = `<div class="preview-item" data-news-editor-preview><div class="preview-item__image">${item.image?`<img src="${esc(item.image)}" alt="${esc(item.imageAlt||'')}">`:'<span>No image selected</span>'}</div><p class="eyebrow" style="margin-top:16px">${esc(item.category)}</p><h3>${esc(item.title)}</h3><p>${esc(item.summary)}</p></div>`;
  }
  const editorDescription=routeKey==='projects'||routeKey==='news'?'Save the draft without changing the published homepage.':'Changes are stored in local mock state until backend integration.';
  const actions=routeKey==='news'?`<div class="form-actions"><button class="button button--quiet" type="button" data-action="preview">Preview</button>${!isNew?'<button class="button button--danger" type="button" data-action="delete-current">Delete draft</button><button class="button button--danger" type="button" data-action="delete-news-completely">Delete completely</button>':''}<button class="button button--accent" type="submit" name="intent" value="draft">Save draft</button></div>`:routeKey==='expertise'?`<div class="form-actions"><button class="button button--quiet" type="button" data-action="preview">Preview</button>${!isNew?'<button class="button button--danger" type="button" data-action="delete-current">Delete draft</button><button class="button button--danger" type="button" data-action="delete-expertise-completely">Delete completely</button>':''}<button class="button button--accent" type="submit" name="intent" value="draft">Save draft</button></div>`:formActions({delete:!isNew});
  workspace.innerHTML = `${pageHeader(config.label, `${isNew ? 'Add' : 'Edit'} ${config.singular}`, editorDescription, `<button class="button button--quiet" data-action="back-to-list" data-collection="${routeKey}">Back to list</button>`)}<form class="editor-form" data-form="collection-item" data-collection="${routeKey}" data-id="${item.id}" ${routeKey==='expertise'?'novalidate':''}><div class="form-layout"><div><section class="form-section"><h2>${esc(config.singular)} details</h2><div class="form-grid">${fields}</div></section>${actions}</div><aside class="preview-card"><header class="preview-card__header"><strong>Live preview</strong></header><div class="preview-card__body">${preview}</div></aside></div></form>`;
  bindFocalSelector();
}

function logoBridgeSettingsForEditor() {
  return logoBridgeDraftSettings||{
    eyebrow:'OUR PARTNERS',heading:'Built through strong partnerships',
    description:'We work closely with clients, consultants, suppliers, and skilled trades to deliver dependable construction work.',
    visible:true,status:'draft',updatedAt:null
  };
}

function logoBridgePreviewMarkup(settings,items) {
  const visible=items.filter((item)=>item.visible!==false).sort((a,b)=>a.order-b.order);
  return `<div class="logo-admin-preview" data-logo-bridge-preview><div class="logo-admin-preview__intro"><p class="eyebrow">${esc(settings.eyebrow)}</p><h3>${esc(settings.heading)}</h3><p data-logo-preview-description ${settings.description?'':'hidden'}>${esc(settings.description||'')}</p></div><div class="logo-admin-preview__grid">${visible.map((item)=>`<div class="logo-admin-preview__item" data-logo-name="${esc(String(item.organizationName||'').trim().toLowerCase())}">${item.logo?`<img src="${esc(item.logo)}" alt="${esc(item.altText||'')}">`:'<span>Logo image</span>'}</div>`).join('')}</div></div>`;
}

function renderLogoBridge() {
  const settings=logoBridgeSettingsForEditor();
  const items=[...(logoBridgeDraftItems||[])].sort((a,b)=>a.order-b.order);
  const visibleCount=items.filter((item)=>item.visible!==false).length;
  const add='<button class="button button--accent" data-action="add-logo">Add logo</button>';
  workspace.innerHTML=`${pageHeader('Homepage collection','Logo Bridge','Manage the quiet partner-logo bridge between Expertise Slides and Business Snapshot.',`${add}<button class="button button--quiet" data-action="unpublish-logos">Unpublish</button><button class="button button--accent" data-action="publish-logos">Publish section</button>`)}
    ${logoBridgeLoadError?`<div class="database-state database-state--error" role="alert">Logo Bridge could not load from Supabase. ${esc(logoBridgeLoadError)}</div>`:''}
    ${logoBridgeLoading?'<div class="database-state" role="status">Loading Logo Bridge drafts from Supabase…</div>':''}
    ${visibleCount<4?'<div class="database-state database-state--warning" role="status">Four or more logos are recommended for a balanced desktop layout.</div>':''}
    <form class="editor-form" data-form="logo-settings"><div class="form-layout"><div><section class="form-section"><h2>Section content</h2><div class="form-grid">${field('eyebrow','Eyebrow',settings.eyebrow,{required:true})}${field('heading','Heading',settings.heading,{required:true,full:true})}${textarea('description','Description',settings.description,{full:true,maxlength:300})}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',settings.visible!==false)}</div></div><div class="form-actions"><button class="button button--accent" type="submit" name="intent" value="draft">Save section draft</button></div></section></div><aside class="preview-card"><header class="preview-card__header"><strong>Live preview</strong>${statusBadge(publishedLogoBridgeSettings?.visible?'published':'draft')}</header><div class="preview-card__body">${logoBridgePreviewMarkup(settings,items)}</div></aside></div></form>
    <div class="collection-toolbar"><p class="field-help">Drag rows to reorder, or use the keyboard-friendly arrow controls.</p><span>${visibleCount} visible logo${visibleCount===1?'':'s'}</span></div>
    ${items.length?`<table class="data-table" data-sortable="logos"><thead><tr><th>Order</th><th>Logo</th><th>Organisation</th><th>Status</th><th>Visible</th><th>Usage</th><th>Last edited</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>${items.map((item,index)=>`<tr draggable="true" data-id="${esc(item.logoKey)}"><td data-label="Order"><span class="drag-handle" aria-label="Drag ${esc(item.organizationName||'logo')}">⋮⋮</span> ${item.order}<div class="order-controls"><button type="button" data-action="move-logo" data-direction="up" data-id="${esc(item.logoKey)}" aria-label="Move ${esc(item.organizationName||'logo')} up" ${index===0?'disabled':''}>↑</button><button type="button" data-action="move-logo" data-direction="down" data-id="${esc(item.logoKey)}" aria-label="Move ${esc(item.organizationName||'logo')} down" ${index===items.length-1?'disabled':''}>↓</button></div></td><td data-label="Logo">${item.logo?`<img class="table-thumb table-thumb--logo" src="${esc(item.logo)}" alt="">`:'<span>Missing</span>'}</td><td data-label="Organisation"><span class="data-table__title">${esc(item.organizationName||'Untitled logo')}</span></td><td data-label="Status">${statusBadge(item.status)}</td><td data-label="Visible">${item.visible?'Yes':'No'}</td><td data-label="Usage">${esc(item.usage?.join(', ')||'Draft only')}</td><td data-label="Edited">${formatDate(item.updatedAt)}</td><td data-label="Actions"><div class="row-actions"><button data-action="edit-logo" data-id="${esc(item.logoKey)}">Edit</button><button data-action="duplicate-logo" data-id="${esc(item.logoKey)}">Duplicate</button><button data-action="delete-logo-draft" data-id="${esc(item.logoKey)}">Delete draft</button><button data-action="delete-logo-completely" data-id="${esc(item.logoKey)}">Delete completely</button></div></td></tr>`).join('')}</tbody></table>`:emptyState('No Logo Bridge drafts yet','Add the first approved organisation logo. Placeholder logos cannot be published.',add)}`;
  setupDragAndDrop();
}

function renderLogoEditor(item,isNew=false) {
  activeEditor={routeKey:'logos',id:item.logoKey||item.id,isNew};
  logoEditorImage={asset:item.logoAsset||null,publicUrl:item.logo||''};
  const actions=`<div class="form-actions"><button class="button button--quiet" type="button" data-action="back-to-logos">Back to list</button>${!isNew?'<button class="button button--danger" type="button" data-action="delete-logo-draft">Delete draft</button><button class="button button--danger" type="button" data-action="delete-logo-completely">Delete completely</button>':''}<button class="button button--accent" type="submit" name="intent" value="draft">Save draft</button></div>`;
  workspace.innerHTML=`${pageHeader('Logo Bridge',`${isNew?'Add':'Edit'} logo`,'Save the draft without changing the currently published Logo Bridge.','<button class="button button--quiet" data-action="back-to-logos">Back to list</button>')}<form class="editor-form" data-form="logo-item" data-id="${esc(item.logoKey||item.id)}" novalidate><div class="form-layout"><div><section class="form-section"><h2>Logo details</h2><div class="form-grid">${field('organizationName','Organisation name',item.organizationName||'',{help:'Required before publishing.'})}<input type="hidden" name="logoAssetId" value="${esc(item.logoAssetId||'')}"><input type="hidden" name="logo" value="${esc(item.logo||'')}">${logoImagePanelMarkup(logoEditorImage.asset,logoEditorImage.publicUrl)}${field('altText','Alt text',item.altText||'',{full:true,help:'Prefer “Organisation Name logo”.'})}${field('order','Display order',item.order||1,{type:'number',min:1})}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',item.visible!==false)}</div></div></section>${actions}</div><aside class="preview-card"><header class="preview-card__header"><strong>Live preview</strong></header><div class="preview-card__body">${logoBridgePreviewMarkup(logoBridgeSettingsForEditor(),[item])}</div></aside></div></form>`;
}

function renderLogoEditorPreview(form) {
  const preview=form?.querySelector('[data-logo-bridge-preview]');if(!preview)return;
  const data=formObject(form),settings=logoBridgeSettingsForEditor();
  preview.outerHTML=logoBridgePreviewMarkup(settings,[{
    organizationName:data.organizationName,logo:data.logo,altText:data.altText,visible:data.visible,order:Number(data.order)||1
  }]);
}

function snapshotSettingsForEditor() {
  if (snapshotDraft) return snapshotDraft;
  const fallback=state.businessSnapshot.settings || {};
  return {
    eyebrow:fallback.eyebrow || 'Hilltop Construction at a glance',heading:fallback.heading || 'A snapshot of Hilltop Construction',introduction:fallback.introduction || '',
    backgroundVideoAssetId:'',posterAssetId:'',videoEnabled:fallback.videoEnabled !== false,
    loopEnabled:fallback.loopEnabled ?? fallback.loop ?? true,mobileVideoEnabled:fallback.mobileVideoEnabled ?? fallback.mobileVideo ?? false,
    overlayOpacity:Number(fallback.overlayOpacity)>1?Number(fallback.overlayOpacity)/100:Number(fallback.overlayOpacity ?? .72),
    playbackRate:Number(fallback.playbackRate ?? fallback.playbackSpeed ?? .75),reducedMotionFallback:fallback.reducedMotionFallback || 'poster',
    isVisible:fallback.isVisible ?? fallback.visible ?? true,status:'draft',media:{ videoAsset:null,posterAsset:null,videoUrl:'',posterUrl:'' }
  };
}

function currentSnapshotStatistics() {
  return [...(snapshotStatistics || state.businessSnapshot.statistics || [])].sort((a,b)=>a.order-b.order);
}

function isSnapshotVideoUploadActive() {
  return ['Validating','Preparing upload','Uploading','Paused','Resuming','Processing metadata'].includes(snapshotVideoUploadUi.state);
}

function snapshotVideoControl() {
  const asset=snapshotEditorMedia.videoAsset,state=snapshotVideoUploadUi.state,url=snapshotEditorMedia.videoUrl;
  return `<article class="snapshot-media-card" data-snapshot-media-card="video">
    <div class="snapshot-media-card__preview">${url?`<video src="${esc(url)}" muted playsinline preload="metadata" aria-hidden="true"></video>`:'No video selected'}</div>
    <div class="snapshot-media-card__details"><p class="field__label">Background video</p><strong>${esc(asset?.original_filename || 'No video selected')}</strong><dl><div><dt>MIME type</dt><dd>${esc(asset?.mime_type || '—')}</dd></div><div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div><div><dt>Duration</dt><dd>${esc(formatDuration(asset?.duration_seconds))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div></dl><div class="snapshot-media-card__actions"><button type="button" class="button button--quiet" data-action="upload-snapshot-media" data-media-type="video" ${isSnapshotVideoUploadActive()||state==='Failed'?'disabled':''}>${asset?'Replace video':'Upload video'}</button><button type="button" class="button button--quiet" data-action="choose-snapshot-media" data-media-type="video">Choose from Media Library</button><button type="button" class="button button--text" data-action="remove-snapshot-media" data-media-type="video" ${asset?'':'disabled'}>Remove video</button></div></div>
    <div class="snapshot-upload-state"><div class="snapshot-upload-state__heading"><strong data-snapshot-upload-state>${esc(state)}</strong><span data-snapshot-upload-percentage>${Number(snapshotVideoUploadUi.percentage||0).toFixed(1)}%</span></div><p data-snapshot-upload-message>${esc(snapshotVideoUploadUi.message||'')}</p><progress data-snapshot-upload-progress max="100" value="${Number(snapshotVideoUploadUi.percentage||0)}"></progress><div class="snapshot-upload-state__actions"><button type="button" class="button button--quiet" data-action="pause-snapshot-upload" ${['Uploading','Resuming'].includes(state)?'':'hidden'}>Pause</button><button type="button" class="button button--quiet" data-action="resume-snapshot-upload" ${state==='Paused'?'':'hidden'}>Resume</button><button type="button" class="button button--quiet" data-action="cancel-snapshot-upload" ${isSnapshotVideoUploadActive()||state==='Failed'?'':'hidden'}>Cancel</button><button type="button" class="button button--quiet" data-action="retry-snapshot-upload" ${state==='Failed'?'':'hidden'}>Retry</button></div></div>
  </article>`;
}

function snapshotPosterControl() {
  const asset=snapshotEditorMedia.posterAsset,url=snapshotEditorMedia.posterUrl;
  return `<article class="snapshot-media-card" data-snapshot-media-card="poster"><div class="snapshot-media-card__preview">${url?`<img src="${esc(url)}" alt="">`:'No poster selected'}</div><div class="snapshot-media-card__details"><p class="field__label">Poster image</p><strong>${esc(asset?.original_filename || 'No poster selected')}</strong><dl><div><dt>MIME type</dt><dd>${esc(asset?.mime_type || '—')}</dd></div><div><dt>File size</dt><dd>${esc(formatBytes(asset?.size_bytes))}</dd></div><div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div></dl><div class="snapshot-media-card__actions"><button type="button" class="button button--quiet" data-action="upload-snapshot-media" data-media-type="poster">${asset?'Replace poster':'Upload poster'}</button><button type="button" class="button button--quiet" data-action="choose-snapshot-media" data-media-type="poster">Choose from Media Library</button><button type="button" class="button button--text" data-action="remove-snapshot-media" data-media-type="poster" ${asset?'':'disabled'}>Remove poster</button></div><p class="project-image-panel__status" data-snapshot-poster-status aria-live="polite"></p><progress class="upload-progress" data-snapshot-poster-progress max="100" value="0" hidden></progress></div></article>`;
}

function snapshotPreviewMarkup(settings,stats) {
  const poster=snapshotEditorMedia.posterUrl,video=snapshotEditorMedia.videoUrl;
  return `<div class="snapshot-preview" data-snapshot-preview data-device="desktop" style="--snapshot-preview-overlay:${Number(settings.overlayOpacity ?? .72)}"><div class="snapshot-preview__background" data-snapshot-preview-background style="${poster?`background-image:url('${esc(poster)}')`:''}">${video&&settings.videoEnabled?`<video class="snapshot-preview__video" src="${esc(video)}" poster="${esc(poster)}" autoplay muted playsinline ${settings.loopEnabled?'loop':''} preload="metadata" aria-hidden="true" data-snapshot-preview-video></video>`:''}</div><div class="snapshot-preview__overlay"></div><div class="snapshot-preview__content"><div><p class="eyebrow" data-snapshot-preview-eyebrow>${esc(settings.eyebrow)}</p><h3 data-snapshot-preview-heading>${esc(settings.heading)}</h3><p data-snapshot-preview-introduction>${esc(settings.introduction)}</p></div><div class="snapshot-preview__stats">${stats.filter(s=>s.visible).map(s=>`<article><strong>${esc(s.prefix)}${esc(s.value)}${esc(s.suffix)}</strong><p>${esc(s.description)}</p></article>`).join('')}</div></div></div>`;
}

function renderSnapshotPreview(form) {
  const preview=form?.querySelector('[data-snapshot-preview]');if(!preview)return;
  const data=formObject(form),device=preview.dataset.device || 'desktop';
  const reduced=snapshotReducedMotionPreview || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const showPoster=Boolean(snapshotEditorMedia.posterUrl) && !(reduced && data.reducedMotionFallback==='solid');
  const showVideo=Boolean(data.videoEnabled && snapshotEditorMedia.videoUrl && !reduced && (device!=='mobile' || data.mobileVideoEnabled));
  const background=preview.querySelector('[data-snapshot-preview-background]');
  background.style.backgroundImage=showPoster?`url("${snapshotEditorMedia.posterUrl.replace(/"/g,'%22')}")`:'none';
  let video=background.querySelector('[data-snapshot-preview-video]');
  if (showVideo) {
    if (!video) { video=document.createElement('video');video.className='snapshot-preview__video';video.dataset.snapshotPreviewVideo='';video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');background.prepend(video); }
    video.src=snapshotEditorMedia.videoUrl;video.poster=snapshotEditorMedia.posterUrl || '';video.loop=Boolean(data.loopEnabled);video.playbackRate=Number(data.playbackRate) || .75;video.play().catch(()=>{});
  } else { video?.pause();video?.remove(); }
  preview.querySelector('[data-snapshot-preview-eyebrow]').textContent=data.eyebrow || '';
  preview.querySelector('[data-snapshot-preview-heading]').textContent=data.heading || '';
  const introduction=preview.querySelector('[data-snapshot-preview-introduction]');introduction.textContent=data.introduction || '';introduction.hidden=!data.introduction;
  preview.style.setProperty('--snapshot-preview-overlay',String(Math.max(0,Math.min(100,Number(data.overlayOpacity)||0))/100));
}

function captureSnapshotForm(form) {
  const data=formObject(form);
  return { ...snapshotSettingsForEditor(),...data,overlayOpacity:Number(data.overlayOpacity)/100,playbackRate:Number(data.playbackRate),media:{...snapshotEditorMedia} };
}

function updateSnapshotVideoUploadUi(changes={}) {
  snapshotVideoUploadUi={...snapshotVideoUploadUi,...changes};
  const card=workspace.querySelector('[data-snapshot-media-card="video"]');if(!card)return;
  const text=(selector,value)=>{const node=card.querySelector(selector);if(node)node.textContent=value;};
  text('[data-snapshot-upload-state]',snapshotVideoUploadUi.state);text('[data-snapshot-upload-percentage]',`${Number(snapshotVideoUploadUi.percentage||0).toFixed(1)}%`);text('[data-snapshot-upload-message]',snapshotVideoUploadUi.message||'');
  const progress=card.querySelector('[data-snapshot-upload-progress]');if(progress)progress.value=Number(snapshotVideoUploadUi.percentage||0);
  const state=snapshotVideoUploadUi.state,toggle=(action,show)=>{const node=card.querySelector(`[data-action="${action}"]`);if(node)node.hidden=!show;};
  toggle('pause-snapshot-upload',['Uploading','Resuming'].includes(state));toggle('resume-snapshot-upload',state==='Paused');toggle('cancel-snapshot-upload',isSnapshotVideoUploadActive()||state==='Failed');toggle('retry-snapshot-upload',state==='Failed');
  card.querySelector('[data-action="upload-snapshot-media"]').disabled=isSnapshotVideoUploadActive()||state==='Failed';
  const publish=workspace.querySelector('[data-form="snapshot"] button[value="publish"]');if(publish)publish.disabled=isSnapshotVideoUploadActive();
}

function renderSnapshot() {
  const settings=snapshotSettingsForEditor();
  const stats=currentSnapshotStatistics();
  snapshotEditorMedia={ videoAsset:settings.media?.videoAsset||null,posterAsset:settings.media?.posterAsset||null,videoUrl:settings.media?.videoUrl||'',posterUrl:settings.media?.posterUrl||'' };
  workspace.innerHTML=`${pageHeader('Homepage section','Business Snapshot','Manage the navy statistics panel and its quiet ambient background.','<button class="button button--accent" data-action="add-stat">Add statistic</button>')}
    ${snapshotLoadError?`<div class="database-state database-state--error" role="alert">Supabase could not load Business Snapshot. The safe built-in draft is shown. ${esc(snapshotLoadError)}</div>`:''}
    <form class="editor-form" data-form="snapshot"><div class="form-layout"><div><section class="form-section"><h2>Section content</h2><div class="form-grid">${field('eyebrow','Eyebrow',settings.eyebrow)}${field('heading','Heading',settings.heading,{required:true})}${textarea('introduction','Introduction',settings.introduction)}<div class="field"><span class="field__label">Visibility</span>${checkbox('isVisible','Show on homepage after publishing',settings.isVisible!==false)}</div></div></section>
      <section class="form-section"><h2>Background animation</h2><input type="hidden" name="backgroundVideoAssetId" value="${esc(settings.backgroundVideoAssetId||'')}"><input type="hidden" name="posterAssetId" value="${esc(settings.posterAssetId||'')}"><div class="snapshot-media-stack">${snapshotVideoControl()}${snapshotPosterControl()}</div><input class="visually-hidden" type="file" data-snapshot-file><div class="form-grid"><div class="field"><span class="field__label">Background video</span>${checkbox('videoEnabled','Enable background video',settings.videoEnabled!==false)}</div><div class="field"><span class="field__label">Loop</span>${checkbox('loopEnabled','Loop video',settings.loopEnabled!==false)}</div><div class="field"><span class="field__label">Mobile video</span>${checkbox('mobileVideoEnabled','Enable video on mobile',settings.mobileVideoEnabled===true)}</div>${rangeField('overlayOpacity','Overlay opacity',Math.round(Number(settings.overlayOpacity??.72)*100),0,100)}${selectField('playbackRate','Playback speed',String(settings.playbackRate||.75),[['0.5','0.5×'],['0.75','0.75×'],['1','1×']])}${selectField('reducedMotionFallback','Reduced-motion fallback',settings.reducedMotionFallback,[['poster','Poster image'],['solid','Solid navy']])}</div></section>
      <section class="form-section"><div class="panel__header" style="padding:0 0 18px"><h2 style="margin:0">Statistics</h2></div><ol class="order-list" data-sortable="stats">${stats.map((stat,index)=>`<li class="order-item" draggable="true" data-id="${esc(stat.id)}"><span class="drag-handle">⋮⋮</span><div><strong>${esc(stat.prefix)}${esc(stat.value)}${esc(stat.suffix)}</strong><p class="field-help">${esc(stat.description)}</p></div>${statusBadge(stat.visible?'draft':'hidden')}<div class="row-actions"><button type="button" data-action="move-stat" data-direction="up" data-id="${esc(stat.id)}" ${index===0?'disabled':''}>↑</button><button type="button" data-action="move-stat" data-direction="down" data-id="${esc(stat.id)}" ${index===stats.length-1?'disabled':''}>↓</button><button type="button" data-action="edit-stat" data-id="${esc(stat.id)}">Edit</button><button type="button" data-action="duplicate-stat" data-id="${esc(stat.id)}">Duplicate</button><button type="button" data-action="delete-stat" data-id="${esc(stat.id)}">Delete</button></div></li>`).join('')}</ol></section>${formActions()}</div>
      <aside class="preview-card"><header class="preview-card__header"><strong>Snapshot preview</strong><div class="device-toggle"><button type="button" class="is-active">Desktop</button><button type="button">Mobile</button><button type="button" data-action="toggle-snapshot-reduced-motion" aria-pressed="${snapshotReducedMotionPreview}">Reduced motion</button></div></header><div class="preview-card__body">${snapshotPreviewMarkup(settings,stats)}</div></aside></div></form>`;
  renderSnapshotPreview(workspace.querySelector('[data-form="snapshot"]'));
  updateSnapshotVideoUploadUi();setupDragAndDrop();
}

function renderSnapshotMediaPicker() {
  const search=snapshotMediaSearch.value.trim().toLowerCase();
  const assets=snapshotMediaAssets.filter((asset)=>!search || String(asset.original_filename||'').toLowerCase().includes(search));
  snapshotMediaGrid.innerHTML=assets.map((asset)=>{
    const selected=asset.id===selectedSnapshotMediaAssetId,isVideo=asset.media_type==='video';
    return `<button type="button" class="media-picker-card" role="option" aria-selected="${selected}" data-snapshot-media-id="${esc(asset.id)}"><span class="media-picker-card__image ${isVideo?'media-picker-card__image--video':''}">${isVideo?`<video src="${esc(asset.publicUrl)}" muted playsinline preload="metadata" aria-hidden="true"></video>`:`<img src="${esc(asset.publicUrl)}" alt="">`}</span><span class="media-picker-card__body"><strong>${esc(asset.original_filename)}</strong><dl><div><dt>Type</dt><dd>${esc(asset.mime_type)}</dd></div><div><dt>Size</dt><dd>${esc(formatBytes(asset.size_bytes))}</dd></div>${isVideo?`<div><dt>Duration</dt><dd>${esc(formatDuration(asset.duration_seconds))}</dd></div>`:`<div><dt>Dimensions</dt><dd>${esc(formatDimensions(asset))}</dd></div>`}</dl>${asset.preferred?'<span class="media-picker-card__preferred">Business Snapshot media</span>':''}</span></button>`;
  }).join('');
  if (!assets.length) snapshotMediaGrid.innerHTML=`<div class="empty-state"><h3>No matching ${snapshotMediaKind==='video'?'videos':'poster images'}</h3><p>Upload new media or change the search.</p></div>`;
  const selected=assets.find((asset)=>asset.id===selectedSnapshotMediaAssetId);
  snapshotMediaStatus.textContent=selected?`${selected.original_filename} selected. ${assets.length} asset${assets.length===1?'':'s'} shown.`:`${assets.length} compatible asset${assets.length===1?'':'s'} available. Business Snapshot uploads are listed first.`;
  snapshotMediaPicker.querySelector('[data-action="use-snapshot-media"]').disabled=!selected;
}

async function openSnapshotMediaPicker(form,kind) {
  snapshotMediaTargetForm=form;snapshotMediaKind=kind;selectedSnapshotMediaAssetId=kind==='video'?form.elements.backgroundVideoAssetId.value:form.elements.posterAssetId.value;
  snapshotMediaSearch.value='';snapshotMediaGrid.innerHTML='';snapshotMediaStatus.textContent=`Loading ${kind==='video'?'videos':'poster images'}…`;
  snapshotMediaPicker.querySelector('#snapshotMediaPickerTitle').textContent=kind==='video'?'Choose a Business Snapshot video':'Choose a Business Snapshot poster';
  snapshotMediaPicker.querySelector('[data-action="use-snapshot-media"]').disabled=true;snapshotMediaPicker.showModal();snapshotMediaSearch.focus();
  try { snapshotMediaAssets=await getBusinessSnapshotMediaAssets(kind);renderSnapshotMediaPicker(); }
  catch(error) { snapshotMediaAssets=[];snapshotMediaStatus.textContent=`Media Library could not be loaded: ${error.message}`;snapshotMediaGrid.innerHTML='<div class="empty-state"><h3>Media unavailable</h3><p>Close this window and try again.</p></div>'; }
}

function closeSnapshotMediaPicker() {
  if (snapshotMediaPicker.open) snapshotMediaPicker.close();
  snapshotMediaTargetForm=null;selectedSnapshotMediaAssetId='';
}

function applySnapshotMediaSelection(form,kind,asset,publicUrl) {
  if (!form)return;
  snapshotDraft=captureSnapshotForm(form);
  if (kind==='video') { snapshotEditorMedia.videoAsset=asset||null;snapshotEditorMedia.videoUrl=publicUrl||'';snapshotDraft.backgroundVideoAssetId=asset?.id||''; }
  else { snapshotEditorMedia.posterAsset=asset||null;snapshotEditorMedia.posterUrl=publicUrl||'';snapshotDraft.posterAssetId=asset?.id||''; }
  snapshotDraft.media={...snapshotEditorMedia};setDirty();renderSnapshot();
}

function renderStatEditor(item, isNew = false) {
  activeEditor = { routeKey:'snapshot', id:item.id, isNew, stat:true };
  workspace.innerHTML = `${pageHeader('Business Snapshot', `${isNew?'Add':'Edit'} statistic`, 'Keep values, affixes, and descriptions independently replaceable.', '<button class="button button--quiet" data-action="back-to-snapshot">Back to snapshot</button>')}<form class="editor-form" data-form="stat" data-id="${item.id}"><section class="form-section"><div class="form-grid">${field('value','Statistic value',item.value,{required:true})}${field('prefix','Optional prefix',item.prefix)}${field('suffix','Optional suffix',item.suffix)}${field('order','Display order',item.order,{type:'number',min:1})}${textarea('description','Description',item.description,{required:true,maxlength:140})}<div class="field"><span class="field__label">Visibility</span>${checkbox('visible','Show after publishing',item.visible!==false)}</div></div></section><div class="form-actions">${!isNew?'<button class="button button--danger" type="button" data-action="delete-current">Delete</button>':''}<button class="button button--quiet" type="submit" name="intent" value="draft">Save statistic draft</button></div></form>`;
}

function renderMedia() {
  const groups = ['All','Images','Videos','Posters','Hero','Featured Projects','Expertise','Business Snapshot','News'];
  const assets = state.mediaAssets.filter((asset)=> mediaFilter==='All' || (mediaFilter==='Images' && asset.type==='image') || (mediaFilter==='Videos' && asset.type==='video') || asset.group===mediaFilter);
  const controls = `<button class="button button--accent" data-action="mock-upload">Upload media</button>`;
  const content = mediaView === 'grid' ? `<div class="media-grid">${assets.map(asset=>`<article class="media-card"><div class="media-card__thumb">${asset.path && asset.type==='image'?`<img src="${esc(asset.path)}" alt="${esc(asset.altText)}">`:`<span>${asset.type==='video'?'Video':'No preview'}</span>`}</div><div class="media-card__body"><h3>${esc(asset.filename)}</h3><p>${esc(asset.type)} · ${esc(asset.size)} · ${esc(asset.dimensions)}</p>${asset.duration?`<p>Duration: ${esc(asset.duration)}</p>`:''}<p>Used by: ${asset.usedBy.length?esc(asset.usedBy.join(', ')):'Not currently used'}</p><div class="media-card__actions"><button class="button button--text" data-action="edit-media" data-id="${asset.id}">Metadata</button><button class="button button--text" data-action="replace-media" data-id="${asset.id}">Replace</button><button class="button button--text" data-action="delete-media" data-id="${asset.id}">Delete</button></div></div></article>`).join('')}</div>` : `<table class="data-table"><thead><tr><th>Asset</th><th>Type</th><th>Details</th><th>Alt text</th><th>Usage</th><th>Actions</th></tr></thead><tbody>${assets.map(asset=>`<tr><td data-label="Asset"><span class="data-table__title">${esc(asset.filename)}</span></td><td data-label="Type">${esc(asset.type)}</td><td data-label="Details">${esc(asset.size)} · ${esc(asset.dimensions)} ${asset.duration?`· ${esc(asset.duration)}`:''}</td><td data-label="Alt text">${esc(asset.altText||'Missing')}</td><td data-label="Usage">${esc(asset.usedBy.join(', ')||'Unused')}</td><td data-label="Actions"><div class="row-actions"><button data-action="edit-media" data-id="${asset.id}">Metadata</button><button data-action="replace-media" data-id="${asset.id}">Replace</button><button data-action="delete-media" data-id="${asset.id}">Delete</button></div></td></tr>`).join('')}</tbody></table>`;
  workspace.innerHTML = `${pageHeader('Homepage assets', 'Media Library', 'Review homepage-only images, videos, posters, metadata, and where each asset is used.', controls)}<div class="collection-toolbar"><div class="filter-row">${groups.map(group=>`<button class="filter-chip ${group===mediaFilter?'is-active':''}" data-action="filter-media" data-filter="${group}">${group}</button>`).join('')}</div><div class="segmented"><button class="${mediaView==='grid'?'is-active':''}" data-action="media-view" data-view="grid">Grid</button><button class="${mediaView==='list'?'is-active':''}" data-action="media-view" data-view="list">List</button></div></div>${assets.length?content:emptyState('No matching assets','Try another filter or add a mock asset.',controls)}`;
}

function renderMediaEditor(asset) {
  activeEditor = {routeKey:'media',id:asset.id};
  workspace.innerHTML = `${pageHeader('Media Library','Edit metadata','Update mock asset details without uploading a real file.','<button class="button button--quiet" data-action="back-to-media">Back to library</button>')}<form class="editor-form" data-form="media" data-id="${asset.id}"><div class="form-layout"><div><section class="form-section"><div class="form-grid">${field('filename','Filename',asset.filename,{required:true})}${selectField('type','Media type',asset.type,[['image','Image'],['video','Video'],['poster','Poster']])}${field('path','Mock asset path',asset.path,{full:true})}${field('size','File size',asset.size)}${field('dimensions','Dimensions',asset.dimensions)}${field('duration','Duration',asset.duration)}${field('altText','Alt text',asset.altText,{full:true,required:asset.type==='image'})}${selectField('group','Homepage group',asset.group,[['Hero','Hero'],['Featured Projects','Featured Projects'],['Expertise','Expertise'],['Business Snapshot','Business Snapshot'],['News','News']])}</div></section>${formActions({delete:true})}</div><aside class="preview-card"><header class="preview-card__header"><strong>Asset preview</strong></header><div class="preview-card__body">${mediaPreview(asset.path,asset.altText)}</div></aside></div></form>`;
}

function renderSettings() {
  const settings = state.homepageSettings;
  const sections = [...state.homepageSections].sort((a,b)=>a.order-b.order);
  workspace.innerHTML = `${pageHeader('Homepage controls','Homepage Settings','Manage section order, visibility, shared labels, and safe preview defaults.')}
    <form class="editor-form" data-form="settings"><div class="dashboard-grid"><div><section class="form-section"><h2>Section order and visibility</h2><ol class="order-list" data-sortable="sections">${sections.map((section,index)=>`<li class="order-item" draggable="true" data-id="${section.id}"><span class="drag-handle">⋮⋮</span><strong>${esc(section.label)}</strong>${statusBadge(section.visible?section.status:'hidden')}<div class="order-controls"><button type="button" data-action="move-section" data-direction="up" data-id="${section.id}" ${index===0?'disabled':''}>↑</button><button type="button" data-action="move-section" data-direction="down" data-id="${section.id}" ${index===sections.length-1?'disabled':''}>↓</button><button type="button" data-action="cycle-section-status" data-id="${section.id}">Status</button><button type="button" data-action="toggle-section" data-id="${section.id}">${section.visible?'Hide':'Show'}</button></div></li>`).join('')}</ol></section>
      <section class="form-section"><h2>Shared links and labels</h2><div class="form-grid">${field('projectViewAllLabel','Project View All label',settings.projectViewAllLabel)}${field('projectViewAllUrl','Project View All destination',settings.projectViewAllUrl,{type:'url'})}${field('newsViewAllLabel','News View All label',settings.newsViewAllLabel)}${field('newsViewAllUrl','News View All destination',settings.newsViewAllUrl,{type:'url'})}${field('sharedLearnMoreLabel','Shared Learn More label',settings.sharedLearnMoreLabel)}${field('defaultImageFallback','Default image fallback',settings.defaultImageFallback,{full:true})}</div></section>${formActions()}</div><aside><section class="form-section"><h2>Animation and editorial defaults</h2>${checkbox('reducedMotionDefault','Respect reduced motion by default',settings.reducedMotionDefault)}${checkbox('autoplayPreviews','Autoplay preview videos',settings.autoplayPreviews)}${checkbox('altTextWarnings','Warn when alt text is missing',settings.altTextWarnings)}</section><section class="form-section"><h2>Prototype data</h2><p class="field-help">Restore the source mock data and clear all local edits.</p><button type="button" class="button button--danger" data-action="reset-data">Reset local data</button></section></aside></div></form>`;
  setupDragAndDrop();
}

function render() {
  state = getHomepageData();
  activeEditor = null;
  renderNav();
  const key = route();
  breadcrumb.textContent = labelForRoute(key);
  if (key === 'hero') renderHero();
  else if (key === 'discovery') renderDiscovery();
  else if (collectionConfig[key]) renderCollection(key);
  else if (key === 'logos') renderLogoBridge();
  else if (key === 'snapshot') renderSnapshot();
  else if (key === 'media') renderMedia();
  else if (key === 'settings') renderSettings();
  else renderOverview();
  workspace.querySelectorAll('form').forEach((form) => { form.noValidate = true; });
  workspace.focus({preventScroll:true});
}

function formObject(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  form.querySelectorAll('input[type="checkbox"]').forEach((input)=>{ data[input.name] = input.checked; });
  return data;
}

function validateForm(form, data, intent = 'draft') {
  let valid = true;
  const incompleteDraftAllowed=intent==='draft'&&(['hero','snapshot','stat','logo-item'].includes(form.dataset.form)||(form.dataset.form==='collection-item'&&['news','expertise'].includes(form.dataset.collection)));
  form.querySelectorAll('.field-help.field-error').forEach((node)=>node.remove());
  form.querySelectorAll('[required]').forEach((input)=>{
    input.classList.remove('is-invalid');
    if (!String(input.value).trim() && !incompleteDraftAllowed) {
      input.classList.add('is-invalid');
      input.insertAdjacentHTML('afterend','<p class="field-help field-error">This field is required.</p>');
      valid = false;
    }
  });
  form.querySelectorAll('input[type="url"]').forEach((input)=>{
    if(incompleteDraftAllowed)return;
    if (input.value && !input.value.startsWith('#')) {
      try { new URL(input.value); input.classList.remove('is-invalid'); }
      catch { input.classList.add('is-invalid'); input.insertAdjacentHTML('afterend','<p class="field-help field-error">Enter a full URL or an on-page #anchor.</p>'); valid=false; }
    }
  });
  if (form.dataset.form==='hero' && intent==='publish') {
    if (!data.posterAssetId) { notify('Upload a poster image before publishing.','error'); valid=false; }
    if (!String(data.posterAltText||'').trim()) { notify('Add meaningful poster alt text before publishing.','error'); valid=false; }
    if (heroEditorMedia.videoAsset && !['video/mp4','video/webm'].includes(heroEditorMedia.videoAsset.mime_type)) { notify('The Hero video format is unsupported.','error'); valid=false; }
    if (heroEditorMedia.posterAsset && !['image/jpeg','image/png','image/webp','image/avif'].includes(heroEditorMedia.posterAsset.mime_type)) { notify('The poster image format is unsupported.','error'); valid=false; }
  }
  if (form.dataset.form==='snapshot' && intent==='publish') {
    const overlay=Number(data.overlayOpacity),playback=Number(data.playbackRate);
    if (data.videoEnabled && !data.backgroundVideoAssetId) { notify('Select a Business Snapshot video before publishing.','error');valid=false; }
    if (data.videoEnabled && !data.posterAssetId) { notify('Select a poster image before publishing.','error');valid=false; }
    if (!Number.isFinite(overlay)||overlay<0||overlay>100) { notify('Overlay opacity must be between 0 and 100%.','error');valid=false; }
    if (![.5,.75,1].includes(playback)) { notify('Playback speed must be 0.5×, 0.75×, or 1×.','error');valid=false; }
    if (!['poster','solid'].includes(data.reducedMotionFallback)) { notify('Choose poster or solid navy for reduced motion.','error');valid=false; }
    if (!currentSnapshotStatistics().some((item)=>item.visible!==false)) { notify('Add at least one visible statistic before publishing.','error');valid=false; }
    if (snapshotEditorMedia.videoAsset && !['video/mp4','video/webm'].includes(snapshotEditorMedia.videoAsset.mime_type)) { notify('The Business Snapshot video format is unsupported.','error');valid=false; }
    if (snapshotEditorMedia.posterAsset && !['image/jpeg','image/png','image/webp','image/avif'].includes(snapshotEditorMedia.posterAsset.mime_type)) { notify('The Business Snapshot poster format is unsupported.','error');valid=false; }
  }
  if (!valid) notify('Please correct the highlighted fields.', 'error');
  return valid;
}

async function saveForm(form, submitter) {
  const data = formObject(form);
  const intent = submitter?.value || 'draft';
  if (form.dataset.form==='hero' && intent==='publish' && isHeroVideoUploadActive()) { notify('Wait for the Hero video upload to complete before publishing.','error'); return; }
  if (form.dataset.form==='snapshot' && intent==='publish' && isSnapshotVideoUploadActive()) { notify('Wait for the Business Snapshot video upload to complete before publishing.','error'); return; }
  if (!validateForm(form,data,intent)) return;
  if (form.dataset.form === 'discovery') {
    try {
      setSaving(form, true);
      const payload = discoveryPayload(data);
      discoveryRecord = intent === 'publish'
        ? await publishDiscoveryBridge(payload)
        : await saveDiscoveryBridgeDraft(payload);
      discoveryLoadError = '';
      setDirty(false);
      notify(intent === 'publish' ? 'Discovery Bridge published.' : 'Discovery Bridge draft saved.');
      renderDiscovery();
      workspace.querySelectorAll('form').forEach((item) => { item.noValidate = true; });
    } catch (error) {
      notify(`Discovery Bridge was not saved: ${error.message}`, 'error');
    } finally {
      setSaving(workspace.querySelector('[data-form="discovery"]'), false);
    }
    return;
  }
  if (form.dataset.form === 'hero') {
    try {
      setSaving(form,true,intent==='publish'?'Publishing…':'Saving…');
      const payload={...data,playbackRate:Number(data.playbackRate)};
      heroDraft=await saveHeroDraft(payload);
      if(intent==='publish') publishedHero=await publishHero();
      heroLoadError=''; setDirty(false);
      notify(intent==='publish'?'Hero published.':'Hero draft saved.'); renderHero();
      workspace.querySelectorAll('form').forEach(item=>{item.noValidate=true;});
    } catch(error) { notify(`Hero was not saved: ${error.message}`,'error'); }
    finally { setSaving(workspace.querySelector('[data-form="hero"]'),false); }
    return;
  } else if (form.dataset.form === 'snapshot') {
    try {
      setSaving(form,true,intent==='publish'?'Publishing…':'Saving…');
      const service=await getSnapshotService();
      const payload={...data,overlayOpacity:Number(data.overlayOpacity)/100,playbackRate:Number(data.playbackRate)};
      snapshotDraft=await service.saveBusinessSnapshotDraft(payload);
      if (intent==='publish') publishedSnapshot=await service.publishBusinessSnapshot();
      snapshotLoadError='';setDirty(false);notify(intent==='publish'?'Business Snapshot published.':'Business Snapshot draft saved.');renderSnapshot();
    } catch(error) { notify(`Business Snapshot was not saved: ${error.message}`,'error'); }
    finally { setSaving(workspace.querySelector('[data-form="snapshot"]'),false); }
    return;
  } else if (form.dataset.form === 'expertise-settings') {
    try {
      setSaving(form,true);
      expertiseSectionDraft=await(await getExpertiseService()).saveExpertiseSectionDraft(data);
      expertiseLoadError='';setDirty(false);renderCollection('expertise');notify('Expertise section settings draft saved.');
    } catch(error){notify(`Expertise section settings were not saved: ${error.message}`,'error');}
    finally{setSaving(workspace.querySelector('[data-form="expertise-settings"]'),false);}
    return;
  } else if (form.dataset.form === 'logo-settings') {
    try {
      setSaving(form,true);
      logoBridgeDraftSettings=await(await getLogoBridgeService()).saveLogoBridgeDraftSettings(data);
      logoBridgeLoadError='';setDirty(false);renderLogoBridge();notify('Logo Bridge section draft saved.');
    } catch(error){notify(`Logo Bridge settings were not saved: ${error.message}`,'error');}
    finally{setSaving(workspace.querySelector('[data-form="logo-settings"]'),false);}
    return;
  } else if (form.dataset.form === 'logo-item') {
    try {
      setSaving(form,true);
      const service=await getLogoBridgeService();
      const payload={...data,logoKey:form.dataset.id,order:Number(data.order)};
      const saved=activeEditor?.isNew?await service.createLogoBridgeDraftItem(payload):await service.updateLogoBridgeDraftItem(form.dataset.id,payload);
      if(saved?.logoKey){form.dataset.id=saved.logoKey;if(activeEditor)activeEditor.id=saved.logoKey;}
      await loadLogoBridgeFromSupabase();setDirty(false);location.hash='logos';render();notify('Logo draft saved.');
    } catch(error){notify(`Logo draft was not saved: ${error.message}`,'error');}
    finally{setSaving(workspace.querySelector('[data-form="logo-item"]'),false);}
    return;
  } else if (form.dataset.form === 'settings') {
    saveHomepageSection('homepageSettings',{...state.homepageSettings,...data});
  } else if (form.dataset.form === 'collection-item') {
    if(form.dataset.collection==='projects'){
      try{setSaving(form,true);const service=await getProjectsService();const saved=await service.updateFeaturedProjectDraft(form.dataset.id,{...data,order:Number(data.order)});if(intent==='publish')await service.publishFeaturedProjects();await loadFeaturedProjectsFromSupabase();setDirty(false);notify(intent==='publish'?'Featured Projects collection published.':'Project draft saved.');location.hash='projects';render();}catch(error){notify(`Project was not saved: ${error.message}`,'error');}finally{setSaving(workspace.querySelector('[data-form="collection-item"]'),false);}return;
    }
    if(form.dataset.collection==='news'){
      try {
        setSaving(form,true);
        const service=await getNewsService();
        const articleKey=repairNewsArticleFormKey(form);
        const payload={...data,order:Number(data.order),articleKey};
        const saved=activeEditor?.isNew?await service.createNewsArticleDraft(payload):await service.updateNewsArticleDraft(articleKey,payload);
        if(saved?.articleKey){form.dataset.id=saved.articleKey;if(activeEditor)activeEditor.id=saved.articleKey;}
        await loadNewsFromSupabase();setDirty(false);location.hash='news';render();
        notify('News article draft saved.');
        const titleLength=String(data.title||'').trim().length,summaryLength=String(data.summary||'').trim().length;
        if(titleLength&&(titleLength<35||titleLength>80))notify(`Article title is ${titleLength} characters; editorial guidance is 35–80.`,'warning');
        if(summaryLength&&(summaryLength<90||summaryLength>180))notify(`Article summary is ${summaryLength} characters; editorial guidance is 90–180.`,'warning');
      } catch(error){console.error('News article draft save failed:',error);if(isNewsArticleIdentifierError(error)){repairNewsArticleFormKey(form);notify('The article could not be saved because its identifier was invalid. A new identifier has been generated; please save again.','error');}else notify(`News article was not saved: ${error.message}`,'error');}
      finally{setSaving(workspace.querySelector('[data-form="collection-item"]'),false);}
      return;
    }
    if(form.dataset.collection==='expertise'){
      try {
        setSaving(form,true);
        const service=await getExpertiseService();
        const slideKey=form.dataset.id;
        const payload={...data,slideKey,order:Number(data.order),focalX:Number(data.focalX),focalY:Number(data.focalY),overlayOpacity:Number(data.overlayOpacity)/100,backgroundImageAssetId:data.backgroundImageAssetId};
        const saved=activeEditor?.isNew?await service.createExpertiseSlideDraft(payload):await service.updateExpertiseSlideDraft(slideKey,payload);
        if(saved?.slideKey){form.dataset.id=saved.slideKey;if(activeEditor)activeEditor.id=saved.slideKey;}
        await loadExpertiseFromSupabase();setDirty(false);location.hash='expertise';render();notify('Expertise slide draft saved.');
      } catch(error){notify(`Expertise slide was not saved: ${error.message}`,'error');}
      finally{setSaving(workspace.querySelector('[data-form="collection-item"]'),false);}
      return;
    }
    const routeKey=form.dataset.collection, config=collectionConfig[routeKey], collection=[...state[config.key]];
    const numeric=['order','focalX','focalY']; numeric.forEach(key=>{if(key in data)data[key]=Number(data[key]);});
    const item={...(collection.find(entry=>entry.id===form.dataset.id)||{}),...data,id:form.dataset.id,status:intent==='publish'?'published':data.status,updatedAt:now()};
    const index=collection.findIndex(entry=>entry.id===item.id); if(index>=0)collection[index]=item; else collection.push(item);
    collection.sort((a,b)=>a.order-b.order).forEach((entry,index)=>entry.order=index+1);
    saveHomepageSection(config.key,collection); activeEditor=null; location.hash=routeKey;
  } else if (form.dataset.form === 'stat') {
    try {
      setSaving(form,true);
      const list=currentSnapshotStatistics();
      const item={...(list.find(entry=>entry.id===form.dataset.id)||{}),...data,id:form.dataset.id,order:Number(data.order),visible:Boolean(data.visible),status:'draft'};
      const index=list.findIndex(entry=>entry.id===item.id);if(index>=0)list[index]=item;else list.push(item);
      list.sort((a,b)=>a.order-b.order).forEach((entry,index)=>entry.order=index+1);
      snapshotStatistics=await (await getSnapshotService()).saveBusinessSnapshotStatistics(list);
      setDirty(false);location.hash='snapshot';render();notify('Business Snapshot statistic draft saved.');
    } catch(error) { notify(`Statistic was not saved: ${error.message}`,'error'); }
    finally { setSaving(workspace.querySelector('[data-form="stat"]'),false); }
    return;
  } else if (form.dataset.form === 'media') {
    updateHomepageData((draft)=>{const item=draft.mediaAssets.find(entry=>entry.id===form.dataset.id); Object.assign(item,data);}); location.hash='media';
  }
  setDirty(false); state=getHomepageData(); notify(intent==='publish'?'Content published to mock state.':'Draft saved locally.');
  if (!['collection-item','stat','media'].includes(form.dataset.form)) render();
}

function addItem(routeKey) {
  const config=collectionConfig[routeKey], order=routeKey==='news'?(newsArticleDrafts||[]).length+1:routeKey==='expertise'?(expertiseSlideDrafts||[]).length+1:state[config.key].length+1;
  const baseId=['news','expertise'].includes(routeKey)?createUuid():uniqueId(config.singular);
  const base={id:baseId,order,visible:true,status:'draft',updatedAt:now()};
  if(routeKey==='projects'){const projectOrder=(featuredProjectDrafts||[]).length+1;renderItemEditor(routeKey,{...base,id:crypto.randomUUID(),projectKey:'',order:projectOrder,title:'',description:'',image:'',imageAssetId:'',imageAlt:'',buttonLabel:'View project',buttonUrl:'#projects',layout:'image-left'},true);}
  else if(routeKey==='expertise')renderItemEditor(routeKey,{...base,slideKey:baseId,eyebrow:'',heading:'',title:'',description:'',image:'',backgroundImageAssetId:'',imageAssetId:'',imageAlt:'',focalX:50,focalY:50,overlayOpacity:.45,ctaLabel:'',ctaUrl:'#projects'},true);
  else {const articleKey=baseId;renderItemEditor(routeKey,{...base,id:articleKey,articleKey,category:'',title:'',summary:'',publicationDate:new Date().toISOString().slice(0,10),image:'',imageAlt:'',articleUrl:'#news',featured:false},true);}
}

async function moveInCollection(routeKey,id,direction) {
  if(routeKey==='projects'){const items=[...(featuredProjectDrafts||[])].sort((a,b)=>a.order-b.order),index=items.findIndex(x=>x.id===id),target=direction==='up'?index-1:index+1;if(index<0||target<0||target>=items.length)return;[items[index],items[target]]=[items[target],items[index]];try{featuredProjectDrafts=await (await getProjectsService()).reorderFeaturedProjectDrafts(items.map(x=>x.projectKey||x.id));renderCollection('projects');notify('Project order updated.');}catch(error){notify(`Project order failed: ${error.message}`,'error');}return;}
  if(routeKey==='news'){const items=[...(newsArticleDrafts||[])].sort((a,b)=>a.order-b.order),index=items.findIndex(x=>x.id===id),target=direction==='up'?index-1:index+1;if(index<0||target<0||target>=items.length)return;[items[index],items[target]]=[items[target],items[index]];try{newsArticleDrafts=await(await getNewsService()).reorderNewsArticleDrafts(items.map(x=>x.articleKey||x.id));renderCollection('news');notify('News article order updated.');}catch(error){notify(`News article order failed: ${error.message}`,'error');}return;}
  if(routeKey==='expertise'){const items=[...(expertiseSlideDrafts||[])].sort((a,b)=>a.order-b.order),index=items.findIndex(x=>x.id===id),target=direction==='up'?index-1:index+1;if(index<0||target<0||target>=items.length)return;[items[index],items[target]]=[items[target],items[index]];try{expertiseSlideDrafts=await(await getExpertiseService()).reorderExpertiseSlideDrafts(items.map(x=>x.slideKey||x.id));renderCollection('expertise');notify('Expertise slide order updated.');}catch(error){notify(`Expertise order failed: ${error.message}`,'error');}return;}
  const config=collectionConfig[routeKey], items=[...state[config.key]].sort((a,b)=>a.order-b.order), index=items.findIndex(item=>item.id===id), target=direction==='up'?index-1:index+1;
  if(index<0||target<0||target>=items.length)return; [items[index],items[target]]=[items[target],items[index]]; reorderHomepageItems(config.key,items.map(item=>item.id)); render(); notify('Display order updated.');
}

async function duplicateItem(routeKey,id) {
  if(routeKey==='projects'){try{await (await getProjectsService()).duplicateFeaturedProjectDraft(id);await loadFeaturedProjectsFromSupabase();renderCollection('projects');notify('Project duplicated.');}catch(error){notify(`Project could not be duplicated: ${error.message}`,'error');}return;}
  if(routeKey==='news'){try{await(await getNewsService()).duplicateNewsArticleDraft(id);await loadNewsFromSupabase();renderCollection('news');notify('News article duplicated as a draft.');}catch(error){notify(`News article could not be duplicated: ${error.message}`,'error');}return;}
  if(routeKey==='expertise'){try{await(await getExpertiseService()).duplicateExpertiseSlideDraft(id);await loadExpertiseFromSupabase();renderCollection('expertise');notify('Expertise slide duplicated as a draft.');}catch(error){notify(`Expertise slide could not be duplicated: ${error.message}`,'error');}return;}
  const config=collectionConfig[routeKey], source=state[config.key].find(item=>item.id===id); if(!source)return;
  const copy={...source,id:uniqueId(config.singular),title:`${source.title} (copy)`,order:state[config.key].length+1,status:'draft',updatedAt:now()};
  saveHomepageSection(config.key,[...state[config.key],copy]); render(); notify(`${config.singular} duplicated.`);
}

async function moveLogo(id,direction) {
  const items=[...(logoBridgeDraftItems||[])].sort((a,b)=>a.order-b.order),index=items.findIndex((item)=>item.logoKey===id),target=direction==='up'?index-1:index+1;
  if(index<0||target<0||target>=items.length)return;
  [items[index],items[target]]=[items[target],items[index]];
  try{logoBridgeDraftItems=await(await getLogoBridgeService()).reorderLogoBridgeDraftItems(items.map((item)=>item.logoKey));renderLogoBridge();notify('Logo order updated.');}
  catch(error){notify(`Logo order failed: ${error.message}`,'error');}
}

function confirmAction(title,message,action,label='Delete') {
  document.querySelector('#confirmationTitle').textContent=title; document.querySelector('#confirmationMessage').textContent=message; document.querySelector('#confirmAction').textContent=label; pendingConfirmation=action; confirmationModal.showModal();
}

function renderHomepagePreview(size='desktop') {
  const publishedOnly=previewMode === 'published';
  const visible=(item)=>item.visible!==false && (!publishedOnly||item.status==='published');
  const sections=[...state.homepageSections].sort((a,b)=>a.order-b.order).filter(visible);
  homepagePreview.dataset.size=size;
  const heroForm=workspace.querySelector('[data-form="hero"]');
  const heroItem=previewMode==='draft'&&heroForm?{...(heroDraft||state.hero),...formObject(heroForm)}:(previewMode==='published'?(publishedHero||heroDraft||state.hero):(heroDraft||state.hero));
  homepagePreview.innerHTML=sections.map(section=>{
    if(section.id==='hero'&&heroItem.isVisible!==false){const media=previewMode==='published'?(publishedHero?.media||heroItem.media||{}):heroEditorMedia;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;return `<section class="preview-hero">${media.videoUrl&&!reduced?`<video src="${esc(media.videoUrl)}" poster="${esc(media.posterUrl||'')}" autoplay muted playsinline ${heroItem.loopEnabled?'loop':''}></video>`:media.posterUrl?`<img src="${esc(media.posterUrl)}" alt="${esc(heroItem.posterAltText||'')}">`:''}<div class="preview-hero__copy"><h1>${esc(heroItem.heading)}</h1></div></section>`;}
    if(section.id==='discovery'){const item=discoveryToEditor(discoveryRecord);return visible(item)?`<section class="preview-section preview-discovery"><p>${esc(item.paragraph)}</p></section>`:'';}
    if(section.id==='projects'){const items=featuredProjectDrafts??state.featuredProjects;return `<section class="preview-section"><h2>Our Capabilities</h2><div class="preview-projects">${items.filter(visible).map(item=>previewCard(item)).join('')}</div></section>`;}
    if(section.id==='expertise'){const items=previewMode==='published'?(publishedExpertiseSlides||[]):(expertiseSlideDrafts||[]),settings=previewMode==='published'?(publishedExpertiseSection||expertiseSectionDraft):expertiseSectionDraft,item=items.filter(visible)[0];return item&&settings?.visible!==false?`<section class="preview-expertise" style="background:rgba(7,31,61,${Number(item.overlayOpacity??.45)})"><img src="${esc(item.image)}" alt="${esc(item.imageAlt||'')}" style="object-position:${Number(item.focalX??50)}% ${Number(item.focalY??50)}%"><div class="preview-expertise__copy"><p class="eyebrow" style="color:white">${esc(item.eyebrow||settings?.sectionLabel||'OUR EXPERTISE')} · 01 / ${String(items.filter(visible).length).padStart(2,'0')}</p><h2>${esc(item.heading||item.title)}</h2><p>${esc(item.description)}</p></div></section>`:'';}
    if(section.id==='logos'){const settings=previewMode==='published'?(publishedLogoBridgeSettings||logoBridgeDraftSettings):logoBridgeSettingsForEditor(),items=previewMode==='published'?(publishedLogoBridgeItems||[]):(logoBridgeDraftItems||[]);return settings?.visible!==false?`<section class="preview-section">${logoBridgePreviewMarkup(settings,items.filter(visible))}</section>`:'';}
    if(section.id==='snapshot'&&visible(state.businessSnapshot.settings))return `<section class="preview-section preview-snapshot"><p class="eyebrow" style="color:white">${esc(state.businessSnapshot.settings.eyebrow)}</p><h2>${esc(state.businessSnapshot.settings.heading)}</h2><div class="preview-snapshot__grid">${state.businessSnapshot.statistics.filter(visible).map(s=>`<article><strong>${esc(s.prefix)}${esc(s.value)}${esc(s.suffix)}</strong><p>${esc(s.description)}</p></article>`).join('')}</div></section>`;
    if(section.id==='news'){const items=previewMode==='published'?(publishedNewsArticles||[]):(newsArticleDrafts??state.newsArticles);return `<section class="preview-section"><h2>News &amp; Foresight</h2><div class="preview-news">${items.filter(visible).map(item=>previewCard({...item,description:item.summary})).join('')}</div></section>`;}
    return '';
  }).join('');
}

function previewCard(item){return `<article class="preview-item"><div class="preview-item__image">${item.image?`<img src="${esc(item.image)}" alt="${esc(item.imageAlt||'')}">`:''}</div>${item.category?`<p class="eyebrow" style="margin-top:14px">${esc(item.category)}</p>`:''}<h3>${esc(item.title)}</h3><p>${esc(item.description||item.summary||'')}</p></article>`;}

function openPreview(){state=getHomepageData();previewMode='draft';document.querySelectorAll('[data-preview-mode]').forEach((button)=>button.classList.toggle('is-active',button.dataset.previewMode==='draft'));renderHomepagePreview('desktop');previewModal.showModal();}

function setupDragAndDrop(){
  const container=workspace.querySelector('[data-sortable]'); if(!container)return; let dragged=null;
    container.querySelectorAll('[draggable="true"]').forEach(row=>{row.addEventListener('dragstart',()=>{dragged=row;row.style.opacity='.45';});row.addEventListener('dragend',()=>{row.style.opacity='';dragged=null;});row.addEventListener('dragover',(event)=>event.preventDefault());row.addEventListener('drop',async(event)=>{event.preventDefault();if(!dragged||dragged===row)return;row.parentNode.insertBefore(dragged,row);const ids=[...container.querySelectorAll('[data-id]')].map(item=>item.dataset.id);const type=container.dataset.sortable;if(type==='projects'){try{featuredProjectDrafts=await(await getProjectsService()).reorderFeaturedProjectDrafts(ids);renderCollection('projects');notify('Project order updated.');}catch(error){notify(`Project order failed: ${error.message}`,'error');}return;}if(type==='news'){try{newsArticleDrafts=await(await getNewsService()).reorderNewsArticleDrafts(ids);renderCollection('news');notify('News article order updated.');}catch(error){notify(`News article order failed: ${error.message}`,'error');}return;}if(type==='expertise'){try{expertiseSlideDrafts=await(await getExpertiseService()).reorderExpertiseSlideDrafts(ids);renderCollection('expertise');notify('Expertise order updated.');}catch(error){notify(`Expertise order failed: ${error.message}`,'error');}return;}if(type==='logos'){try{logoBridgeDraftItems=await(await getLogoBridgeService()).reorderLogoBridgeDraftItems(ids);renderLogoBridge();notify('Logo order updated.');}catch(error){notify(`Logo order failed: ${error.message}`,'error');}return;}if(type==='stats'){try{const byId=new Map(currentSnapshotStatistics().map(item=>[item.id,item]));snapshotStatistics=await(await getSnapshotService()).saveBusinessSnapshotStatistics(ids.map(id=>byId.get(id)).filter(Boolean));renderSnapshot();notify('Statistic order updated.');}catch(error){notify(`Statistic order failed: ${error.message}`,'error');}return;}if(collectionConfig[type])reorderHomepageItems(collectionConfig[type].key,ids);else if(type==='sections')reorderHomepageItems('homepageSections',ids);state=getHomepageData();render();notify('Order updated.');});});
}

function renderExpertiseEditorPreview(form) {
  const preview=form?.querySelector('[data-expertise-editor-preview]');if(!preview)return;
  const data=formObject(form),imageUrl=form.elements.image.value,total=Math.max(1,(expertiseSlideDrafts||[]).length),order=Math.max(1,Number(data.order)||1);
  const image=preview.querySelector(':scope > img');
  image.src=imageUrl||'';image.hidden=!imageUrl;image.alt=data.imageAlt||'';image.style.objectPosition=`${Number(data.focalX)||0}% ${Number(data.focalY)||0}%`;
  preview.style.setProperty('--expertise-preview-overlay',String(Math.max(0,Math.min(100,Number(data.overlayOpacity)||0))/100));
  preview.querySelector('[data-expertise-preview-label]').textContent=data.eyebrow||expertiseSectionDraft?.sectionLabel||'OUR EXPERTISE';
  preview.querySelector('[data-expertise-preview-counter]').textContent=`${String(order).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
  preview.querySelector('h3').textContent=data.heading||'';
  preview.querySelector('[data-expertise-preview-description]').textContent=data.description||'';
  const cta=preview.querySelector('[data-expertise-preview-cta]');cta.hidden=!(data.ctaLabel&&data.ctaUrl);cta.href=data.ctaUrl||'#projects';cta.childNodes[0].nodeValue=`${data.ctaLabel||''} `;
  const focal=form.querySelector('[data-focal-selector]');const focalImage=focal?.querySelector('img');
  if(focalImage){focalImage.src=imageUrl||'';focalImage.alt=data.imageAlt||'';focalImage.style.objectPosition=image.style.objectPosition;}
  const point=focal?.querySelector('.focal-preview__point');if(point)point.style.cssText=`left:${Number(data.focalX)||0}%;top:${Number(data.focalY)||0}%`;
}

function bindFocalSelector(){const preview=workspace.querySelector('[data-focal-selector]');if(!preview)return;preview.addEventListener('click',(event)=>{const rect=preview.getBoundingClientRect(),x=Math.round((event.clientX-rect.left)/rect.width*100),y=Math.round((event.clientY-rect.top)/rect.height*100);workspace.querySelector('#focalX').value=x;workspace.querySelector('#focalY').value=y;preview.querySelector('.focal-preview__point').style.cssText=`left:${x}%;top:${y}%`;renderExpertiseEditorPreview(preview.closest('form'));setDirty();});}

function renderHeroPreview(form) {
  const preview=form?.querySelector('[data-hero-preview]'); if(!preview)return;
  const data=formObject(form),device=preview.dataset.device||'desktop',reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldPlay=Boolean(heroEditorMedia.videoUrl)&&!reduced&&(device!=='mobile'||data.mobileVideoEnabled);
  const currentVideo=preview.querySelector('[data-hero-preview-video]');
  if(shouldPlay){
    if(!currentVideo||currentVideo.src!==heroEditorMedia.videoUrl){const video=document.createElement('video');video.dataset.heroPreviewVideo='';video.src=heroEditorMedia.videoUrl;video.poster=heroEditorMedia.posterUrl;video.autoplay=true;video.muted=true;video.defaultMuted=true;video.playsInline=true;preview.querySelector('video,img,.hero-media-preview__empty')?.remove();preview.prepend(video);}
    const video=preview.querySelector('[data-hero-preview-video]');video.loop=Boolean(data.loopEnabled);video.playbackRate=Number(data.playbackRate||1);video.play().catch(()=>{});
  }else{
    currentVideo?.pause();currentVideo?.remove();let image=preview.querySelector('img');
    if(heroEditorMedia.posterUrl){if(!image){image=document.createElement('img');preview.prepend(image);}image.src=heroEditorMedia.posterUrl;image.alt=data.posterAltText||'';preview.querySelector('.hero-media-preview__empty')?.remove();}
    else{image?.remove();if(!preview.querySelector('.hero-media-preview__empty'))preview.insertAdjacentHTML('afterbegin','<div class="hero-media-preview__empty">No Hero video or poster selected</div>');}
  }
  const copy=preview.querySelector('.media-preview__copy');
  if(copy)copy.innerHTML=`<h3>${esc(data.heading)}</h3>`;
  let label=preview.querySelector('.hero-media-preview__label');if(!shouldPlay&&heroEditorMedia.posterUrl){if(!label){preview.insertAdjacentHTML('beforeend','<span class="hero-media-preview__label"></span>');label=preview.querySelector('.hero-media-preview__label');}label.textContent=heroEditorMedia.videoUrl?'Poster fallback preview':'Poster background preview';}else if(shouldPlay)label?.remove();
}

document.addEventListener('submit',async (event)=>{if(event.target.matches('.editor-form')){event.preventDefault();await saveForm(event.target,event.submitter);}});

document.addEventListener('input',(event)=>{if(event.target.closest('.editor-form'))setDirty();if(event.target.matches('[data-range-output]'))document.querySelector(`#${event.target.dataset.rangeOutput}`).value=`${event.target.value}%`;const heroForm=event.target.closest('[data-form="hero"]');if(heroForm)renderHeroPreview(heroForm);const snapshotForm=event.target.closest('[data-form="snapshot"]');if(snapshotForm)renderSnapshotPreview(snapshotForm);const expertiseForm=event.target.closest('[data-form="collection-item"][data-collection="expertise"]');if(expertiseForm){if(event.target.name==='imageAlt')expertiseForm.dataset.expertiseAltTouched='true';renderExpertiseEditorPreview(expertiseForm);}const projectForm=event.target.closest('[data-form="collection-item"][data-collection="projects"]');if(projectForm){if(event.target.name==='imageAlt')projectForm.dataset.projectAltTouched='true';const preview=projectForm.querySelector('.preview-item');if(preview){preview.querySelector('h3').textContent=projectForm.elements.title.value;preview.querySelector('p').textContent=projectForm.elements.description.value;preview.querySelector('.arrow-link').textContent=`${projectForm.elements.buttonLabel.value} \u2192`;const image=preview.querySelector('.media-preview img');if(image)image.alt=projectForm.elements.imageAlt.value;}}const discoveryForm=event.target.closest('[data-form="discovery"]');if(discoveryForm){const preview=discoveryForm.querySelector('[data-discovery-preview]');if(preview){preview.style.textAlign=discoveryForm.elements.alignment.value;preview.querySelector('[data-discovery-preview-paragraph]').textContent=discoveryForm.elements.paragraph.value;preview.querySelector('[data-discovery-preview-button]').textContent=discoveryForm.elements.buttonLabel.value;}}});

async function handleHeroVideoSelection(file, form) {
  lastHeroVideoFile = file;
  dismissNotification('hero-video-upload');
  form.querySelector('[data-hero-preview-video]')?.pause();
  updateHeroVideoUploadUi({ state:'Validating', fileName:file.name, mimeType:file.type, bytesUploaded:0, bytesTotal:file.size, percentage:0, speedBps:0, etaSeconds:null, message:'Validating selected video…', error:null, controllerActive:false });
  try {
    await validateHeroVideoFile(file);
    const metadata = await inspectHeroFile(file);
    const result = await uploadHeroVideoResumable(file, {
      ...metadata,
      onStateChange: ({ state:uploadState, message='', error=null }) => updateHeroVideoUploadUi({ state:uploadState, message, error:uploadState==='Failed'?error:null, controllerActive:!['Complete','Cancelled'].includes(uploadState) }),
      onProgress: ({ bytesUploaded, bytesTotal, percentage, speedBps, etaSeconds }) => updateHeroVideoUploadUi({ bytesUploaded, bytesTotal, percentage, speedBps, etaSeconds })
    });
    heroEditorMedia.videoAsset = result.asset;
    heroEditorMedia.videoUrl = result.publicUrl;
    form.elements.backgroundVideoAssetId.value = result.asset.id;
    heroDraft = { ...(heroDraft||state.hero), ...formObject(form), media:{...heroEditorMedia} };
    setDirty();
    if (route()==='hero') renderHero();
    updateHeroVideoUploadUi({ state:'Complete', message:'Video upload complete.', error:null, controllerActive:false });
    notify('Video uploaded. Save the draft to attach it.','success','hero-video-upload');
  } catch (error) {
    if (error.code === 'UPLOAD_CANCELLED') notify('Video upload cancelled. The saved Hero video was not changed.','success','hero-video-upload');
    else if (error.code === 'AUTH_REQUIRED') { notify(error.message,'error','hero-video-upload'); showLogin(error.message); }
    else { updateHeroVideoUploadUi({ state:'Failed', message:error.message, error }); notify(`Upload failed: ${error.message}`,'error','hero-video-upload'); }
  }
}

async function handleHeroPosterSelection(file, form) {
  const progress=form.querySelector('[data-upload-progress]');progress.hidden=false;progress.value=0;setSaving(form,true,'Uploading poster…');
  try {
    const metadata=await inspectHeroFile(file);
    const result=await uploadHomepageMedia(file,{mediaType:'poster',altText:form.elements.posterAltText.value,...metadata,onProgress:value=>{progress.value=value;}});
    heroEditorMedia.posterAsset=result.asset;heroEditorMedia.posterUrl=result.publicUrl;form.elements.posterAssetId.value=result.asset.id;
    heroDraft={...(heroDraft||state.hero),...formObject(form),media:{...heroEditorMedia}};
    setDirty();renderHero();notify('Poster uploaded. Save the draft to attach it.');
  } catch(error) { renderHeroPreview(form);notify(`Upload failed: ${error.message}`,'error'); }
  finally { window.setTimeout(()=>{const current=workspace.querySelector('[data-upload-progress]');if(current)current.hidden=true;},800);setSaving(workspace.querySelector('[data-form="hero"]'),false); }
}

async function handleSnapshotVideoSelection(file,form) {
  lastSnapshotVideoFile=file;dismissNotification('snapshot-video-upload');
  updateSnapshotVideoUploadUi({ state:'Validating',fileName:file.name,mimeType:file.type,bytesUploaded:0,bytesTotal:file.size,percentage:0,speedBps:0,etaSeconds:null,message:'Inspecting Business Snapshot video…',error:null });
  try {
    const metadata=await inspectHeroFile(file);
    const result=await uploadBusinessSnapshotVideo(file,{
      ...metadata,
      onStateChange:(uploadState)=>updateSnapshotVideoUploadUi({ ...uploadState,fileName:file.name,mimeType:file.type }),
      onProgress:({ bytesUploaded,bytesTotal,percentage,speedBps,etaSeconds })=>updateSnapshotVideoUploadUi({ bytesUploaded,bytesTotal,percentage,speedBps,etaSeconds })
    });
    snapshotDraft=captureSnapshotForm(form);snapshotEditorMedia.videoAsset=result.asset;snapshotEditorMedia.videoUrl=result.publicUrl;
    snapshotDraft.backgroundVideoAssetId=result.asset.id;snapshotDraft.media={...snapshotEditorMedia};setDirty();
    updateSnapshotVideoUploadUi({ state:'Complete',percentage:100,bytesUploaded:file.size,message:'Business Snapshot video upload complete.' });
    if (route()==='snapshot') renderSnapshot();
    notify('Business Snapshot video uploaded. Save the draft to attach it.','success','snapshot-video-upload');
  } catch(error) {
    if (error.code==='UPLOAD_CANCELLED') notify('Business Snapshot upload cancelled. The draft media was not changed.','success','snapshot-video-upload');
    else if (error.code==='AUTH_REQUIRED') { notify(error.message,'error','snapshot-video-upload');showLogin(error.message); }
    else { updateSnapshotVideoUploadUi({ state:'Failed',message:error.message,error });notify(`Business Snapshot video upload failed: ${error.message}`,'error','snapshot-video-upload'); }
  }
}

async function handleSnapshotPosterSelection(file,form) {
  const progress=form.querySelector('[data-snapshot-poster-progress]'),status=form.querySelector('[data-snapshot-poster-status]');
  progress.hidden=false;progress.value=0;status.textContent='Validating poster…';setSaving(form,true,'Uploading Snapshot poster…');
  try {
    const metadata=await inspectHeroFile(file);status.textContent='Uploading poster…';
    const result=await uploadBusinessSnapshotPoster(file,{ ...metadata,onProgress:(value)=>{progress.value=value;} });
    snapshotDraft=captureSnapshotForm(form);snapshotEditorMedia.posterAsset=result.asset;snapshotEditorMedia.posterUrl=result.publicUrl;
    snapshotDraft.posterAssetId=result.asset.id;snapshotDraft.media={...snapshotEditorMedia};setDirty();renderSnapshot();
    notify('Business Snapshot poster uploaded. Save the draft to attach it.');
  } catch(error) { status.textContent='Poster upload failed. The selected draft poster was kept.';notify(`Business Snapshot poster upload failed: ${error.message}`,'error'); }
  finally { window.setTimeout(()=>{const current=workspace.querySelector('[data-snapshot-poster-progress]');if(current)current.hidden=true;},800);setSaving(workspace.querySelector('[data-form="snapshot"]'),false); }
}

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-hero-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],type=input.dataset.mediaType;
  input.value='';
  if(type==='video') await handleHeroVideoSelection(file,form);
  else await handleHeroPosterSelection(file,form);
});

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-expertise-image-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],progress=form.querySelector('[data-expertise-upload-progress]'),status=form.querySelector('[data-expertise-image-status]');
  input.value='';dismissNotification('expertise-image-upload');progress.hidden=false;progress.value=0;status.textContent='Validating image…';setSaving(form,true,'Uploading image…');
  try {
    const metadata=await inspectHeroFile(file);status.textContent='Uploading image…';
    const result=await uploadExpertiseSlideImage(file,{...metadata,altText:form.elements.imageAlt.value,onProgress:(value)=>{progress.value=value;}});
    applyExpertiseImageSelection(form,result.asset,result.publicUrl,{prefillAlt:true});
    form.querySelector('[data-expertise-image-status]').textContent='Upload complete. Save the slide draft to attach this image.';
    notify('Expertise image uploaded. Save the draft to attach it.','success','expertise-image-upload');
  } catch(error){status.textContent='Upload failed. The existing Expertise image was kept.';notify(`Expertise image upload failed: ${error.message}`,'error','expertise-image-upload');}
  finally{window.setTimeout(()=>{const current=form.querySelector('[data-expertise-upload-progress]');if(current)current.hidden=true;},800);setSaving(form,false);const remove=form.querySelector('[data-action="remove-expertise-image"]');if(remove)remove.disabled=!form.elements.backgroundImageAssetId.value;}
});

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-news-image-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],progress=form.querySelector('[data-news-upload-progress]'),status=form.querySelector('[data-news-image-status]');
  input.value='';dismissNotification('news-image-upload');progress.hidden=false;progress.value=0;status.textContent='Validating image…';setSaving(form,true,'Uploading image…');
  try {
    const metadata=await inspectHeroFile(file);status.textContent='Uploading image…';
    const result=await uploadNewsArticleImage(file,{...metadata,altText:form.elements.imageAlt.value,onProgress:(value)=>{progress.value=value;}});
    applyNewsImageSelection(form,result.asset,result.publicUrl,{prefillAlt:true});
    form.querySelector('[data-news-image-status]').textContent='Upload complete. Save the article draft to attach this image.';
    notify('News image uploaded. Save the draft to attach it.','success','news-image-upload');
  } catch(error){status.textContent='Upload failed. The existing article image was kept.';notify(`News image upload failed: ${error.message}`,'error','news-image-upload');}
  finally{window.setTimeout(()=>{const current=form.querySelector('[data-news-upload-progress]');if(current)current.hidden=true;},800);setSaving(form,false);const remove=form.querySelector('[data-action="remove-news-image"]');if(remove)remove.disabled=!form.elements.imageAssetId.value;}
});

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-logo-image-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],progress=form.querySelector('[data-logo-upload-progress]'),status=form.querySelector('[data-logo-image-status]');
  input.value='';dismissNotification('logo-image-upload');progress.hidden=false;progress.value=0;status.textContent='Validating logo image…';setSaving(form,true,'Uploading logo…');
  try {
    const existing=(await getLogoBridgeImageAssets()).find((asset)=>asset.original_filename===file.name&&Number(asset.size_bytes)===Number(file.size));
    if(existing){applyLogoImageSelection(form,existing,existing.publicUrl,{prefillAlt:true});form.querySelector('[data-logo-image-status]').textContent='An identical filename and file size already exists. The Media Library asset was selected instead.';notify('Existing Media Library logo selected; no duplicate was uploaded.','success','logo-image-upload');return;}
    const metadata=await inspectHeroFile(file);status.textContent='Uploading logo…';
    const result=await uploadLogoBridgeImage(file,{...metadata,altText:form.elements.altText.value,onProgress:(value)=>{progress.value=value;}});
    applyLogoImageSelection(form,result.asset,result.publicUrl,{prefillAlt:true});
    form.querySelector('[data-logo-image-status]').textContent='Upload complete. Save the logo draft to attach this image.';
    notify('Logo uploaded. Save the draft to attach it.','success','logo-image-upload');
  } catch(error){status.textContent='Upload failed. The existing draft logo was kept.';notify(`Logo upload failed: ${error.message}`,'error','logo-image-upload');}
  finally{window.setTimeout(()=>{const current=form.querySelector('[data-logo-upload-progress]');if(current)current.hidden=true;},800);setSaving(form,false);const remove=form.querySelector('[data-action="remove-logo-image"]');if(remove)remove.disabled=!form.elements.logoAssetId.value;}
});

document.addEventListener('input',(event)=>{
  const form=event.target.closest('[data-form="collection-item"][data-collection="news"]');
  if(!form)return;
  if(event.target.name==='imageAlt')form.dataset.newsAltTouched='true';
  const preview=form.querySelector('[data-news-editor-preview]');if(!preview)return;
  if(event.target.name==='category')preview.querySelector('.eyebrow').textContent=event.target.value;
  if(event.target.name==='title')preview.querySelector('h3').textContent=event.target.value;
  if(event.target.name==='summary')preview.querySelector('p:last-child').textContent=event.target.value;
  if(event.target.name==='imageAlt')preview.querySelector('img')?.setAttribute('alt',event.target.value);
});

document.addEventListener('input',(event)=>{
  const settingsForm=event.target.closest('[data-form="logo-settings"]');
  if(settingsForm){
    const preview=settingsForm.querySelector('[data-logo-bridge-preview]'),data=formObject(settingsForm);
    if(preview){preview.querySelector('.eyebrow').textContent=data.eyebrow||'';preview.querySelector('h3').textContent=data.heading||'';const description=preview.querySelector('[data-logo-preview-description]');description.textContent=data.description||'';description.hidden=!data.description;}
    return;
  }
  const form=event.target.closest('[data-form="logo-item"]');
  if(!form)return;
  if(event.target.name==='altText')form.dataset.logoAltTouched='true';
  renderLogoEditorPreview(form);
});

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-snapshot-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],type=input.dataset.mediaType;input.value='';
  if(type==='video')await handleSnapshotVideoSelection(file,form);else await handleSnapshotPosterSelection(file,form);
});

document.addEventListener('change',async(event)=>{
  if(!event.target.matches('[data-project-image-file]')||!event.target.files[0])return;
  const input=event.target,form=input.closest('form'),file=input.files[0],progress=form.querySelector('[data-project-upload-progress]'),status=form.querySelector('[data-project-image-status]');
  input.value='';dismissNotification('project-image-upload');progress.hidden=false;progress.value=0;status.textContent='Validating image…';setSaving(form,true,'Uploading image…');
  try{
    const metadata=await inspectHeroFile(file);status.textContent='Uploading image…';
    const result=await uploadFeaturedProjectImage(file,{...metadata,altText:form.elements.imageAlt.value,onProgress:value=>{progress.value=value;}});
    applyProjectImageSelection(form,result.asset,result.publicUrl,{prefillAlt:true});
    form.querySelector('[data-project-image-status]').textContent='Upload complete. Save the project draft to attach this image.';
    notify('Project image uploaded. Save the draft to attach it.','success','project-image-upload');
  }
  catch(error){status.textContent='Upload failed. The existing project image was kept.';notify(`Project image upload failed: ${error.message}`,'error','project-image-upload');}
  finally{window.setTimeout(()=>{const current=form.querySelector('[data-project-upload-progress]');if(current)current.hidden=true;},800);setSaving(form,false);const remove=form.querySelector('[data-action="remove-project-image"]');if(remove)remove.disabled=!form.elements.imageAssetId.value;}
});

document.addEventListener('click',async (event)=>{
  const button=event.target.closest('[data-action]'); if(!button)return; const action=button.dataset.action;
  if(action==='preview')openPreview();
  else if(action==='publish-page'){const discoveryForm=workspace.querySelector('[data-form="discovery"]');if(discoveryForm){discoveryForm.requestSubmit(discoveryForm.querySelector('button[value="publish"]'));}else{updateHomepageData(draft=>{draft.meta.lastPublished=now();});state=getHomepageData();notify('Homepage mock state marked as published.');}}
  else if(action==='unpublish-current'){const form=button.closest('form');if(form?.dataset.collection==='projects'){try{await(await getProjectsService()).unpublishFeaturedProjects();notify('Featured Projects unpublished.');}catch(error){notify(`Projects could not be unpublished: ${error.message}`,'error');}}else if(form?.dataset.form==='hero'){try{setSaving(form,true,'Unpublishing…');publishedHero=await unpublishHero();setDirty(false);notify('Hero unpublished. The public fallback is active.');renderHero();}catch(error){notify(`Hero could not be unpublished: ${error.message}`,'error');}finally{setSaving(workspace.querySelector('[data-form="hero"]'),false);}}else if(form?.dataset.form==='discovery'){try{setSaving(form,true,'Unpublishing…');discoveryRecord=await unpublishDiscoveryBridge();setDirty(false);notify('Discovery Bridge unpublished.');renderDiscovery();}catch(error){notify(`Discovery Bridge could not be unpublished: ${error.message}`,'error');}finally{setSaving(workspace.querySelector('[data-form="discovery"]'),false);}}else if(form?.dataset.form==='snapshot'){try{setSaving(form,true,'Unpublishing…');publishedSnapshot=await(await getSnapshotService()).unpublishBusinessSnapshot();setDirty(false);notify('Business Snapshot unpublished. The public static fallback is active.');renderSnapshot();}catch(error){notify(`Business Snapshot could not be unpublished: ${error.message}`,'error');}finally{setSaving(workspace.querySelector('[data-form="snapshot"]'),false);}}else{const status=form?.querySelector('[name="status"]');if(status){status.value='draft';setDirty();notify('Status changed to draft. Save to confirm.');}else notify('This screen has no publishable item.','error');}}
  else if(action==='sign-out'){const activeUpload=isHeroVideoUploadActive()||isSnapshotVideoUploadActive();if((dirty||activeUpload)&&!window.confirm(activeUpload?'A media upload is active. Sign out and interrupt it?':'You have unsaved changes. Sign out anyway?'))return;try{if(isHeroVideoUploadActive())await cancelHeroVideoUpload();if(isSnapshotVideoUploadActive())await cancelBusinessSnapshotVideoUpload();setDirty(false);await signOutAdmin();showLogin();notify('Signed out.');}catch(error){notify(`Sign out failed: ${error.message}`,'error');}}
  else if(action==='add-item')addItem(button.dataset.collection);
  else if(action==='add-logo')renderLogoEditor({logoKey:globalThis.crypto.randomUUID(),organizationName:'',logoAssetId:'',logoAsset:null,logo:'',altText:'',order:(logoBridgeDraftItems||[]).length+1,visible:true,status:'draft',updatedAt:null},true);
  else if(action==='edit-logo'){const item=(logoBridgeDraftItems||[]).find((entry)=>entry.logoKey===button.dataset.id);if(item)renderLogoEditor(item);}
  else if(action==='back-to-logos'){setDirty(false);location.hash='logos';render();}
  else if(action==='duplicate-logo'){try{await(await getLogoBridgeService()).duplicateLogoBridgeDraftItem(button.dataset.id);await loadLogoBridgeFromSupabase();renderLogoBridge();notify('Logo duplicated as a draft.');}catch(error){notify(`Logo could not be duplicated: ${error.message}`,'error');}}
  else if(action==='move-logo')await moveLogo(button.dataset.id,button.dataset.direction);
  else if(action==='delete-logo-draft'){const id=button.dataset.id||activeEditor?.id;if(!id)return;const item=(logoBridgeDraftItems||[]).find((entry)=>entry.logoKey===id);confirmAction('Delete this logo draft?',item?.isPublished?'Its published version will remain live until the Logo Bridge is republished.':'This removes only the Supabase draft.',async()=>{await(await getLogoBridgeService()).deleteLogoBridgeDraftItem(id);await loadLogoBridgeFromSupabase();setDirty(false);location.hash='logos';render();notify('Logo draft deleted.');});}
  else if(action==='delete-logo-completely'){const id=button.dataset.id||activeEditor?.id;if(!id)return;confirmAction('Delete this logo completely?','This permanently removes both the draft and published records. The media file remains in the Media Library.',async()=>{await(await getLogoBridgeService()).deleteLogoBridgeItemCompletely(id);await loadLogoBridgeFromSupabase();setDirty(false);location.hash='logos';render();notify('Logo draft and published version deleted.');},'Delete completely');}
  else if(action==='publish-logos'){try{const service=await getLogoBridgeService(),settingsForm=workspace.querySelector('[data-form="logo-settings"]');if(settingsForm)logoBridgeDraftSettings=await service.saveLogoBridgeDraftSettings(formObject(settingsForm));await service.publishLogoBridge();await loadLogoBridgeFromSupabase();setDirty(false);renderLogoBridge();notify('Logo Bridge published.');if((logoBridgeDraftItems||[]).filter((item)=>item.visible!==false).length<4)notify('Four or more logos are recommended for a balanced desktop layout.','warning');}catch(error){notify(`Logo Bridge could not be published: ${error.message}`,'error');}}
  else if(action==='unpublish-logos'){try{await(await getLogoBridgeService()).unpublishLogoBridge();await loadLogoBridgeFromSupabase();renderLogoBridge();notify('Logo Bridge unpublished. The public logo grid is hidden.');}catch(error){notify(`Logo Bridge could not be unpublished: ${error.message}`,'error');}}
  else if(action==='edit-item'){const routeKey=button.dataset.collection,config=collectionConfig[routeKey],item=routeKey==='projects'?(featuredProjectDrafts||[]).find(entry=>entry.id===button.dataset.id):routeKey==='news'?(newsArticleDrafts||[]).find(entry=>entry.id===button.dataset.id):routeKey==='expertise'?(expertiseSlideDrafts||[]).find(entry=>entry.id===button.dataset.id):state[config.key].find(entry=>entry.id===button.dataset.id);renderItemEditor(routeKey,item);}
  else if(action==='back-to-list'){setDirty(false);location.hash=button.dataset.collection;render();}
  else if(action==='duplicate-item')duplicateItem(button.dataset.collection,button.dataset.id);
  else if(action==='move-item')moveInCollection(button.dataset.collection,button.dataset.id,button.dataset.direction);
  else if(action==='delete-item'){const routeKey=button.dataset.collection,config=collectionConfig[routeKey];if(routeKey==='projects'){const item=(featuredProjectDrafts||[]).find(x=>x.id===button.dataset.id);confirmAction('Delete this project draft?',item?.isPublished?'Its published version will remain live until the collection is republished.':'This removes the Supabase draft.',async()=>{await(await getProjectsService()).deleteFeaturedProjectDraft(button.dataset.id);await loadFeaturedProjectsFromSupabase();renderCollection('projects');notify('Project draft deleted.');});}else if(routeKey==='news'){const item=(newsArticleDrafts||[]).find(x=>x.id===button.dataset.id);confirmAction('Delete this article draft?',item?.isPublished?'Its published version will remain live until the collection is republished.':'This removes only the Supabase draft.',async()=>{await(await getNewsService()).deleteNewsArticleDraft(button.dataset.id);await loadNewsFromSupabase();renderCollection('news');notify('News article draft deleted.');});}else if(routeKey==='expertise'){const item=(expertiseSlideDrafts||[]).find(x=>x.id===button.dataset.id);confirmAction('Delete this Expertise slide draft?',item?.isPublished?'Its published version will remain live until the section is republished.':'This removes only the Supabase draft.',async()=>{await(await getExpertiseService()).deleteExpertiseSlideDraft(button.dataset.id);await loadExpertiseFromSupabase();renderCollection('expertise');notify('Expertise slide draft deleted.');});}else confirmAction(`Delete this ${config.singular}?`,'This removes it from local mock data. You can restore source data from Homepage Settings.',()=>{deleteHomepageItem(config.key,button.dataset.id);render();notify(`${config.singular} deleted.`);});}
  else if(action==='delete-news-completely'){const id=button.dataset.id||activeEditor?.id;if(!id)return;confirmAction('Delete this article completely?','This permanently removes both the draft and any published version. The image remains in the Media Library.',async()=>{await(await getNewsService()).deleteNewsArticleCompletely(id);await loadNewsFromSupabase();setDirty(false);location.hash='news';render();notify('News article draft and published version deleted.');},'Delete completely');}
  else if(action==='delete-expertise-completely'){const id=button.dataset.id||activeEditor?.id;if(!id)return;confirmAction('Delete this Expertise slide completely?','This permanently removes both the draft and any published version. Its image remains in the Media Library.',async()=>{await(await getExpertiseService()).deleteExpertiseSlideCompletely(id);await loadExpertiseFromSupabase();setDirty(false);location.hash='expertise';render();notify('Expertise slide draft and published version deleted.');},'Delete completely');}
  else if(action==='delete-current'&&activeEditor){if(activeEditor.routeKey==='projects'){confirmAction('Delete this project draft?','A published version will remain until the collection is republished.',async()=>{await(await getProjectsService()).deleteFeaturedProjectDraft(activeEditor.id);await loadFeaturedProjectsFromSupabase();location.hash='projects';render();});}else if(activeEditor.routeKey==='news'){confirmAction('Delete this article draft?','A published version will remain live until the collection is republished.',async()=>{await(await getNewsService()).deleteNewsArticleDraft(activeEditor.id);await loadNewsFromSupabase();setDirty(false);location.hash='news';render();notify('News article draft deleted.');});}else if(activeEditor.routeKey==='expertise'){confirmAction('Delete this Expertise slide draft?','A published version will remain live until the section is republished.',async()=>{await(await getExpertiseService()).deleteExpertiseSlideDraft(activeEditor.id);await loadExpertiseFromSupabase();setDirty(false);location.hash='expertise';render();notify('Expertise slide draft deleted.');});}else if(activeEditor.stat){confirmAction('Delete this statistic?','This removes it from the Business Snapshot draft while preserving the published version.',async()=>{const items=currentSnapshotStatistics().filter(item=>item.id!==activeEditor.id);snapshotStatistics=await(await getSnapshotService()).saveBusinessSnapshotStatistics(items);location.hash='snapshot';render();notify('Statistic draft deleted.');});}else if(activeEditor.routeKey==='media'){const asset=state.mediaAssets.find(a=>a.id===activeEditor.id);if(asset.usedBy.length)notify(`Cannot delete: used by ${asset.usedBy.join(', ')}.`,'error');else confirmAction('Delete this asset?','Unused mock media will be removed.',()=>{deleteHomepageItem('mediaAssets',activeEditor.id);location.hash='media';render();});}else{const config=collectionConfig[activeEditor.routeKey];confirmAction(`Delete this ${config.singular}?`,'This removes it from local mock data.',()=>{deleteHomepageItem(config.key,activeEditor.id);location.hash=activeEditor.routeKey;render();});}}
  else if(action==='publish-projects'){try{await(await getProjectsService()).publishFeaturedProjects();await loadFeaturedProjectsFromSupabase();renderCollection('projects');notify('Featured Projects published.');}catch(error){notify(`Projects could not be published: ${error.message}`,'error');}}
  else if(action==='unpublish-projects'){try{await(await getProjectsService()).unpublishFeaturedProjects();notify('Featured Projects unpublished. The public fallback is active.');}catch(error){notify(`Projects could not be unpublished: ${error.message}`,'error');}}
  else if(action==='publish-news'){try{await(await getNewsService()).publishNewsArticles();await loadNewsFromSupabase();renderCollection('news');notify('News & Foresight collection published.');}catch(error){notify(`News & Foresight could not be published: ${error.message}`,'error');}}
  else if(action==='unpublish-news'){try{await(await getNewsService()).unpublishNewsArticles();await loadNewsFromSupabase();renderCollection('news');notify('News & Foresight unpublished. The public fallback is active.');}catch(error){notify(`News & Foresight could not be unpublished: ${error.message}`,'error');}}
  else if(action==='publish-expertise'){try{const service=await getExpertiseService(),settingsForm=workspace.querySelector('[data-form="expertise-settings"]');if(settingsForm)expertiseSectionDraft=await service.saveExpertiseSectionDraft(formObject(settingsForm));await service.publishExpertiseSection();await loadExpertiseFromSupabase();setDirty(false);renderCollection('expertise');notify('Expertise section published.');}catch(error){notify(`Expertise could not be published: ${error.message}`,'error');}}
  else if(action==='unpublish-expertise'){try{await(await getExpertiseService()).unpublishExpertiseSection();await loadExpertiseFromSupabase();renderCollection('expertise');notify('Expertise unpublished. The public fallback is active.');}catch(error){notify(`Expertise could not be unpublished: ${error.message}`,'error');}}
  else if(action==='upload-project-image'){button.closest('form').querySelector('[data-project-image-file]').click();}
  else if(action==='choose-project-media'){await openProjectMediaPicker(button.closest('form'));}
  else if(action==='close-project-media-picker'){closeProjectMediaPicker();}
  else if(action==='use-project-media'){const asset=projectMediaAssets.find(item=>item.id===selectedProjectMediaAssetId);if(asset&&projectMediaTargetForm){applyProjectImageSelection(projectMediaTargetForm,asset,asset.publicUrl,{prefillAlt:true});notify('Media Library image selected. Save the project draft to attach it.');closeProjectMediaPicker();}}
  else if(action==='remove-project-image'){const form=button.closest('form');if(!form.elements.imageAssetId.value)return;confirmAction('Remove this project image?','This detaches the image from the unsaved project draft. The Media Library asset will not be deleted.',()=>{applyProjectImageSelection(form,null,'');notify('Image removed from the unsaved project draft.');},'Remove');}
  else if(action==='upload-expertise-image'){button.closest('form').querySelector('[data-expertise-image-file]').click();}
  else if(action==='choose-expertise-media'){await openExpertiseMediaPicker(button.closest('form'));}
  else if(action==='close-expertise-media-picker'){closeExpertiseMediaPicker();}
  else if(action==='use-expertise-media'){const asset=expertiseMediaAssets.find((item)=>item.id===selectedExpertiseMediaAssetId);if(asset&&expertiseMediaTargetForm){applyExpertiseImageSelection(expertiseMediaTargetForm,asset,asset.publicUrl,{prefillAlt:true});notify('Media Library image selected. Save the Expertise slide draft to attach it.');closeExpertiseMediaPicker();}}
  else if(action==='remove-expertise-image'){const form=button.closest('form');if(!form.elements.backgroundImageAssetId.value)return;confirmAction('Remove this Expertise image?','This detaches the image from the unsaved slide draft. The Media Library asset will not be deleted.',()=>{applyExpertiseImageSelection(form,null,'');notify('Image removed from the unsaved Expertise slide draft.');},'Remove');}
  else if(action==='upload-logo-image'){button.closest('form').querySelector('[data-logo-image-file]').click();}
  else if(action==='choose-logo-media'){await openLogoMediaPicker(button.closest('form'));}
  else if(action==='close-logo-media-picker'){closeLogoMediaPicker();}
  else if(action==='use-logo-media'){const asset=logoMediaAssets.find((item)=>item.id===selectedLogoMediaAssetId);if(asset&&logoMediaTargetForm){applyLogoImageSelection(logoMediaTargetForm,asset,asset.publicUrl,{prefillAlt:true});notify('Media Library logo selected. Save the logo draft to attach it.');closeLogoMediaPicker();}}
  else if(action==='remove-logo-image'){const form=button.closest('form');if(!form.elements.logoAssetId.value)return;confirmAction('Remove this draft logo image?','This detaches the image from the unsaved logo draft. The Media Library asset and published logo are unchanged.',()=>{applyLogoImageSelection(form,null,'');notify('Logo image removed from the unsaved draft.');},'Remove');}
  else if(action==='upload-news-image'){button.closest('form').querySelector('[data-news-image-file]').click();}
  else if(action==='choose-news-media'){await openNewsMediaPicker(button.closest('form'));}
  else if(action==='close-news-media-picker'){closeNewsMediaPicker();}
  else if(action==='use-news-media'){const asset=newsMediaAssets.find((item)=>item.id===selectedNewsMediaAssetId);if(asset&&newsMediaTargetForm){applyNewsImageSelection(newsMediaTargetForm,asset,asset.publicUrl,{prefillAlt:true});notify('Media Library image selected. Save the article draft to attach it.');closeNewsMediaPicker();}}
  else if(action==='remove-news-image'){const form=button.closest('form');if(!form.elements.imageAssetId.value)return;confirmAction('Remove this article image?','This detaches the image from the unsaved article draft. The Media Library asset will not be deleted.',()=>{applyNewsImageSelection(form,null,'');notify('Image removed from the unsaved article draft.');},'Remove');}
  else if(action==='upload-hero-media'){const input=button.closest('form').querySelector('[data-hero-file]');input.dataset.mediaType=button.dataset.mediaType;input.accept=button.dataset.mediaType==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp,image/avif';input.click();}
  else if(action==='pause-hero-upload'){await pauseHeroVideoUpload();}
  else if(action==='resume-hero-upload'){await resumeHeroVideoUpload();}
  else if(action==='cancel-hero-upload'){const cancelled=await cancelHeroVideoUpload();if(!cancelled)updateHeroVideoUploadUi({state:'Cancelled',message:'Video upload cancelled.',bytesUploaded:0,percentage:0,speedBps:0,etaSeconds:null});}
  else if(action==='retry-hero-upload'){try{const retried=await retryHeroVideoUpload();if(!retried&&lastHeroVideoFile)handleHeroVideoSelection(lastHeroVideoFile,button.closest('form'));}catch(error){updateHeroVideoUploadUi({state:'Failed',message:error.message});notify(`Retry failed: ${error.message}`,'error');}}
  else if(action==='remove-hero-media'){const form=button.closest('form'),type=button.dataset.mediaType;if(type==='video'){form.elements.backgroundVideoAssetId.value='';heroEditorMedia.videoAsset=null;heroEditorMedia.videoUrl='';}else{form.elements.posterAssetId.value='';heroEditorMedia.posterAsset=null;heroEditorMedia.posterUrl='';}heroDraft={...(heroDraft||state.hero),...formObject(form),media:{...heroEditorMedia}};setDirty();renderHero();notify(`${type==='video'?'Video':'Poster'} removed from the unsaved draft.`);}
  else if(action==='upload-snapshot-media'){const input=button.closest('form').querySelector('[data-snapshot-file]');input.dataset.mediaType=button.dataset.mediaType;input.accept=button.dataset.mediaType==='video'?'video/mp4,video/webm':'image/jpeg,image/png,image/webp,image/avif';input.click();}
  else if(action==='choose-snapshot-media'){await openSnapshotMediaPicker(button.closest('form'),button.dataset.mediaType);}
  else if(action==='close-snapshot-media-picker'){closeSnapshotMediaPicker();}
  else if(action==='use-snapshot-media'){const asset=snapshotMediaAssets.find(item=>item.id===selectedSnapshotMediaAssetId);if(asset&&snapshotMediaTargetForm){applySnapshotMediaSelection(snapshotMediaTargetForm,snapshotMediaKind,asset,asset.publicUrl);notify('Media Library asset selected. Save the Business Snapshot draft to attach it.');closeSnapshotMediaPicker();}}
  else if(action==='remove-snapshot-media'){const form=button.closest('form'),kind=button.dataset.mediaType;confirmAction(`Remove this ${kind}?`,'This detaches the asset from the unsaved Business Snapshot draft. The Media Library asset will not be deleted.',()=>{applySnapshotMediaSelection(form,kind,null,'');notify(`${kind==='video'?'Video':'Poster'} removed from the unsaved Business Snapshot draft.`);},'Remove');}
  else if(action==='pause-snapshot-upload'){await pauseBusinessSnapshotVideoUpload();}
  else if(action==='resume-snapshot-upload'){await resumeBusinessSnapshotVideoUpload();}
  else if(action==='cancel-snapshot-upload'){await cancelBusinessSnapshotVideoUpload();}
  else if(action==='retry-snapshot-upload'){try{const retried=await retryBusinessSnapshotVideoUpload();if(!retried&&lastSnapshotVideoFile)handleSnapshotVideoSelection(lastSnapshotVideoFile,button.closest('form'));}catch(error){updateSnapshotVideoUploadUi({state:'Failed',message:error.message});notify(`Business Snapshot retry failed: ${error.message}`,'error');}}
  else if(action==='toggle-snapshot-reduced-motion'){snapshotReducedMotionPreview=!snapshotReducedMotionPreview;button.setAttribute('aria-pressed',String(snapshotReducedMotionPreview));button.classList.toggle('is-active',snapshotReducedMotionPreview);renderSnapshotPreview(button.closest('form'));}
  else if(action==='mock-upload'){const asset={id:uniqueId('media'),filename:'new-homepage-asset.jpg',path:'',type:'image',group:'News',size:'Pending upload',dimensions:'Pending',duration:'',altText:'',uploadedAt:new Date().toISOString().slice(0,10),usedBy:[]};updateHomepageData(draft=>draft.mediaAssets.push(asset));state=getHomepageData();renderMediaEditor(asset);notify('Mock asset created. Add metadata before saving.');}
  else if(action==='replace-media'){const asset=state.mediaAssets.find(item=>item.id===button.dataset.id);renderMediaEditor(asset);notify('Update the mock path and metadata to represent a replacement.');}
  else if(action==='mock-remove-media'){const input=workspace.querySelector(`[name="${button.dataset.field}"]`);if(input){input.value='';setDirty();notify('Media removed from the unsaved draft.');}}
  else if(action==='add-stat')renderStatEditor({id:uniqueId('stat'),value:'[XX]',prefix:'',suffix:'',description:'',order:currentSnapshotStatistics().length+1,visible:true,status:'draft'},true);
  else if(action==='edit-stat'){const item=currentSnapshotStatistics().find(s=>s.id===button.dataset.id);renderStatEditor(item);}
  else if(action==='duplicate-stat'){const items=currentSnapshotStatistics(),source=items.find(s=>s.id===button.dataset.id);if(source){items.push({...source,id:uniqueId('stat'),order:items.length+1,status:'draft'});snapshotStatistics=await(await getSnapshotService()).saveBusinessSnapshotStatistics(items);renderSnapshot();notify('Statistic duplicated.');}}
  else if(action==='delete-stat')confirmAction('Delete this statistic?','This removes it from the draft while preserving the currently published snapshot.',async()=>{snapshotStatistics=await(await getSnapshotService()).saveBusinessSnapshotStatistics(currentSnapshotStatistics().filter(item=>item.id!==button.dataset.id));renderSnapshot();notify('Statistic draft deleted.');});
  else if(action==='move-stat'){const items=currentSnapshotStatistics(),index=items.findIndex(i=>i.id===button.dataset.id),target=button.dataset.direction==='up'?index-1:index+1;if(target>=0&&target<items.length){[items[index],items[target]]=[items[target],items[index]];snapshotStatistics=await(await getSnapshotService()).saveBusinessSnapshotStatistics(items);renderSnapshot();notify('Statistic order updated.');}}
  else if(action==='back-to-snapshot'){setDirty(false);location.hash='snapshot';render();}
  else if(action==='filter-media'){mediaFilter=button.dataset.filter;renderMedia();}
  else if(action==='media-view'){mediaView=button.dataset.view;renderMedia();}
  else if(action==='edit-media'){renderMediaEditor(state.mediaAssets.find(a=>a.id===button.dataset.id));}
  else if(action==='back-to-media'){setDirty(false);location.hash='media';render();}
  else if(action==='delete-media'){const asset=state.mediaAssets.find(a=>a.id===button.dataset.id);if(asset.usedBy.length)notify(`Cannot delete ${asset.filename}; used by ${asset.usedBy.join(', ')}.`,'error');else confirmAction('Delete this asset?','The unused mock asset will be removed.',()=>{deleteHomepageItem('mediaAssets',asset.id);render();notify('Asset deleted.');});}
  else if(action==='move-section'){const items=[...state.homepageSections].sort((a,b)=>a.order-b.order),index=items.findIndex(i=>i.id===button.dataset.id),target=button.dataset.direction==='up'?index-1:index+1;if(target>=0&&target<items.length){[items[index],items[target]]=[items[target],items[index]];reorderHomepageItems('homepageSections',items.map(i=>i.id));render();}}
  else if(action==='toggle-section'){updateHomepageData(draft=>{const item=draft.homepageSections.find(i=>i.id===button.dataset.id);item.visible=!item.visible;});render();notify('Section visibility updated.');}
  else if(action==='cycle-section-status'){updateHomepageData(draft=>{const item=draft.homepageSections.find(i=>i.id===button.dataset.id);item.status=item.status==='draft'?'published':item.status==='published'?'hidden':'draft';});render();notify('Section status updated.');}
  else if(action==='reset-data')confirmAction('Reset all local data?','Every dashboard edit in this browser will be replaced by the source mock content.',()=>{resetHomepageData();state=getHomepageData();render();notify('Mock data restored.');},'Reset');
});

confirmationModal.addEventListener('close',()=>{if(confirmationModal.returnValue==='confirm'&&pendingConfirmation)pendingConfirmation();pendingConfirmation=null;});

projectMediaSearch.addEventListener('input',renderProjectMediaPicker);
projectMediaPicker.querySelectorAll('[data-project-media-filter]').forEach((button)=>button.addEventListener('click',()=>{
  projectMediaFilter=button.dataset.projectMediaFilter;
  projectMediaPicker.querySelectorAll('[data-project-media-filter]').forEach((item)=>item.classList.toggle('is-active',item===button));
  renderProjectMediaPicker();
}));
projectMediaGrid.addEventListener('click',(event)=>{
  const option=event.target.closest('[data-project-media-id]');if(!option)return;
  selectedProjectMediaAssetId=option.dataset.projectMediaId;
  renderProjectMediaPicker();
  projectMediaPicker.querySelector('[data-action="use-project-media"]').focus();
});
projectMediaPicker.addEventListener('close',()=>{projectMediaTargetForm=null;selectedProjectMediaAssetId='';});
expertiseMediaSearch.addEventListener('input',renderExpertiseMediaPicker);
expertiseMediaPicker.querySelectorAll('[data-expertise-media-filter]').forEach((button)=>button.addEventListener('click',()=>{
  expertiseMediaFilter=button.dataset.expertiseMediaFilter;
  expertiseMediaPicker.querySelectorAll('[data-expertise-media-filter]').forEach((item)=>item.classList.toggle('is-active',item===button));
  renderExpertiseMediaPicker();
}));
expertiseMediaGrid.addEventListener('click',(event)=>{const option=event.target.closest('[data-expertise-media-id]');if(!option)return;selectedExpertiseMediaAssetId=option.dataset.expertiseMediaId;renderExpertiseMediaPicker();expertiseMediaPicker.querySelector('[data-action="use-expertise-media"]').focus();});
expertiseMediaPicker.addEventListener('close',()=>{expertiseMediaTargetForm=null;selectedExpertiseMediaAssetId='';});
logoMediaSearch.addEventListener('input',renderLogoMediaPicker);
logoMediaPicker.querySelectorAll('[data-logo-media-filter]').forEach((button)=>button.addEventListener('click',()=>{
  logoMediaFilter=button.dataset.logoMediaFilter;
  logoMediaPicker.querySelectorAll('[data-logo-media-filter]').forEach((item)=>item.classList.toggle('is-active',item===button));
  renderLogoMediaPicker();
}));
logoMediaGrid.addEventListener('click',(event)=>{const option=event.target.closest('[data-logo-media-id]');if(!option)return;selectedLogoMediaAssetId=option.dataset.logoMediaId;renderLogoMediaPicker();logoMediaPicker.querySelector('[data-action="use-logo-media"]').focus();});
logoMediaPicker.addEventListener('close',()=>{logoMediaTargetForm=null;selectedLogoMediaAssetId='';});
newsMediaSearch.addEventListener('input',renderNewsMediaPicker);
newsMediaPicker.querySelectorAll('[data-news-media-filter]').forEach((button)=>button.addEventListener('click',()=>{
  newsMediaFilter=button.dataset.newsMediaFilter;
  newsMediaPicker.querySelectorAll('[data-news-media-filter]').forEach((item)=>item.classList.toggle('is-active',item===button));
  renderNewsMediaPicker();
}));
newsMediaGrid.addEventListener('click',(event)=>{const option=event.target.closest('[data-news-media-id]');if(!option)return;selectedNewsMediaAssetId=option.dataset.newsMediaId;renderNewsMediaPicker();newsMediaPicker.querySelector('[data-action="use-news-media"]').focus();});
newsMediaPicker.addEventListener('close',()=>{newsMediaTargetForm=null;selectedNewsMediaAssetId='';});
snapshotMediaSearch.addEventListener('input',renderSnapshotMediaPicker);
snapshotMediaGrid.addEventListener('click',(event)=>{const option=event.target.closest('[data-snapshot-media-id]');if(!option)return;selectedSnapshotMediaAssetId=option.dataset.snapshotMediaId;renderSnapshotMediaPicker();snapshotMediaPicker.querySelector('[data-action="use-snapshot-media"]').focus();});
snapshotMediaPicker.addEventListener('close',()=>{snapshotMediaTargetForm=null;selectedSnapshotMediaAssetId='';});

document.querySelector('#sidebarCollapse').addEventListener('click',()=>{const collapsed=shell.classList.toggle('is-collapsed');document.querySelector('#sidebarCollapse').textContent=collapsed?'→':'←';document.querySelector('#sidebarCollapse').setAttribute('aria-expanded',String(!collapsed));});
document.querySelector('#mobileMenu').addEventListener('click',()=>{shell.classList.add('is-drawer-open');document.querySelector('#drawerBackdrop').hidden=false;document.querySelector('#mobileMenu').setAttribute('aria-expanded','true');});
document.querySelector('#drawerBackdrop').addEventListener('click',()=>{shell.classList.remove('is-drawer-open');document.querySelector('#drawerBackdrop').hidden=true;document.querySelector('#mobileMenu').setAttribute('aria-expanded','false');});
sidebarNav.addEventListener('click',(event)=>{if(event.target.closest('a')){shell.classList.remove('is-drawer-open');document.querySelector('#drawerBackdrop').hidden=true;}});

document.querySelector('#closePreview').addEventListener('click',()=>previewModal.close());
document.querySelectorAll('[data-preview-size]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-preview-size]').forEach(item=>item.classList.toggle('is-active',item===button));renderHomepagePreview(button.dataset.previewSize);}));
document.querySelectorAll('[data-preview-mode]').forEach(button=>button.addEventListener('click',()=>{previewMode=button.dataset.previewMode;document.querySelectorAll('[data-preview-mode]').forEach(item=>item.classList.toggle('is-active',item===button));renderHomepagePreview(homepagePreview.dataset.size||'desktop');document.querySelector('#previewTitle').textContent=previewMode==='published'?'Homepage published preview':'Homepage draft';}));
document.querySelector('#openPreviewWindow').addEventListener('click',()=>{const previewWindow=window.open('','hilltop-homepage-preview');if(!previewWindow){notify('Allow pop-ups to open the preview window.','error');return;}const cssUrl=new URL('admin.css',location.href).href;previewWindow.document.write(`<!doctype html><title>Hilltop</title><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="${cssUrl}"><body style="margin:0;background:#fff"><div class="homepage-preview" style="width:100%;box-shadow:none">${homepagePreview.innerHTML}</div></body>`);previewWindow.document.close();});

document.addEventListener('click',(event)=>{const deviceButton=event.target.closest('.device-toggle button:not([data-action])');if(!deviceButton)return;const group=deviceButton.closest('.device-toggle');group.querySelectorAll('button:not([data-action])').forEach(button=>button.classList.toggle('is-active',button===deviceButton));const preview=deviceButton.closest('.preview-card')?.querySelector('.media-preview, [data-snapshot-preview]');if(preview){const mobile=deviceButton.textContent.trim()==='Mobile';preview.style.maxWidth=mobile?'390px':'';preview.dataset.device=mobile?'mobile':'desktop';const form=deviceButton.closest('form');if(form?.dataset.form==='hero')renderHeroPreview(form);if(form?.dataset.form==='snapshot')renderSnapshotPreview(form);}});

window.addEventListener('hashchange',()=>{const activeUpload=isHeroVideoUploadActive()||isSnapshotVideoUploadActive();if((dirty||activeUpload)&&!window.confirm(activeUpload?'A media upload is active. Leave this editor while it continues in the background?':'You have unsaved changes. Leave this editor?')){history.back();return;}setDirty(false);render();});
window.addEventListener('beforeunload',(event)=>{if(dirty||isHeroVideoUploadActive()||isSnapshotVideoUploadActive()){event.preventDefault();event.returnValue='';}});

function showLogin(message = '', status = '') {
  shell.hidden = true;
  authGate.hidden = false;
  authLoading.hidden = true;
  authConfiguration.hidden = true;
  authFailure.hidden = true;
  passwordRecoveryForm.hidden = true;
  passwordUpdateForm.hidden = true;
  loginForm.hidden = false;
  if (status) loginStatusMessage = status;
  document.querySelector('#loginError').textContent = message;
  document.querySelector('#loginStatus').textContent = status || loginStatusMessage;
  loginForm.querySelector('button[type="submit"]').disabled = false;
}

function showPasswordRecoveryScreen(message = '') {
  shell.hidden = true;
  authGate.hidden = false;
  authLoading.hidden = true;
  authConfiguration.hidden = true;
  authFailure.hidden = true;
  loginForm.hidden = true;
  passwordUpdateForm.hidden = true;
  passwordRecoveryForm.hidden = false;
  const loginEmail = document.querySelector('#loginEmail').value.trim();
  const recoveryEmail = document.querySelector('#recoveryEmail');
  if (!recoveryEmail.value && loginEmail) recoveryEmail.value = loginEmail;
  document.querySelector('#recoveryError').textContent = message;
  document.querySelector('#recoveryStatus').textContent = '';
  passwordRecoveryForm.querySelector('button[type="submit"]').disabled = false;
}

function showPasswordUpdateScreen(email = '') {
  shell.hidden = true;
  authGate.hidden = false;
  authLoading.hidden = true;
  authConfiguration.hidden = true;
  authFailure.hidden = true;
  loginForm.hidden = true;
  passwordRecoveryForm.hidden = true;
  passwordUpdateForm.hidden = false;
  document.querySelector('#passwordUpdateError').textContent = '';
  document.querySelector('#passwordUpdateAccount').textContent = email
    ? `Enter a new password for ${email}.`
    : 'Enter a new password for your Hilltop Construction account.';
  passwordUpdateForm.querySelector('button[type="submit"]').disabled = false;
}

function passwordResetRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('mode', 'reset-password');
  url.hash = '';
  return url.toString();
}

function clearPasswordRecoveryUrl() {
  const url = new URL(window.location.href);
  ['mode', 'code', 'error', 'error_code', 'error_description'].forEach((key) => url.searchParams.delete(key));
  url.hash = '';
  window.history.replaceState({}, '', `${url.pathname}${url.search}`);
}

function passwordPolicyMessage(password) {
  if (password.length < 12) return 'Use at least 12 characters.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Add at least one number.';
  return '';
}

function showConfiguration(message = '') {
  shell.hidden = true;
  authGate.hidden = false;
  authLoading.hidden = true;
  loginForm.hidden = true;
  passwordRecoveryForm.hidden = true;
  passwordUpdateForm.hidden = true;
  authFailure.hidden = true;
  authConfiguration.hidden = false;
  document.querySelector('#authConfigurationError').textContent = message;
}

function showSessionCheckingScreen() {
  shell.hidden = true;
  authGate.hidden = false;
  loginForm.hidden = true;
  passwordRecoveryForm.hidden = true;
  passwordUpdateForm.hidden = true;
  authConfiguration.hidden = true;
  authFailure.hidden = true;
  authLoading.hidden = false;
}

function showSessionErrorScreen(message) {
  shell.hidden = true;
  authGate.hidden = false;
  authLoading.hidden = true;
  loginForm.hidden = true;
  passwordRecoveryForm.hidden = true;
  passwordUpdateForm.hidden = true;
  authConfiguration.hidden = true;
  authFailure.hidden = false;
  document.querySelector('#authFailureMessage').textContent = message;
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(message)), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timer));
}

async function loadDiscoveryFromSupabase() {
  try {
    discoveryRecord = await withTimeout(getDiscoveryBridge(), 8000, 'Discovery Bridge loading timed out.');
    discoveryLoadError = '';
  } catch (error) {
    discoveryRecord = null;
    discoveryLoadError = error.message;
  }
}

async function loadHeroFromSupabase() {
  try {
    [heroDraft,publishedHero]=await withTimeout(Promise.all([getHeroDraft(),getPublishedHero()]), 8000, 'Hero loading timed out.');
    heroLoadError='';
  } catch(error) { heroDraft=null; publishedHero=null; heroLoadError=error.message; }
}

async function loadFeaturedProjectsFromSupabase(){
  try{featuredProjectDrafts=await withTimeout((await getProjectsService()).getFeaturedProjectDrafts(),8000,'Featured Projects loading timed out.');featuredProjectsLoadError='';}
  catch(error){featuredProjectDrafts=null;featuredProjectsLoadError=error.message;}
}

async function loadExpertiseFromSupabase(){
  expertiseLoading=true;
  try {
    const service=await getExpertiseService();
    [expertiseSectionDraft,publishedExpertiseSection,expertiseSlideDrafts,publishedExpertiseSlides]=await withTimeout(Promise.all([
      service.getExpertiseSectionDraft(),service.getPublishedExpertiseSection(),service.getExpertiseSlideDrafts(),service.getPublishedExpertiseSlides()
    ]),8000,'Expertise loading timed out.');
    expertiseLoadError='';
  } catch(error){expertiseSectionDraft=null;publishedExpertiseSection=null;expertiseSlideDrafts=null;publishedExpertiseSlides=null;expertiseLoadError=error.message;}
  finally{expertiseLoading=false;}
}

async function loadLogoBridgeFromSupabase(){
  logoBridgeLoading=true;
  try {
    const service=await getLogoBridgeService();
    [logoBridgeDraftSettings,publishedLogoBridgeSettings,logoBridgeDraftItems,publishedLogoBridgeItems]=await withTimeout(Promise.all([
      service.getLogoBridgeDraftSettings(),service.getPublishedLogoBridgeSettings(),service.getLogoBridgeDraftItems(),service.getPublishedLogoBridgeItems()
    ]),8000,'Logo Bridge loading timed out.');
    logoBridgeLoadError='';
  } catch(error){logoBridgeDraftSettings=null;publishedLogoBridgeSettings=null;logoBridgeDraftItems=null;publishedLogoBridgeItems=null;logoBridgeLoadError=error.message;}
  finally{logoBridgeLoading=false;}
}

async function loadNewsFromSupabase(){
  newsLoading=true;
  try {
    const service=await getNewsService();
    [newsArticleDrafts,publishedNewsArticles]=await withTimeout(Promise.all([
      service.getNewsArticleDrafts(),service.getPublishedNewsArticles()
    ]),8000,'News & Foresight loading timed out.');
    newsLoadError='';
  } catch(error){newsArticleDrafts=null;publishedNewsArticles=null;newsLoadError=error.message;}
  finally{newsLoading=false;}
}

async function loadBusinessSnapshotFromSupabase() {
  try {
    const service=await getSnapshotService();
    [snapshotDraft,publishedSnapshot,snapshotStatistics]=await withTimeout(Promise.all([
      service.getBusinessSnapshotDraft(),service.getPublishedBusinessSnapshot(),service.getBusinessSnapshotStatistics('draft')
    ]),8000,'Business Snapshot loading timed out.');
    snapshotLoadError='';
  } catch(error) { snapshotDraft=null;publishedSnapshot=null;snapshotStatistics=null;snapshotLoadError=error.message; }
}

function renderDashboardSafely() {
  authGate.hidden = true;
  shell.hidden = false;
  try {
    render();
  } catch (error) {
    console.error('Dashboard section rendering failed:', error);
    workspace.innerHTML = `${pageHeader('Dashboard section', 'This section could not be displayed', 'The authenticated dashboard is available, but this section encountered an error.')}<div class="database-state database-state--error" role="alert">${esc(error?.message || 'Unknown section rendering error.')}</div>`;
  }
}

function scheduleAdminBootstrap() {
  queueMicrotask(() => bootstrapAdmin());
}

async function bootstrapAdmin() {
  if (bootstrapInProgress) {
    bootstrapQueued = true;
    return;
  }
  bootstrapInProgress = true;
  showSessionCheckingScreen();
  try {
    console.info('Admin bootstrap: configuration initialization.');
    const config = await getSupabaseConfiguration();
    if (!config.configured) {
      showConfiguration('SUPABASE_URL and SUPABASE_ANON_KEY are currently missing.');
      return;
    }

    const supabase = await withTimeout(getSupabaseClient(), 8000, 'Supabase client initialization timed out.');
    if (!authListenerReady) {
      await subscribeToAdminAuth((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          passwordRecoveryActive = true;
          scheduleAdminBootstrap();
          return;
        }
        if (!passwordRecoveryActive && ['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED'].includes(event)) scheduleAdminBootstrap();
      });
      authListenerReady = true;
    }

    console.info('Admin bootstrap: session lookup.');
    const { data:sessionData, error:sessionError } = await withTimeout(supabase.auth.getSession(), 8000, 'Session verification timed out.');
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    if (!session?.user) {
      if (passwordRecoveryActive) {
        showPasswordRecoveryScreen('This recovery link is invalid or has expired. Request a new reset link.');
      } else {
        showLogin();
      }
      return;
    }

    console.info('Admin bootstrap: authenticated user ID.', session.user.id);
    console.info('Admin bootstrap: admin profile request.');
    const profile = await withTimeout(getAdminProfileForUser(session.user.id), 8000, 'Administrator profile verification timed out.');
    console.info('Admin bootstrap: admin profile result.', profile ? { user_id:profile.user_id, role:profile.role, is_active:profile.is_active } : null);
    const authorized = profile && profile.user_id === session.user.id && profile.is_active === true && ['admin','editor'].includes(profile.role);
    if (!authorized) {
      await withTimeout(supabase.auth.signOut(), 8000, 'Sign out timed out.');
      passwordRecoveryActive = false;
      clearPasswordRecoveryUrl();
      showLogin('This account does not have an active administrator or editor profile.');
      return;
    }

    currentAdminProfile = profile;
    if (passwordRecoveryActive) {
      showPasswordUpdateScreen(session.user.email || profile.email || '');
      return;
    }
    console.info('Admin bootstrap: dashboard rendering.');
    renderDashboardSafely();
    await Promise.all([loadDiscoveryFromSupabase(), loadHeroFromSupabase(), loadFeaturedProjectsFromSupabase(), loadExpertiseFromSupabase(), loadLogoBridgeFromSupabase(), loadBusinessSnapshotFromSupabase(),loadNewsFromSupabase()]);
    renderDashboardSafely();
  } catch (error) {
    console.error('Admin bootstrap failed:', error);
    showSessionErrorScreen(error?.message || 'The dashboard could not verify your session.');
  } finally {
    authLoading.hidden = true;
    bootstrapInProgress = false;
    if (bootstrapQueued) {
      bootstrapQueued = false;
      scheduleAdminBootstrap();
    }
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = loginForm.querySelector('button[type="submit"]');
  const errorNode = document.querySelector('#loginError');
  const data = new FormData(loginForm);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');

  loginStatusMessage = '';
  document.querySelector('#loginStatus').textContent = '';

  if (!email || !password) {
    errorNode.textContent = 'Enter both an email address and password.';
    return;
  }

  submitButton.disabled = true;
  errorNode.textContent = '';
  try {
    await signInAdmin(email, password);
    loginForm.reset();
    scheduleAdminBootstrap();
  } catch (error) {
    errorNode.textContent = error.message;
    submitButton.disabled = false;
  }
});

document.querySelector('#showPasswordRecovery').addEventListener('click', () => {
  showPasswordRecoveryScreen();
  document.querySelector('#recoveryEmail').focus();
});

document.querySelector('#cancelPasswordRecovery').addEventListener('click', async () => {
  const hadRecoverySession = passwordRecoveryActive;
  passwordRecoveryActive = false;
  clearPasswordRecoveryUrl();
  if (hadRecoverySession) {
    try { await withTimeout(signOutAdmin(), 8000, 'Recovery session sign out timed out.'); }
    catch (error) { console.error('Recovery session sign out failed:', error); }
  }
  showLogin();
});

passwordRecoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = passwordRecoveryForm.querySelector('button[type="submit"]');
  const errorNode = document.querySelector('#recoveryError');
  const statusNode = document.querySelector('#recoveryStatus');
  const emailInput = document.querySelector('#recoveryEmail');
  const email = emailInput.value.trim();

  if (!email || !emailInput.validity.valid) {
    errorNode.textContent = 'Enter a valid email address.';
    statusNode.textContent = '';
    return;
  }

  submitButton.disabled = true;
  errorNode.textContent = '';
  statusNode.textContent = '';
  try {
    await withTimeout(
      requestAdminPasswordReset(email, passwordResetRedirectUrl()),
      12000,
      'The password reset request timed out.'
    );
    statusNode.textContent = 'If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder.';
  } catch (error) {
    errorNode.textContent = error?.message || 'The password reset email could not be sent.';
  } finally {
    submitButton.disabled = false;
  }
});

passwordUpdateForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = passwordUpdateForm.querySelector('button[type="submit"]');
  const errorNode = document.querySelector('#passwordUpdateError');
  const data = new FormData(passwordUpdateForm);
  const password = String(data.get('password') || '');

  loginStatusMessage = '';
  document.querySelector('#loginStatus').textContent = '';
  const confirmation = String(data.get('passwordConfirmation') || '');
  const policyError = passwordPolicyMessage(password);

  if (policyError) {
    errorNode.textContent = policyError;
    return;
  }
  if (password !== confirmation) {
    errorNode.textContent = 'The two passwords do not match.';
    return;
  }

  submitButton.disabled = true;
  errorNode.textContent = '';
  try {
    await withTimeout(updateAdminPassword(password), 12000, 'The password update timed out.');
    passwordRecoveryActive = false;
    clearPasswordRecoveryUrl();
    try { await withTimeout(signOutAdmin(), 8000, 'Sign out timed out.'); }
    catch (signOutError) { console.error('Post-recovery sign out failed:', signOutError); }
    passwordUpdateForm.reset();
    loginStatusMessage = 'Your password has been updated. Sign in with the new password.';
    showLogin();
  } catch (error) {
    errorNode.textContent = error?.message || 'The password could not be updated.';
    submitButton.disabled = false;
  }
});

document.querySelector('#retryAuth').addEventListener('click', scheduleAdminBootstrap);
document.querySelector('#errorSignOut').addEventListener('click', async () => {
  try { await withTimeout(signOutAdmin(), 8000, 'Sign out timed out.'); }
  catch (error) { console.error('Error-screen sign out failed:', error); }
  showLogin();
});
document.querySelector('#returnToLogin').addEventListener('click', () => showLogin());

bootstrapAdmin();
