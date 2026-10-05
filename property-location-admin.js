/* ============================================================
   HILLTOP PROPERTIES ZAMBIA
   PHASE 4: ADMIN NORMALIZED PROPERTY LOCATION SEARCH

   Responsibilities:
   - Search normalized Province / City / Suburb records
   - Maintain locationQuery separately from structured selection
   - Prevent raw text from becoming normalized IDs
   - Provide exact-ID hydration for Edit mode
   - Preserve legacy properties without guessing geography
   - Keep map/address/branch/agent logic completely separate
   ============================================================ */

(function () {
  'use strict';

  var MIN_SEARCH_LENGTH = 2;
  var SEARCH_DEBOUNCE_MS = 250;
  var SEARCH_RESULT_LIMIT = 8;

  var state = {
    locationQuery: '',
    selectedPropertyLocation: null,
    results: [],
    loading: false,
    message: '',
    activeIndex: -1,
    searchTimer: null,
    searchSequence: 0
  };

  var elements = {
    input: null,
    clearButton: null,
    results: null,
    summary: null,
    validation: null,
    legacyArea: null
  };

  var initialized = false;


  /* ============================================================
     BASIC HELPERS
     ============================================================ */

  function byId(id) {
    return document.getElementById(id);
  }

  function optionalValue(value) {
    if (
      value === null ||
      typeof value === 'undefined' ||
      value === ''
    ) {
      return null;
    }

    return value;
  }

  function getSupabaseClient() {
    return window.hilltopSupabase || null;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }


  /* ============================================================
     NORMALIZED LOCATION MODEL
     ============================================================ */

  function normalizeLocation(row) {
    if (!row) return null;

    var location = {
      id: optionalValue(row.id),

      type: String(row.type || '')
        .trim()
        .toLowerCase(),

      name: String(row.name || '').trim(),

      slug: String(row.slug || '').trim(),

      canonicalPath: optionalValue(
        row.canonical_path != null
          ? row.canonical_path
          : row.canonicalPath
      ),

      provinceId: optionalValue(
        row.province_id != null
          ? row.province_id
          : row.provinceId
      ),

      provinceName: optionalValue(
        row.province_name != null
          ? row.province_name
          : row.provinceName
      ),

      provinceSlug: optionalValue(
        row.province_slug != null
          ? row.province_slug
          : row.provinceSlug
      ),

      cityId: optionalValue(
        row.city_id != null
          ? row.city_id
          : row.cityId
      ),

      cityName: optionalValue(
        row.city_name != null
          ? row.city_name
          : row.cityName
      ),

      citySlug: optionalValue(
        row.city_slug != null
          ? row.city_slug
          : row.citySlug
      ),

      suburbId: optionalValue(
        row.suburb_id != null
          ? row.suburb_id
          : row.suburbId
      ),

      suburbName: optionalValue(
        row.suburb_name != null
          ? row.suburb_name
          : row.suburbName
      ),

      suburbSlug: optionalValue(
        row.suburb_slug != null
          ? row.suburb_slug
          : row.suburbSlug
      )
    };

    if (
      !location.id ||
      !location.name ||
      ['province', 'city', 'suburb'].indexOf(location.type) === -1
    ) {
      return null;
    }

    return location;
  }

  function normalizeResults(rows) {
    var seen = {};

    return (Array.isArray(rows) ? rows : [])
      .map(normalizeLocation)
      .filter(function (location) {
        if (!location) return false;

        var key = location.type + ':' + location.id;

        if (seen[key]) {
          return false;
        }

        seen[key] = true;
        return true;
      });
  }


  /* ============================================================
     DISPLAY HELPERS
     ============================================================ */

  function displayName(location) {
    if (!location) return '';

    if (
      location.type === 'province' &&
      !/\bprovince$/i.test(location.name)
    ) {
      return location.name + ' Province';
    }

    return location.name;
  }

  function contextLabel(location) {
    if (!location) return '';

    if (location.type === 'province') {
      return 'Province';
    }

    if (location.type === 'city') {
      var cityParts = ['City'];

      if (location.provinceName) {
        cityParts.push(location.provinceName + ' Province');
      }

      return cityParts.join(' · ');
    }

    var suburbParts = ['Suburb'];

    if (location.cityName) {
      suburbParts.push(location.cityName);
    }

    if (location.provinceName) {
      suburbParts.push(location.provinceName + ' Province');
    }

    return suburbParts.join(' · ');
  }


  /* ============================================================
     VALIDATION UI
     ============================================================ */

  function setValidation(message) {
    if (!elements.validation || !elements.input) {
      return;
    }

    var hasError = Boolean(message);

    elements.validation.textContent = message || '';
    elements.validation.hidden = !hasError;

    elements.input.classList.toggle('error', hasError);

    if (hasError) {
      elements.input.setAttribute('aria-invalid', 'true');
    } else {
      elements.input.removeAttribute('aria-invalid');
    }
  }

  function updateSummary() {
    if (!elements.summary) {
      return;
    }

    var selected = state.selectedPropertyLocation;

    if (!selected) {
      elements.summary.textContent =
        'Search and select a city or suburb from the normalized location list.';

      return;
    }

    elements.summary.textContent = contextLabel(selected);
  }


  /* ============================================================
     LEGACY AREA COMPATIBILITY
     ============================================================ */

  function syncLegacyArea() {
    if (!elements.legacyArea) {
      return;
    }

    var selected = state.selectedPropertyLocation;

    /*
     * Phase 4 compatibility rule:
     *
     * Suburb:
     * area = suburb name
     *
     * City:
     * area = ''
     *
     * Province:
     * cannot be saved
     */
    if (selected && selected.type === 'suburb') {
      elements.legacyArea.value =
        selected.suburbName ||
        selected.name ||
        '';
    } else {
      elements.legacyArea.value = '';
    }

    /*
     * Allow existing application listeners to notice the
     * compatibility field changed.
     */
    elements.legacyArea.dispatchEvent(
      new Event('input', {
        bubbles: true
      })
    );
  }


  /* ============================================================
     RESULT RENDERING
     ============================================================ */

  function render() {
    if (!elements.input || !elements.results) {
      return;
    }

    /*
     * Do not overwrite text while the user is typing unless
     * state.locationQuery itself changed intentionally.
     */
    if (elements.input.value !== state.locationQuery) {
      elements.input.value = state.locationQuery;
    }

    if (elements.clearButton) {
      elements.clearButton.hidden = !state.locationQuery;
    }

    updateSummary();

    var html = [];

    if (state.loading) {
      html.push(
        '<div class="property-location-message">' +
          'Searching locations...' +
        '</div>'
      );
    } else if (state.message) {
      html.push(
        '<div class="property-location-message">' +
          escapeHtml(state.message) +
        '</div>'
      );
    } else {
      state.results.forEach(function (location, index) {
        html.push(
          '<button' +
            ' type="button"' +
            ' class="property-location-option"' +
            ' id="property-location-option-' + index + '"' +
            ' role="option"' +
            ' tabindex="-1"' +
            ' aria-selected="' +
              String(index === state.activeIndex) +
            '"' +
            ' data-property-location-index="' + index + '"' +
          '>' +
            '<span class="property-location-option__label">' +
              escapeHtml(displayName(location)) +
            '</span>' +
            '<span class="property-location-option__context">' +
              escapeHtml(contextLabel(location)) +
            '</span>' +
          '</button>'
        );
      });
    }

    elements.results.innerHTML = html.join('');

    var shouldOpen = Boolean(
      state.loading ||
      state.message ||
      state.results.length
    );

    elements.results.hidden = !shouldOpen;

    elements.input.setAttribute(
      'aria-expanded',
      String(shouldOpen)
    );

    if (
      state.activeIndex >= 0 &&
      state.results[state.activeIndex]
    ) {
      elements.input.setAttribute(
        'aria-activedescendant',
        'property-location-option-' + state.activeIndex
      );
    } else {
      elements.input.removeAttribute(
        'aria-activedescendant'
      );
    }
  }


  /* ============================================================
     RESULT / MENU CONTROL
     ============================================================ */

  function closeResults() {
    state.results = [];
    state.loading = false;
    state.message = '';
    state.activeIndex = -1;

    render();
  }

  function cancelPendingSearch() {
    if (state.searchTimer) {
      clearTimeout(state.searchTimer);
      state.searchTimer = null;
    }

    /*
     * Incrementing the sequence invalidates every older
     * in-flight RPC response.
     */
    state.searchSequence += 1;
  }


  /* ============================================================
     SELECTION STATE
     ============================================================ */

  function chooseLocation(location) {
    location = normalizeLocation(location);

    if (!location) {
      return;
    }

    cancelPendingSearch();

    state.selectedPropertyLocation = location;
    state.locationQuery = displayName(location);

    state.results = [];
    state.loading = false;
    state.message = '';
    state.activeIndex = -1;

    syncLegacyArea();

    if (location.type === 'province') {
      setValidation(
        'Choose a city or suburb for the property location.'
      );
    } else {
      setValidation('');
    }

    render();
  }

  function clearSelection() {
    cancelPendingSearch();

    state.locationQuery = '';
    state.selectedPropertyLocation = null;
    state.results = [];
    state.loading = false;
    state.message = '';
    state.activeIndex = -1;

    syncLegacyArea();
    setValidation('');
    render();
  }

  function invalidateSelectionAfterManualEdit() {
    if (!state.selectedPropertyLocation) {
      return;
    }

    var selectedDisplayName =
      displayName(state.selectedPropertyLocation);

    if (state.locationQuery !== selectedDisplayName) {
      state.selectedPropertyLocation = null;

      /*
       * Important:
       * removing visible selected geography must also remove
       * the legacy compatibility area.
       */
      syncLegacyArea();
      updateSummary();
    }
  }


  /* ============================================================
     SEARCH
     ============================================================ */

  async function requestLocations(searchTerm, sequence) {
    var supabase = getSupabaseClient();

    if (!supabase || typeof supabase.rpc !== 'function') {
      if (sequence !== state.searchSequence) {
        return;
      }

      state.loading = false;
      state.results = [];
      state.activeIndex = -1;
      state.message =
        'Location suggestions are unavailable.';

      render();
      return;
    }

    state.loading = true;
    state.message = '';
    state.results = [];
    state.activeIndex = -1;

    render();

    try {
      var response = await supabase.rpc(
        'search_locations',
        {
          search_term: searchTerm,
          result_limit: SEARCH_RESULT_LIMIT
        }
      );

      /*
       * Stale-response protection.
       *
       * If another search has started since this one began,
       * this response is ignored completely.
       */
      if (sequence !== state.searchSequence) {
        return;
      }

      state.loading = false;

      if (response.error) {
        throw response.error;
      }

      state.results = normalizeResults(response.data);
      state.activeIndex = -1;

      state.message = state.results.length
        ? ''
        : 'No locations found.';

      render();
    } catch (error) {
      if (sequence !== state.searchSequence) {
        return;
      }

      console.warn(
        'Admin property location search failed.',
        error
      );

      state.loading = false;
      state.results = [];
      state.activeIndex = -1;

      /*
       * Do not expose the raw Supabase error to the administrator.
       */
      state.message =
        'Location suggestions are unavailable.';

      render();
    }
  }

  function scheduleSearch() {
    if (state.searchTimer) {
      clearTimeout(state.searchTimer);
      state.searchTimer = null;
    }

    state.searchSequence += 1;

    var sequence = state.searchSequence;
    var searchTerm = state.locationQuery.trim();

    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      state.results = [];
      state.loading = false;
      state.message = '';
      state.activeIndex = -1;

      render();
      return;
    }

    state.searchTimer = window.setTimeout(
      function () {
        state.searchTimer = null;

        requestLocations(
          searchTerm,
          sequence
        );
      },
      SEARCH_DEBOUNCE_MS
    );
  }


  /* ============================================================
     INPUT EVENTS
     ============================================================ */

  function handleInput() {
    state.locationQuery = elements.input.value;

    /*
     * A user typing after choosing a normalized result must
     * immediately invalidate that structured selection.
     */
    invalidateSelectionAfterManualEdit();

    setValidation('');
    scheduleSearch();
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      closeResults();
      return;
    }

    if (!state.results.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (state.activeIndex < state.results.length - 1) {
        state.activeIndex += 1;
      } else {
        state.activeIndex = 0;
      }

      render();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (state.activeIndex > 0) {
        state.activeIndex -= 1;
      } else {
        state.activeIndex =
          state.results.length - 1;
      }

      render();
      return;
    }

    if (
      event.key === 'Enter' &&
      state.activeIndex >= 0 &&
      state.results[state.activeIndex]
    ) {
      event.preventDefault();

      chooseLocation(
        state.results[state.activeIndex]
      );
    }
  }


  /* ============================================================
     SAVE VALIDATION
     ============================================================ */

  function validateForSave() {
    var query = state.locationQuery.trim();
    var selected = state.selectedPropertyLocation;

    if (query && !selected) {
      var unselectedMessage =
        'Select a location from the suggestions.';

      setValidation(unselectedMessage);

      return {
        valid: false,
        message: unselectedMessage
      };
    }

    if (!selected) {
      var missingMessage =
        'Select a location from the suggestions.';

      setValidation(missingMessage);

      return {
        valid: false,
        message: missingMessage
      };
    }

    if (selected.type === 'province') {
      var provinceMessage =
        'Choose a city or suburb for the property location.';

      setValidation(provinceMessage);

      return {
        valid: false,
        message: provinceMessage
      };
    }

    if (
      !selected.provinceId ||
      !selected.cityId
    ) {
      var invalidMessage =
        'Select a valid city or suburb from the suggestions.';

      setValidation(invalidMessage);

      return {
        valid: false,
        message: invalidMessage
      };
    }

    if (
      selected.type === 'suburb' &&
      !selected.suburbId
    ) {
      var suburbMessage =
        'Select a valid city or suburb from the suggestions.';

      setValidation(suburbMessage);

      return {
        valid: false,
        message: suburbMessage
      };
    }

    setValidation('');

    return {
      valid: true,
      message: ''
    };
  }


  /* ============================================================
     NORMALIZED SAVE PAYLOAD
     ============================================================ */

  function getSaveValues() {
    var validationResult = validateForSave();

    if (!validationResult.valid) {
      var error = new Error(
        validationResult.message
      );

      error.isPropertyGeographyValidationError = true;

      throw error;
    }

    var selected = state.selectedPropertyLocation;

    return {
      province_id: selected.provinceId,

      city_id: selected.cityId,

      suburb_id:
        selected.type === 'suburb'
          ? selected.suburbId
          : null,

      /*
       * Legacy compatibility only.
       *
       * Normalized IDs above are authoritative.
       */
      area:
        selected.type === 'suburb'
          ? (
              selected.suburbName ||
              selected.name ||
              ''
            )
          : ''
    };
  }


  /* ============================================================
     EXACT-ID EDIT HYDRATION
     ============================================================ */

  async function findExactNormalizedLocation(ids) {
    var supabase = getSupabaseClient();

    if (
      !supabase ||
      typeof supabase.from !== 'function'
    ) {
      return null;
    }

    ids = ids || {};

    /*
     * Phase 4 permits property-level City or Suburb locations.
     *
     * Province-only properties are deliberately not hydrated
     * as valid selections because they cannot be saved.
     */
    var type = '';
    var id = null;

    if (ids.suburbId) {
      type = 'suburb';
      id = ids.suburbId;
    } else if (ids.cityId) {
      type = 'city';
      id = ids.cityId;
    } else {
      return null;
    }

    try {
      var response = await supabase
        .from('location_search')
        .select(
          [
            'id',
            'type',
            'name',
            'slug',
            'canonical_path',
            'province_id',
            'province_name',
            'province_slug',
            'city_id',
            'city_name',
            'city_slug',
            'suburb_id',
            'suburb_name',
            'suburb_slug'
          ].join(',')
        )
        .eq('type', type)
        .eq('id', id)
        .maybeSingle();

      if (response.error) {
        throw response.error;
      }

      return normalizeLocation(response.data);
    } catch (error) {
      console.warn(
        'Admin property location hydration failed.',
        error
      );

      return null;
    }
  }

  async function hydrate(property) {
    init();

    cancelPendingSearch();

    property = property || {};

    /*
     * First remove any previous form selection.
     */
    state.locationQuery = '';
    state.selectedPropertyLocation = null;
    state.results = [];
    state.loading = false;
    state.message = '';
    state.activeIndex = -1;

    setValidation('');

    var ids = {
      provinceId:
        property.provinceId ||
        property.province_id ||
        null,

      cityId:
        property.cityId ||
        property.city_id ||
        null,

      suburbId:
        property.suburbId ||
        property.suburb_id ||
        null
    };

    var exactLocation =
      await findExactNormalizedLocation(ids);

    if (exactLocation) {
      chooseLocation(exactLocation);
      return exactLocation;
    }

    /*
     * Legacy property behavior:
     *
     * Preserve the existing legacy `area` value for compatibility,
     * but NEVER turn it into a normalized city/suburb automatically.
     */
    if (elements.legacyArea) {
      elements.legacyArea.value =
        String(property.area || '');
    }

    state.locationQuery = '';
    state.selectedPropertyLocation = null;

    updateSummary();
    render();

    return null;
  }


  /* ============================================================
     PUBLIC STATE ACCESS
     ============================================================ */

  function getState() {
    return {
      locationQuery:
        state.locationQuery,

      selectedPropertyLocation:
        state.selectedPropertyLocation,

      results:
        state.results.slice(),

      loading:
        state.loading,

      message:
        state.message
    };
  }


  /* ============================================================
     INITIALIZATION
     ============================================================ */

  function init() {
    if (initialized) {
      return true;
    }

    elements.input =
      byId('fPropertyLocation');

    /*
     * This allows the module to be loaded before the Phase 4 HTML
     * changes without breaking the rest of the admin application.
     */
    if (!elements.input) {
      return false;
    }

    elements.clearButton =
      byId('fPropertyLocationClear');

    elements.results =
      byId('fPropertyLocationResults');

    elements.summary =
      byId('fPropertyLocationSummary');

    elements.validation =
      byId('propertyLocationValidationMessage');

    elements.legacyArea =
      byId('fArea');

    if (
      !elements.results ||
      !elements.summary ||
      !elements.validation ||
      !elements.legacyArea
    ) {
      console.warn(
        'Phase 4 property location UI is incomplete.'
      );

      return false;
    }

    elements.input.addEventListener(
      'input',
      handleInput
    );

    elements.input.addEventListener(
      'keydown',
      handleKeyDown
    );

    elements.results.addEventListener(
      'click',
      function (event) {
        var option =
          event.target.closest(
            '[data-property-location-index]'
          );

        if (!option) {
          return;
        }

        var index = Number(
          option.dataset.propertyLocationIndex
        );

        if (
          Number.isNaN(index) ||
          !state.results[index]
        ) {
          return;
        }

        chooseLocation(
          state.results[index]
        );
      }
    );

    if (elements.clearButton) {
      elements.clearButton.addEventListener(
        'click',
        function () {
          clearSelection();
          elements.input.focus();
        }
      );
    }

    document.addEventListener(
      'click',
      function (event) {
        if (
          !event.target.closest(
            '.property-location-field'
          )
        ) {
          closeResults();
        }
      }
    );

    initialized = true;

    render();

    return true;
  }


  /* ============================================================
     MODULE API
     ============================================================ */

  window.HilltopAdminLocation = {
    init: init,

    clear: clearSelection,

    hydrate: hydrate,

    validateForSave:
      validateForSave,

    getSaveValues:
      getSaveValues,

    getState:
      getState,

    normalizeLocation:
      normalizeLocation,

    displayName:
      displayName,

    contextLabel:
      contextLabel,

    /*
     * Exposed intentionally for the Phase 4 regression suite.
     */
    chooseLocation:
      chooseLocation
  };


  /*
   * Safe initialization.
   *
   * properties.html loads scripts at the bottom of the page, but
   * this also supports DOMContentLoaded if the load order changes.
   */
  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }

})();