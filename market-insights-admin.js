/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - MARKET INSIGHTS ADMINISTRATION
   Property Management UI for public.market_price_statistics.
   ============================================================ */

(function initMarketInsightsAdmin(root) {
  'use strict';

  var MARKET_TABLE = 'market_price_statistics';
  var APPROVED_AREA_NAMES = Object.freeze([
    'Chalala',
    'Kabulonga',
    'Makeni',
    'Maramba',
    'New Kasama',
    'Olympia',
    'Roma',
    'Silverest',
    'Woodlands'
  ]);
  var BEDROOM_LABELS = Object.freeze({
    1: '1 Bedroom',
    2: '2 Bedrooms',
    3: '3 Bedrooms',
    4: '4 Bedrooms',
    '5_plus': '5+ Bedrooms'
  });
  var DUPLICATE_MESSAGE = 'A market statistic already exists for this area, property type, bedroom category, currency and year. Edit the existing record instead.';

  var approvedAreas = [];
  var approvedAreaByKey = {};
  var marketRows = [];
  var hasLoaded = false;
  var isLoading = false;
  var editId = null;
  var pendingDeleteId = null;

  var elements = {
    addButton: document.getElementById('marketAddButton'),
    filterArea: document.getElementById('marketFilterArea'),
    filterPropertyType: document.getElementById('marketFilterPropertyType'),
    filterPurpose: document.getElementById('marketFilterPurpose'),
    filterCurrency: document.getElementById('marketFilterCurrency'),
    filterYear: document.getElementById('marketFilterYear'),
    filterReset: document.getElementById('marketFilterReset'),
    loadingState: document.getElementById('marketLoadingState'),
    errorState: document.getElementById('marketErrorState'),
    emptyState: document.getElementById('marketEmptyState'),
    tableWrap: document.getElementById('marketTableWrap'),
    tableBody: document.getElementById('marketStatisticsBody'),
    cards: document.getElementById('marketStatisticCards'),
    summary: document.getElementById('marketStatisticsSummary'),
    modal: document.getElementById('marketStatisticModal'),
    modalTitle: document.getElementById('marketStatisticModalTitle'),
    modalSubtitle: document.getElementById('marketStatisticModalSubtitle'),
    modalClose: document.getElementById('marketStatisticModalClose'),
    modalCancel: document.getElementById('marketStatisticModalCancel'),
    form: document.getElementById('marketStatisticForm'),
    area: document.getElementById('marketArea'),
    propertyType: document.getElementById('marketPropertyType'),
    purpose: document.getElementById('marketPurpose'),
    currency: document.getElementById('marketCurrency'),
    bedroom: document.getElementById('marketBedroom'),
    year: document.getElementById('marketYear'),
    averagePrice: document.getElementById('marketAveragePrice'),
    sampleSize: document.getElementById('marketSampleSize'),
    published: document.getElementById('marketPublished'),
    formError: document.getElementById('marketFormError'),
    saveButton: document.getElementById('marketStatisticSave'),
    deleteModal: document.getElementById('marketDeleteModal'),
    deleteClose: document.getElementById('marketDeleteClose'),
    deleteCancel: document.getElementById('marketDeleteCancel'),
    deleteConfirm: document.getElementById('marketDeleteConfirm'),
    deleteRecord: document.getElementById('marketDeleteRecord'),
    overlay: document.getElementById('modalOverlay')
  };

  function getSupabase() {
    return root.hilltopSupabase || null;
  }

  function scopeWorkspace(query) {
    return root.HilltopWorkspace.scope(query);
  }

  function withWorkspace(payload) {
    return root.HilltopWorkspace.withWorkspace(payload);
  }

  function getCurrentProfile() {
    return root.hilltopCurrentUser || null;
  }

  function canManage() {
    var profile = getCurrentProfile() || {};
    return profile.is_active !== false && String(profile.role || '').toLowerCase() === 'super_admin';
  }

  function notify(message, type) {
    if (typeof root.showToast === 'function') {
      root.showToast(message, type || 'success');
    }
  }

  function announceDataChange() {
    if (typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('hilltop:market-insights-updated'));
    }
  }

  function escapeHtml(value) {
    if (typeof root.escapeCmsHtml === 'function') return root.escapeCmsHtml(value);
    return String(value == null ? '' : value).replace(/[&<>"']/g, function(character) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character];
    });
  }

  function resolveApprovedAreas() {
    var registry = root.HilltopMarketInsights;
    if (!registry || typeof registry.resolveMarketArea !== 'function') return [];

    return APPROVED_AREA_NAMES.map(function(areaName) {
      return registry.resolveMarketArea(areaName);
    }).filter(function(area) {
      return area && area.areaKey && area.areaKey !== 'qa-market-test';
    });
  }

  function populateAreaOptions() {
    approvedAreas = resolveApprovedAreas();
    approvedAreaByKey = {};

    approvedAreas.forEach(function(area) {
      approvedAreaByKey[area.areaKey] = area;
    });

    var options = approvedAreas.map(function(area) {
      return '<option value="' + escapeHtml(area.areaKey) + '">' + escapeHtml(area.areaName) + '</option>';
    }).join('');

    elements.filterArea.insertAdjacentHTML('beforeend', options);
    elements.area.innerHTML = options;
  }

  function syncPermissions() {
    if (elements.addButton) elements.addButton.hidden = !canManage();
  }

  function waitForProfile() {
    return new Promise(function(resolve) {
      var attempts = 0;

      function check() {
        if (getCurrentProfile() || attempts >= 40) {
          resolve(getCurrentProfile());
          return;
        }
        attempts += 1;
        root.setTimeout(check, 100);
      }

      check();
    });
  }

  function setListState(state) {
    elements.loadingState.hidden = state !== 'loading';
    elements.errorState.hidden = state !== 'error';
    elements.emptyState.hidden = state !== 'empty';
    elements.tableWrap.hidden = state !== 'ready';
    elements.cards.hidden = state !== 'ready';
  }

  function getFilters() {
    var year = elements.filterYear.value === '' ? null : Number(elements.filterYear.value);
    return {
      areaKey: elements.filterArea.value,
      propertyType: elements.filterPropertyType.value,
      purpose: elements.filterPurpose.value,
      currencyCode: elements.filterCurrency.value,
      year: Number.isInteger(year) ? year : null
    };
  }

  function applyFilters(query) {
    var filters = getFilters();
    var approvedKeys = approvedAreas.map(function(area) { return area.areaKey; });

    query = query
      .in('area_key', approvedKeys)
      .neq('area_key', 'qa-market-test');

    if (filters.areaKey) query = query.eq('area_key', filters.areaKey);
    if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
    if (filters.purpose) query = query.eq('purpose', filters.purpose);
    if (filters.currencyCode) query = query.eq('currency_code', filters.currencyCode);
    if (filters.year !== null) query = query.eq('year', filters.year);
    return query;
  }

  function formatPrice(value, currencyCode) {
    if (root.HilltopCurrency && typeof root.HilltopCurrency.formatPropertyPrice === 'function') {
      return root.HilltopCurrency.formatPropertyPrice(Number(value), currencyCode, 'For Sale');
    }

    var prefix = currencyCode === 'USD' ? '$' : 'K';
    return prefix + Number(value).toLocaleString('en-ZM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function bedroomLabel(bucket) {
    return BEDROOM_LABELS[bucket] || String(bucket || '');
  }

  function statusBadge(row) {
    var status = row.is_published ? 'Published' : 'Draft';
    return '<span class="badge ' + (row.is_published ? 'badge-active' : 'badge-draft') + '">' + status + '</span>';
  }

  function actionButtons(row) {
    if (!canManage()) return '<span class="market-read-only">Read only</span>';

    return [
      '<div class="table-actions">',
      '<button class="action-btn outline small" type="button" data-market-edit="' + escapeHtml(row.id) + '">Edit</button>',
      '<button class="action-btn outline small" type="button" data-market-toggle="' + escapeHtml(row.id) + '">', row.is_published ? 'Unpublish' : 'Publish', '</button>',
      '<button class="action-btn danger small" type="button" data-market-delete="' + escapeHtml(row.id) + '">Delete</button>',
      '</div>'
    ].join('');
  }

  function renderTable() {
    elements.tableBody.innerHTML = marketRows.map(function(row) {
      return [
        '<tr>',
        '<td><strong>', escapeHtml(row.area_name), '</strong></td>',
        '<td>', escapeHtml(row.property_type), '</td>',
        '<td>', escapeHtml(bedroomLabel(row.bedroom_bucket)), '</td>',
        '<td>', escapeHtml(row.year), '</td>',
        '<td class="market-price-cell">', escapeHtml(formatPrice(row.average_price, row.currency_code)), '</td>',
        '<td class="market-sample-cell">', escapeHtml(row.sample_size), '</td>',
        '<td>', escapeHtml(row.currency_code), '</td>',
        '<td>', statusBadge(row), '</td>',
        '<td>', actionButtons(row), '</td>',
        '</tr>'
      ].join('');
    }).join('');

    elements.cards.innerHTML = marketRows.map(function(row) {
      return [
        '<article class="market-statistic-card">',
        '<div class="market-statistic-card__heading"><div>',
        '<h4>', escapeHtml(row.area_name), '</h4>',
        '<p>', escapeHtml(row.property_type), ' · ', escapeHtml(bedroomLabel(row.bedroom_bucket)), '</p>',
        '</div>', statusBadge(row), '</div>',
        '<p class="market-statistic-card__price">', escapeHtml(formatPrice(row.average_price, row.currency_code)), '</p>',
        '<div class="market-statistic-card__meta">',
        '<span>Year<strong>', escapeHtml(row.year), '</strong></span>',
        '<span>Currency<strong>', escapeHtml(row.currency_code), '</strong></span>',
        '<span>Sample Size<strong>', escapeHtml(row.sample_size), '</strong></span>',
        '</div>',
        '<div class="market-statistic-card__footer"><span>', escapeHtml(row.purpose), '</span>', actionButtons(row), '</div>',
        '</article>'
      ].join('');
    }).join('');
  }

  async function loadStatistics() {
    if (isLoading) return;
    var supabase = getSupabase();

    if (!supabase || !approvedAreas.length) {
      setListState('error');
      elements.errorState.textContent = !approvedAreas.length
        ? 'The approved Market Insights area registry is unavailable.'
        : 'Market statistics could not be loaded. Please check the connection and try again.';
      return;
    }

    isLoading = true;
    setListState('loading');

    try {
      await root.HilltopWorkspace.ready();
      var loadingWorkspaceId = root.HilltopWorkspace.getActive().id;
      var query = scopeWorkspace(supabase
        .from(MARKET_TABLE)
        .select('id, area_name, area_key, property_type, purpose, currency_code, bedroom_bucket, year, average_price, sample_size, is_published, created_at, updated_at'));

      var response = await applyFilters(query)
        .order('year', { ascending: false })
        .order('area_name', { ascending: true })
        .order('bedroom_bucket', { ascending: true });

      if (response.error) throw response.error;
      if (!root.HilltopWorkspace.getActive() || root.HilltopWorkspace.getActive().id !== loadingWorkspaceId) return;

      marketRows = response.data || [];
      elements.summary.textContent = marketRows.length + (marketRows.length === 1 ? ' statistic' : ' statistics') + ' across approved production markets';
      renderTable();
      setListState(marketRows.length ? 'ready' : 'empty');
      hasLoaded = true;
    } catch (error) {
      console.warn('Market Insights admin data could not be loaded.', error);
      marketRows = [];
      elements.errorState.textContent = 'Market statistics could not be loaded. Please try again.';
      setListState('error');
    } finally {
      isLoading = false;
    }
  }

  function showFormError(message) {
    elements.formError.textContent = message || '';
    elements.formError.hidden = !message;
  }

  function setModalOpen(modal, open) {
    if (!modal) return;

    if (open) {
      modal.style.display = 'flex';
      root.requestAnimationFrame(function() {
        modal.classList.add('open');
      });
      elements.overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      return;
    }

    modal.classList.remove('open');
    root.setTimeout(function() {
      if (!modal.classList.contains('open')) modal.style.display = 'none';
    }, 320);
    if (!elements.modal.classList.contains('open') && !elements.deleteModal.classList.contains('open')) {
      elements.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function resetForm() {
    elements.form.reset();
    elements.area.value = approvedAreas.length ? approvedAreas[0].areaKey : '';
    elements.propertyType.value = 'House';
    elements.purpose.value = 'For Sale';
    elements.currency.value = 'ZMW';
    elements.bedroom.value = '1';
    elements.year.value = String(new Date().getFullYear());
    elements.published.checked = false;
    showFormError('');
  }

  function findRow(id) {
    return marketRows.find(function(row) { return String(row.id) === String(id); }) || null;
  }

  function openForm(row) {
    if (!canManage()) {
      notify('Only active Super Admin users can manage Market Insights.', 'error');
      return;
    }

    resetForm();
    editId = row ? String(row.id) : null;
    elements.modalTitle.textContent = row ? 'Edit Market Statistic' : 'Add Market Statistic';
    elements.modalSubtitle.textContent = row
      ? 'Update the approved market price observation below.'
      : 'Add an approved market price observation.';
    elements.saveButton.textContent = row ? 'Save Changes' : 'Save Statistic';

    if (row) {
      elements.area.value = row.area_key;
      elements.propertyType.value = row.property_type;
      elements.purpose.value = row.purpose;
      elements.currency.value = row.currency_code;
      elements.bedroom.value = row.bedroom_bucket;
      elements.year.value = String(row.year);
      elements.averagePrice.value = String(row.average_price);
      elements.sampleSize.value = String(row.sample_size);
      elements.published.checked = Boolean(row.is_published);
    }

    setModalOpen(elements.modal, true);
    root.setTimeout(function() { elements.area.focus(); }, 50);
  }

  function closeForm() {
    editId = null;
    showFormError('');
    setModalOpen(elements.modal, false);
  }

  function buildPayload() {
    var area = approvedAreaByKey[elements.area.value] || null;
    var year = Number(elements.year.value);
    var averagePrice = Number(elements.averagePrice.value);
    var sampleSize = Number(elements.sampleSize.value);

    if (!area) return { error: 'Choose an approved market area.' };
    if (['House', 'Apartment'].indexOf(elements.propertyType.value) === -1) return { error: 'Choose House or Apartment.' };
    if (elements.purpose.value !== 'For Sale') return { error: 'Only For Sale statistics are supported in this version.' };
    if (['ZMW', 'USD'].indexOf(elements.currency.value) === -1) return { error: 'Choose ZMW or USD.' };
    if (!BEDROOM_LABELS[elements.bedroom.value]) return { error: 'Choose a valid bedroom type.' };
    if (!Number.isInteger(year) || year < 1900 || year > 9999) return { error: 'Enter a valid year between 1900 and 9999.' };
    if (!Number.isFinite(averagePrice) || averagePrice <= 0) return { error: 'Average Price must be greater than zero.' };
    if (!Number.isInteger(sampleSize) || sampleSize < 1) return { error: 'Sample Size must be a whole number of at least 1.' };

    return {
      payload: withWorkspace({
        area_name: area.areaName,
        area_key: area.areaKey,
        property_type: elements.propertyType.value,
        purpose: 'For Sale',
        currency_code: elements.currency.value,
        bedroom_bucket: elements.bedroom.value,
        year: year,
        average_price: averagePrice,
        sample_size: sampleSize,
        is_published: Boolean(elements.published.checked)
      })
    };
  }

  function isDuplicateError(error) {
    if (!error) return false;
    var message = String(error.message || error.details || '').toLowerCase();
    return error.code === '23505' || message.indexOf('market_price_statistics_market_year_key') !== -1;
  }

  async function duplicateExists(payload) {
    var query = scopeWorkspace(getSupabase()
      .from(MARKET_TABLE)
      .select('id'))
      .eq('area_key', payload.area_key)
      .eq('property_type', payload.property_type)
      .eq('purpose', payload.purpose)
      .eq('currency_code', payload.currency_code)
      .eq('bedroom_bucket', payload.bedroom_bucket)
      .eq('year', payload.year)
      .limit(1);

    if (editId) query = query.neq('id', editId);
    var response = await query;
    if (response.error) throw response.error;
    return Boolean(response.data && response.data.length);
  }

  function setSaveBusy(busy) {
    elements.saveButton.disabled = busy;
    elements.saveButton.textContent = busy ? 'Saving…' : (editId ? 'Save Changes' : 'Save Statistic');
  }

  async function saveStatistic(event) {
    event.preventDefault();
    if (!canManage()) {
      showFormError('Only active Super Admin users can manage Market Insights.');
      return;
    }

    var result = buildPayload();
    if (result.error) {
      showFormError(result.error);
      return;
    }

    showFormError('');
    setSaveBusy(true);

    try {
      if (await duplicateExists(result.payload)) {
        showFormError(DUPLICATE_MESSAGE);
        return;
      }

      var response = editId
        ? await scopeWorkspace(getSupabase().from(MARKET_TABLE).update(result.payload)).eq('id', editId).select('id').single()
        : await getSupabase().from(MARKET_TABLE).insert(result.payload).select('id').single();

      if (response.error) throw response.error;

      var wasEdit = Boolean(editId);
      closeForm();
      await loadStatistics();
      announceDataChange();
      notify(wasEdit ? 'Market statistic updated.' : 'Market statistic added.', 'success');
    } catch (error) {
      console.warn('Market statistic could not be saved.', error);
      showFormError(isDuplicateError(error) ? DUPLICATE_MESSAGE : 'The market statistic could not be saved. Please try again.');
    } finally {
      setSaveBusy(false);
    }
  }

  async function togglePublished(row) {
    if (!row || !canManage()) {
      notify('Only active Super Admin users can manage Market Insights.', 'error');
      return;
    }

    try {
      var response = await scopeWorkspace(getSupabase()
        .from(MARKET_TABLE)
        .update({ is_published: !row.is_published }))
        .eq('id', row.id)
        .select('id')
        .single();

      if (response.error) throw response.error;
      await loadStatistics();
      announceDataChange();
      notify(row.is_published ? 'Market statistic unpublished.' : 'Market statistic published.', 'success');
    } catch (error) {
      console.warn('Market statistic publication status could not be updated.', error);
      notify('The publication status could not be updated. Please try again.', 'error');
    }
  }

  function openDelete(row) {
    if (!row || !canManage()) {
      notify('Only active Super Admin users can manage Market Insights.', 'error');
      return;
    }

    pendingDeleteId = String(row.id);
    elements.deleteRecord.textContent = [
      row.area_name,
      row.property_type,
      bedroomLabel(row.bedroom_bucket),
      row.currency_code,
      row.year
    ].join(' · ');
    setModalOpen(elements.deleteModal, true);
    root.setTimeout(function() { elements.deleteConfirm.focus(); }, 50);
  }

  function closeDelete() {
    pendingDeleteId = null;
    setModalOpen(elements.deleteModal, false);
  }

  async function confirmDelete() {
    if (!pendingDeleteId || !canManage()) return;
    var id = pendingDeleteId;
    elements.deleteConfirm.disabled = true;
    elements.deleteConfirm.textContent = 'Deleting…';

    try {
      var response = await scopeWorkspace(getSupabase()
        .from(MARKET_TABLE)
        .delete())
        .eq('id', id)
        .select('id')
        .single();

      if (response.error) throw response.error;
      closeDelete();
      await loadStatistics();
      announceDataChange();
      notify('Market statistic deleted.', 'success');
    } catch (error) {
      console.warn('Market statistic could not be deleted.', error);
      notify('The market statistic could not be deleted. Please try again.', 'error');
    } finally {
      elements.deleteConfirm.disabled = false;
      elements.deleteConfirm.textContent = 'Delete Statistic';
    }
  }

  function handleActions(event) {
    var editButton = event.target.closest('[data-market-edit]');
    var toggleButton = event.target.closest('[data-market-toggle]');
    var deleteButton = event.target.closest('[data-market-delete]');

    if (editButton) openForm(findRow(editButton.dataset.marketEdit));
    if (toggleButton) togglePublished(findRow(toggleButton.dataset.marketToggle));
    if (deleteButton) openDelete(findRow(deleteButton.dataset.marketDelete));
  }

  function resetFilters() {
    elements.filterArea.value = '';
    elements.filterPropertyType.value = '';
    elements.filterPurpose.value = 'For Sale';
    elements.filterCurrency.value = '';
    elements.filterYear.value = '';
    loadStatistics();
  }

  function applyContextFilters(context) {
    context = context || {};
    var areaKey = String(context.areaKey || '').trim();

    if (!areaKey && context.areaName && root.HilltopMarketInsights) {
      var resolvedArea = root.HilltopMarketInsights.resolveMarketArea(context.areaName);
      areaKey = resolvedArea ? resolvedArea.areaKey : '';
    }

    elements.filterArea.value = approvedAreaByKey[areaKey] ? areaKey : '';
    elements.filterPropertyType.value = ['House', 'Apartment'].indexOf(context.propertyType) !== -1 ? context.propertyType : '';
    elements.filterPurpose.value = context.purpose === 'For Sale' ? 'For Sale' : 'For Sale';
    elements.filterCurrency.value = ['ZMW', 'USD'].indexOf(context.currencyCode) !== -1 ? context.currencyCode : '';
    elements.filterYear.value = Number.isInteger(Number(context.year)) ? String(context.year) : '';
  }

  function applyFormContext(context) {
    context = context || {};
    if (approvedAreaByKey[context.areaKey]) elements.area.value = context.areaKey;
    if (['House', 'Apartment'].indexOf(context.propertyType) !== -1) elements.propertyType.value = context.propertyType;
    if (context.purpose === 'For Sale') elements.purpose.value = context.purpose;
    if (['ZMW', 'USD'].indexOf(context.currencyCode) !== -1) elements.currency.value = context.currencyCode;
    if (BEDROOM_LABELS[context.bedroomBucket]) elements.bedroom.value = context.bedroomBucket;
  }

  function bindEvents() {
    elements.addButton.addEventListener('click', function() { openForm(null); });
    elements.filterReset.addEventListener('click', resetFilters);
    [elements.filterArea, elements.filterPropertyType, elements.filterPurpose, elements.filterCurrency, elements.filterYear].forEach(function(control) {
      control.addEventListener('change', loadStatistics);
    });
    elements.tableBody.addEventListener('click', handleActions);
    elements.cards.addEventListener('click', handleActions);
    elements.form.addEventListener('submit', saveStatistic);
    elements.modalClose.addEventListener('click', closeForm);
    elements.modalCancel.addEventListener('click', closeForm);
    elements.deleteClose.addEventListener('click', closeDelete);
    elements.deleteCancel.addEventListener('click', closeDelete);
    elements.deleteConfirm.addEventListener('click', confirmDelete);
    elements.overlay.addEventListener('click', function() {
      if (elements.modal.classList.contains('open')) closeForm();
      if (elements.deleteModal.classList.contains('open')) closeDelete();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key !== 'Escape') return;
      if (elements.deleteModal.classList.contains('open')) closeDelete();
      else if (elements.modal.classList.contains('open')) closeForm();
    });
  }

  async function render(context) {
    await waitForProfile();
    syncPermissions();
    if (context) applyContextFilters(context);
    if (context || !hasLoaded) await loadStatistics();
    if (context && context.action === 'add' && canManage()) {
      openForm(null);
      applyFormContext(context);
    }
  }

  populateAreaOptions();
  bindEvents();
  syncPermissions();
  root.addEventListener('hilltop:workspace-changing', function() {
    marketRows = [];
    hasLoaded = false;
    renderTable();
    setListState('loading');
  });

  root.HilltopMarketInsightsAdmin = Object.freeze({
    render: render,
    reload: loadStatistics,
    validatePayload: buildPayload,
    isDuplicateError: isDuplicateError,
    approvedAreas: approvedAreas.slice()
  });
}(typeof window !== 'undefined' ? window : globalThis));
