
(function () {
  'use strict';

  var demoLocations = [];
  var selectedDemoLocation = '';
  var loadPromise = null;


  function supabaseClient() {
    return window.hilltopSupabase || null;
  }


  function clean(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }


  function unique(values) {
    var seen = {};

    return (Array.isArray(values) ? values : [])
      .map(clean)
      .filter(function (value) {
        if (!value) return false;

        var key = value.toLowerCase();

        if (seen[key]) return false;

        seen[key] = true;

        return true;
      })
      .sort(function (a, b) {
        return a.localeCompare(b);
      });
  }


  async function loadDemoLocations() {
    var supabase = supabaseClient();

    if (!supabase) {
      demoLocations = [];
      return;
    }

    try {
      await window.HilltopWorkspace.ready();
      var loadingWorkspaceId = window.HilltopWorkspace.getActive().id;
      var response = await window.HilltopWorkspace.scope(supabase
        .from('app_settings')
        .select('setting_value'))
        .eq(
          'setting_key',
          'website_preferences'
        )
        .maybeSingle();

      if (response.error) {
        throw response.error;
      }
      if (!window.HilltopWorkspace.getActive() || window.HilltopWorkspace.getActive().id !== loadingWorkspaceId) return;

      var preferences =
        response.data &&
        response.data.setting_value
          ? response.data.setting_value
          : {};

      demoLocations =
        unique(
          preferences.demoLocations || []
        );

    } catch (error) {
      console.warn(
        '[Demo locations]',
        error
      );

      demoLocations = [];
    }
  }


  function getInput() {
    return document.getElementById(
      'fPropertyLocation'
    );
  }


  function getArea() {
    return document.getElementById(
      'fArea'
    );
  }


  function getSummary() {
    return document.getElementById(
      'fPropertyLocationSummary'
    );
  }


  function getValidation() {
    return document.getElementById(
      'propertyLocationValidationMessage'
    );
  }


  function setValidation(message) {
    var input = getInput();
    var validation = getValidation();

    if (!input || !validation) return;

    validation.textContent =
      message || '';

    validation.hidden =
      !message;

    input.classList.toggle(
      'error',
      Boolean(message)
    );

    if (message) {
      input.setAttribute(
        'aria-invalid',
        'true'
      );
    } else {
      input.removeAttribute(
        'aria-invalid'
      );
    }
  }


  function ensurePanel() {
    var existing =
      document.getElementById(
        'demoPropertyLocationResults'
      );

    if (existing) {
      return existing;
    }

    var input = getInput();

    if (!input || !input.parentElement) {
      return null;
    }

    var panel =
      document.createElement('div');

    panel.id =
      'demoPropertyLocationResults';

    panel.className =
      'demo-property-location-results';

    panel.hidden = true;

    input.parentElement.appendChild(
      panel
    );

    return panel;
  }


  function renderSuggestions(query) {
    var panel = ensurePanel();

    if (!panel) return;

    query =
      clean(query).toLowerCase();

    if (!query) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }

    var matches =
      demoLocations
        .filter(function (location) {
          return (
            location
              .toLowerCase()
              .indexOf(query) !== -1
          );
        })
        .slice(0, 8);

    if (!matches.length) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }

    panel.innerHTML =
      matches.map(function (location) {
        return (
          '<button ' +
            'type="button" ' +
            'class="demo-property-location-option" ' +
            'data-demo-location="' +
            encodeURIComponent(location) +
            '">' +

            '<span>' +
              location
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;') +
            '</span>' +

            '<small>' +
              'Dashboard location' +
            '</small>' +

          '</button>'
        );
      }).join('');

    panel.hidden = false;
  }


  function chooseDemoLocation(location) {
    location = clean(location);

    if (!location) return;

    var input = getInput();
    var area = getArea();
    var summary = getSummary();
    var panel = ensurePanel();

    selectedDemoLocation =
      location;

    if (input) {
      input.value =
        location;
    }

    if (area) {
      area.value =
        location;

      area.dispatchEvent(
        new Event(
          'input',
          { bubbles: true }
        )
      );
    }

    if (summary) {
      summary.textContent =
        'Dashboard location';
    }

    if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }

    setValidation('');
  }


  function bindSuggestionUI() {
    var input = getInput();
    var panel = ensurePanel();

    if (!input || !panel) {
      return;
    }


    input.addEventListener(
      'input',
      function () {
        if (
          selectedDemoLocation &&
          clean(input.value) !==
          selectedDemoLocation
        ) {
          selectedDemoLocation = '';
        }

        renderSuggestions(
          input.value
        );
      }
    );


    panel.addEventListener(
      'click',
      function (event) {
        var option =
          event.target.closest(
            '[data-demo-location]'
          );

        if (!option) return;

        chooseDemoLocation(
          decodeURIComponent(
            option.getAttribute(
              'data-demo-location'
            )
          )
        );
      }
    );


    document.addEventListener(
      'click',
      function (event) {
        if (
          event.target === input ||
          panel.contains(event.target)
        ) {
          return;
        }

        panel.hidden = true;
      }
    );
  }


  function wrapExistingLocationModule() {
    var api =
      window.HilltopAdminLocation;

    if (!api) {
      console.warn(
        '[Demo locations] HilltopAdminLocation is unavailable.'
      );

      return;
    }


    var originalValidate =
      api.validateForSave;

    var originalSaveValues =
      api.getSaveValues;

    var originalClear =
      api.clear;

    var originalHydrate =
      api.hydrate;


    api.validateForSave =
      function () {
        var input = getInput();

        if (
          selectedDemoLocation &&
          input &&
          clean(input.value) ===
          selectedDemoLocation
        ) {
          setValidation('');

          return {
            valid: true,
            message: ''
          };
        }

        return originalValidate
          .apply(api, arguments);
      };


    api.getSaveValues =
      function () {
        var input = getInput();

        if (
          selectedDemoLocation &&
          input &&
          clean(input.value) ===
          selectedDemoLocation
        ) {
          return {
            province_id: null,
            city_id: null,
            suburb_id: null,
            area:
              selectedDemoLocation
          };
        }

        return originalSaveValues
          .apply(api, arguments);
      };


    api.clear =
      function () {
        selectedDemoLocation = '';

        return originalClear
          .apply(api, arguments);
      };


    api.hydrate =
      async function (property) {
        selectedDemoLocation = '';

        var result =
          await originalHydrate
            .apply(api, arguments);

        if (result) {
          return result;
        }

        await loadPromise;

        var legacyArea =
          clean(
            property &&
            property.area
          );

        if (
          legacyArea &&
          demoLocations.some(
            function (location) {
              return (
                location.toLowerCase() ===
                legacyArea.toLowerCase()
              );
            }
          )
        ) {
          chooseDemoLocation(
            legacyArea
          );

          return {
            id: null,
            type: 'demo',
            name: legacyArea
          };
        }

        return result;
      };
  }


  async function init() {
    loadPromise =
      loadDemoLocations();

    await loadPromise;

    bindSuggestionUI();

    wrapExistingLocationModule();
  }


  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }

  window.addEventListener('hilltop:workspace-changed', function () {
    loadPromise = loadDemoLocations();
  });

})();
