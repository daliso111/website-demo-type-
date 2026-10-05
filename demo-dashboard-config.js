
(function () {
  'use strict';

  var preferences = {};
  var locations = [];
  var pendingHero = '';

  function getSupabase() {
    return window.hilltopSupabase || null;
  }

  function clean(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }

  function uniqueLocations(values) {
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

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function setStatus(id, message, type) {
    var element = document.getElementById(id);

    if (!element) return;

    element.textContent = message || '';
    element.classList.remove('success', 'error');

    if (type) {
      element.classList.add(type);
    }
  }


  async function loadPreferences() {
    var supabase = getSupabase();

    if (!supabase) {
      throw new Error(
        'Supabase client is unavailable.'
      );
    }

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

    preferences =
      response.data &&
      response.data.setting_value
        ? response.data.setting_value
        : {};

    locations = uniqueLocations(
      preferences.demoLocations || []
    );
  }


  async function savePreferences() {
    var supabase = getSupabase();

    if (!supabase) {
      throw new Error(
        'Supabase client is unavailable.'
      );
    }

    preferences.demoLocations =
      uniqueLocations(locations);

    var check = await window.HilltopWorkspace.scope(supabase
      .from('app_settings')
      .select('id'))
      .eq(
        'setting_key',
        'website_preferences'
      )
      .maybeSingle();

    if (check.error) {
      throw check.error;
    }

    var response;

    if (check.data) {
      response = await window.HilltopWorkspace.scope(supabase
        .from('app_settings')
        .update({
          setting_value: preferences
        }))
        .eq(
          'setting_key',
          'website_preferences'
        );
    } else {
      response = await supabase
        .from('app_settings')
        .insert(window.HilltopWorkspace.withWorkspace({
          setting_key:
            'website_preferences',

          setting_category:
            'website',

          setting_value:
            preferences
        }));
    }

    if (response.error) {
      throw response.error;
    }
  }


  function injectCards() {
    if (
      document.getElementById(
        'dashboardDemoLocations'
      )
    ) {
      return;
    }

    var themeCard =
      document.querySelector(
        '.theme-settings-card'
      );

    if (!themeCard) {
      console.warn(
        '[Demo settings] Theme card not found.'
      );

      return;
    }

    themeCard.insertAdjacentHTML(
      'afterend',
      `
      <section
        class="brand-settings-card demo-location-card"
        id="dashboardDemoLocations">

        <div class="brand-settings-copy">

          <p class="brand-settings-eyebrow">
            Demo locations
          </p>

          <h2>
            Property locations
          </h2>

          <p>
            Add simple cities or areas that can be
            selected when creating a property.
          </p>

        </div>

        <div>

          <form
            class="brand-settings-form"
            id="demoLocationForm">

            <label for="demoLocationInput">
              City / Location
            </label>

            <div class="brand-settings-controls">

              <input
                id="demoLocationInput"
                type="text"
                maxlength="120"
                placeholder="e.g. Lusaka, Livingstone or Siavonga"
                required>

              <button
                class="action-btn primary"
                type="submit">
                Add location
              </button>

            </div>

            <p
              class="brand-settings-status"
              id="demoLocationStatus"
              role="status"
              aria-live="polite">
            </p>

          </form>

          <div
            class="demo-location-list"
            id="demoLocationList">
          </div>

        </div>

      </section>


      <section
        class="brand-settings-card demo-hero-card"
        id="dashboardDemoHero">

        <div class="brand-settings-copy">

          <p class="brand-settings-eyebrow">
            Homepage hero
          </p>

          <h2>
            Fallback image
          </h2>

          <p>
            Change the fallback image used by the
            homepage hero without editing the site code.
          </p>

        </div>

        <div class="demo-hero-manager">

          <div
            class="demo-hero-preview"
            id="demoHeroPreview">

            <span>
              Original fallback image is active
            </span>

          </div>

          <label
            class="demo-hero-file-label"
            for="demoHeroFile">

            Choose fallback image

            <input
              id="demoHeroFile"
              type="file"
              accept="image/jpeg,image/png,image/webp">

          </label>

          <p class="demo-hero-help">
            JPG, PNG or WebP. Maximum 5 MB.
          </p>

          <div class="theme-settings-actions">

            <button
              class="action-btn primary"
              id="demoHeroSave"
              type="button">
              Save fallback image
            </button>

            <button
              class="action-btn outline"
              id="demoHeroReset"
              type="button">
              Restore original
            </button>

            <a
              class="action-btn outline"
              href="index.html"
              target="_blank"
              rel="noopener">
              View website
            </a>

          </div>

          <p
            class="brand-settings-status"
            id="demoHeroStatus"
            role="status"
            aria-live="polite">
          </p>

        </div>

      </section>
      `
    );
  }


  function renderLocations() {
    var list =
      document.getElementById(
        'demoLocationList'
      );

    if (!list) return;

    if (!locations.length) {
      list.innerHTML =
        '<p class="demo-location-empty">' +
        'No custom locations added yet.' +
        '</p>';

      return;
    }

    list.innerHTML =
      locations.map(
        function (location, index) {
          return (
            '<div class="demo-location-row">' +

              '<span>' +
                escapeHtml(location) +
              '</span>' +

              '<button ' +
                'type="button" ' +
                'data-demo-location-remove="' +
                index +
                '">' +
                'Remove' +
              '</button>' +

            '</div>'
          );
        }
      ).join('');
  }


  function bindLocationManager() {
    var form =
      document.getElementById(
        'demoLocationForm'
      );

    var input =
      document.getElementById(
        'demoLocationInput'
      );

    var list =
      document.getElementById(
        'demoLocationList'
      );

    if (!form || !input || !list) {
      return;
    }


    form.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();

        var location =
          clean(input.value);

        if (!location) return;

        var exists =
          locations.some(
            function (item) {
              return (
                item.toLowerCase() ===
                location.toLowerCase()
              );
            }
          );

        if (exists) {
          setStatus(
            'demoLocationStatus',
            'That location already exists.',
            'error'
          );

          return;
        }

        locations.push(location);
        locations =
          uniqueLocations(locations);

        try {
          await savePreferences();

          input.value = '';

          renderLocations();

          setStatus(
            'demoLocationStatus',
            'Location added.',
            'success'
          );

        } catch (error) {
          console.error(error);

          setStatus(
            'demoLocationStatus',
            error.message ||
            'Unable to save location.',
            'error'
          );
        }
      }
    );


    list.addEventListener(
      'click',
      async function (event) {
        var button =
          event.target.closest(
            '[data-demo-location-remove]'
          );

        if (!button) return;

        var index =
          Number(
            button.getAttribute(
              'data-demo-location-remove'
            )
          );

        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= locations.length
        ) {
          return;
        }

        locations.splice(index, 1);

        try {
          await savePreferences();

          renderLocations();

          setStatus(
            'demoLocationStatus',
            'Location removed.',
            'success'
          );

        } catch (error) {
          console.error(error);

          setStatus(
            'demoLocationStatus',
            error.message ||
            'Unable to remove location.',
            'error'
          );
        }
      }
    );
  }


  function renderHero(url) {
    var preview =
      document.getElementById(
        'demoHeroPreview'
      );

    if (!preview) return;

    if (!url) {
      preview.innerHTML =
        '<span>' +
        'Original fallback image is active' +
        '</span>';

      return;
    }

    preview.innerHTML =
      '<img src="' +
      url +
      '" alt="Hero fallback preview">';
  }


  function bindHeroManager() {
    var fileInput =
      document.getElementById(
        'demoHeroFile'
      );

    var saveButton =
      document.getElementById(
        'demoHeroSave'
      );

    var resetButton =
      document.getElementById(
        'demoHeroReset'
      );

    if (
      !fileInput ||
      !saveButton ||
      !resetButton
    ) {
      return;
    }

    renderHero(
      preferences.heroFallbackImageUrl || ''
    );


    fileInput.addEventListener(
      'change',
      function () {
        var file =
          fileInput.files &&
          fileInput.files[0];

        pendingHero = '';

        if (!file) return;

        var validTypes = [
          'image/jpeg',
          'image/png',
          'image/webp'
        ];

        if (
          validTypes.indexOf(
            file.type
          ) === -1
        ) {
          fileInput.value = '';

          setStatus(
            'demoHeroStatus',
            'Use a JPG, PNG or WebP image.',
            'error'
          );

          return;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          fileInput.value = '';

          setStatus(
            'demoHeroStatus',
            'Image must be 5 MB or smaller.',
            'error'
          );

          return;
        }

        var reader =
          new FileReader();

        reader.onload =
          function () {
            pendingHero =
              String(
                reader.result || ''
              );

            renderHero(
              pendingHero
            );

            setStatus(
              'demoHeroStatus',
              'Preview ready. Click Save fallback image.',
              ''
            );
          };

        reader.onerror =
          function () {
            setStatus(
              'demoHeroStatus',
              'Unable to read this image.',
              'error'
            );
          };

        reader.readAsDataURL(file);
      }
    );


    saveButton.addEventListener(
      'click',
      async function () {
        if (!pendingHero) {
          setStatus(
            'demoHeroStatus',
            'Choose an image first.',
            'error'
          );

          return;
        }

        saveButton.disabled = true;

        try {
          preferences.heroFallbackImageUrl =
            pendingHero;

          await savePreferences();

          fileInput.value = '';
          pendingHero = '';

          renderHero(
            preferences.heroFallbackImageUrl
          );

          setStatus(
            'demoHeroStatus',
            'Fallback image saved.',
            'success'
          );

        } catch (error) {
          console.error(error);

          setStatus(
            'demoHeroStatus',
            error.message ||
            'Unable to save fallback image.',
            'error'
          );

        } finally {
          saveButton.disabled = false;
        }
      }
    );


    resetButton.addEventListener(
      'click',
      async function () {
        resetButton.disabled = true;

        try {
          delete preferences
            .heroFallbackImageUrl;

          await savePreferences();

          fileInput.value = '';
          pendingHero = '';

          renderHero('');

          setStatus(
            'demoHeroStatus',
            'Original fallback image restored.',
            'success'
          );

        } catch (error) {
          console.error(error);

          setStatus(
            'demoHeroStatus',
            error.message ||
            'Unable to restore original image.',
            'error'
          );

        } finally {
          resetButton.disabled = false;
        }
      }
    );
  }


  async function init() {
    injectCards();

    try {
      await loadPreferences();

      renderLocations();

      bindLocationManager();

      bindHeroManager();

    } catch (error) {
      console.error(
        '[Demo settings]',
        error
      );

      setStatus(
        'demoLocationStatus',
        error.message ||
        'Unable to load settings.',
        'error'
      );

      setStatus(
        'demoHeroStatus',
        error.message ||
        'Unable to load settings.',
        'error'
      );
    }
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
    loadPreferences().then(renderLocations).catch(function (error) {
      setStatus('demoLocationStatus', error.message || 'Unable to load settings.', 'error');
    });
  });

})();
