(function () {
  'use strict';

  var branches = [];
  var markets = [];


  function getSupabase() {
    return window.hilltopSupabase || null;
  }


  function clean(value) {
    return String(value || '')
      .trim()
      .replace(/\s+/g, ' ');
  }


  function cleanBranchName(value) {
    return clean(value)
      .replace(/\s+Branch$/i, '')
      .trim();
  }


  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }


  function setStatus(message, type) {
    var el =
      document.getElementById(
        'demoMarketStatus'
      );

    if (!el) return;

    el.textContent = message || '';

    el.classList.remove(
      'success',
      'error'
    );

    if (type) {
      el.classList.add(type);
    }
  }


  function getBranch(branchId) {
    return branches.find(
      function (branch) {
        return (
          String(branch.id) ===
          String(branchId)
        );
      }
    ) || null;
  }


  function normalizeMarkets(value) {
    var rows =
      value &&
      Array.isArray(value.markets)
        ? value.markets
        : [];

    return rows
      .map(function (row) {
        return {
          country:
            clean(row.country),

          headquartersBranchId:
            clean(
              row.headquartersBranchId ||
              row.headquarters_branch_id
            )
        };
      })
      .filter(function (row) {
        return (
          row.country &&
          row.headquartersBranchId
        );
      });
  }


  async function loadData() {
    var supabase =
      getSupabase();

    if (!supabase) {
      throw new Error(
        'Supabase client is unavailable.'
      );
    }


    await window.HilltopWorkspace.ready();
    var loadingWorkspaceId = window.HilltopWorkspace.getActive().id;
    var results =
      await Promise.all([

        window.HilltopWorkspace.scope(supabase
          .from('branches')
          .select(
            'id, name, address, contact_number'
          ))
          .order(
            'name',
            { ascending: true }
          ),

        window.HilltopWorkspace.scope(supabase
          .from('app_settings')
          .select('setting_value'))
          .eq(
            'setting_key',
            'demo_market'
          )
          .maybeSingle()

      ]);


    if (results[0].error) {
      throw results[0].error;
    }

    if (results[1].error) {
      throw results[1].error;
    }
    if (!window.HilltopWorkspace.getActive() || window.HilltopWorkspace.getActive().id !== loadingWorkspaceId) return;


    branches =
      results[0].data || [];


    var value =
      results[1].data &&
      results[1].data.setting_value
        ? results[1].data.setting_value
        : {};


    markets =
      normalizeMarkets(value);


    /*
     * Convert the OLD simple setting automatically
     * when its headquarters already exists as a
     * real branch.
     */
    if (
      !markets.length &&
      clean(value.country) &&
      clean(value.headquarters)
    ) {

      var legacyBranch =
        branches.find(
          function (branch) {
            return (
              cleanBranchName(branch.name)
                .toLowerCase() ===
              clean(value.headquarters)
                .toLowerCase()
            );
          }
        );


      if (legacyBranch) {

        markets.push({
          country:
            clean(value.country),

          headquartersBranchId:
            legacyBranch.id
        });
      }
    }
  }


  async function saveMarkets() {
    var supabase =
      getSupabase();


    var settingValue = {
      markets:
        markets.map(
          function (market) {
            return {
              country:
                market.country,

              headquartersBranchId:
                market.headquartersBranchId
            };
          }
        )
    };


    var existing =
      await window.HilltopWorkspace.scope(supabase
        .from('app_settings')
        .select('id'))
        .eq(
          'setting_key',
          'demo_market'
        )
        .maybeSingle();


    if (existing.error) {
      throw existing.error;
    }


    var response;


    if (existing.data) {

      response =
        await window.HilltopWorkspace.scope(supabase
          .from('app_settings')
          .update({
            setting_value:
              settingValue
          }))
          .eq(
            'setting_key',
            'demo_market'
          );

    } else {

      response =
        await supabase
          .from('app_settings')
          .insert(window.HilltopWorkspace.withWorkspace({
            setting_key:
              'demo_market',

            setting_category:
              'website',

            setting_value:
              settingValue
          }));
    }


    if (response.error) {
      throw response.error;
    }
  }


  function injectCard() {
    if (
      document.getElementById(
        'dashboardDemoMarket'
      )
    ) {
      return;
    }


    var anchor =
      document.getElementById(
        'dashboardDemoLocations'
      ) ||
      document.querySelector(
        '.theme-settings-card'
      );


    if (!anchor) {
      console.warn(
        '[Demo market] Dashboard anchor unavailable.'
      );

      return;
    }


    anchor.insertAdjacentHTML(
      'afterend',
      `
      <section
        class="brand-settings-card demo-market-card"
        id="dashboardDemoMarket">

        <div class="brand-settings-copy">

          <p class="brand-settings-eyebrow">
            Demo markets
          </p>

          <h2>
            Countries &amp; headquarters
          </h2>

          <p>
            Add the countries represented by this
            demo and connect each one to its actual
            headquarters branch.
          </p>

        </div>


        <div>

          <form
            class="brand-settings-form"
            id="demoMarketForm">


            <div class="demo-market-grid">

              <label for="demoMarketCountry">

                <span>
                  Country
                </span>

                <input
                  id="demoMarketCountry"
                  type="text"
                  list="demoCountryOptions"
                  maxlength="100"
                  placeholder="e.g. Zambia"
                  required>

                <datalist id="demoCountryOptions">
                  <option value="Zambia"></option>
                  <option value="Zimbabwe"></option>
                  <option value="South Africa"></option>
                  <option value="Botswana"></option>
                  <option value="Namibia"></option>
                  <option value="Malawi"></option>
                  <option value="Mozambique"></option>
                  <option value="Tanzania"></option>
                  <option value="Kenya"></option>
                  <option value="Uganda"></option>
                  <option value="Rwanda"></option>
                  <option value="Ghana"></option>
                  <option value="Nigeria"></option>
                  <option value="Canada"></option>
                  <option value="United Kingdom"></option>
                  <option value="United States"></option>
                </datalist>

              </label>


              <label for="demoMarketHeadquarters">

                <span>
                  Headquarters
                </span>

                <select
                  id="demoMarketHeadquarters"
                  required>

                  <option value="">
                    Select existing branch...
                  </option>

                </select>

              </label>

            </div>


            <div class="theme-settings-actions">

              <button
                class="action-btn primary"
                type="submit">

                Save Country

              </button>


              <a
                class="action-btn outline"
                href="staff.html">

                Manage Branches

              </a>

            </div>


            <p
              class="brand-settings-status"
              id="demoMarketStatus"
              role="status"
              aria-live="polite">
            </p>

          </form>


          <div
            class="demo-market-list"
            id="demoMarketList">
          </div>

        </div>

      </section>
      `
    );
  }


  function populateBranchSelect() {
    var select =
      document.getElementById(
        'demoMarketHeadquarters'
      );

    if (!select) return;


    select.innerHTML =
      '<option value="">' +
      'Select existing branch...' +
      '</option>';


    branches.forEach(
      function (branch) {

        var option =
          document.createElement(
            'option'
          );

        option.value =
          branch.id;

        option.textContent =
          cleanBranchName(
            branch.name
          );

        select.appendChild(
          option
        );
      }
    );
  }


  function renderMarkets() {
    var list =
      document.getElementById(
        'demoMarketList'
      );

    if (!list) return;


    if (!markets.length) {

      list.innerHTML =
        '<p class="demo-market-empty">' +
        'No countries configured yet.' +
        '</p>';

      return;
    }


    list.innerHTML =
      markets
        .slice()
        .sort(
          function (a, b) {
            return a.country.localeCompare(
              b.country
            );
          }
        )
        .map(
          function (market) {

            var branch =
              getBranch(
                market.headquartersBranchId
              );


            var headquarters =
              branch
                ? cleanBranchName(
                    branch.name
                  )
                : 'Missing branch';


            return (
              '<div class="demo-market-row">' +

                '<div>' +

                  '<strong>' +
                    escapeHtml(
                      market.country
                    ) +
                  '</strong>' +

                  '<span>' +
                    escapeHtml(
                      headquarters
                    ) +
                    ' Headquarters' +
                  '</span>' +

                '</div>' +

                '<button ' +
                  'type="button" ' +
                  'data-remove-market="' +
                  encodeURIComponent(
                    market.country
                  ) +
                  '">' +

                  'Remove' +

                '</button>' +

              '</div>'
            );
          }
        )
        .join('');
  }


  function bind() {
    var form =
      document.getElementById(
        'demoMarketForm'
      );

    var countryInput =
      document.getElementById(
        'demoMarketCountry'
      );

    var headquartersSelect =
      document.getElementById(
        'demoMarketHeadquarters'
      );

    var list =
      document.getElementById(
        'demoMarketList'
      );


    if (
      !form ||
      !countryInput ||
      !headquartersSelect ||
      !list
    ) {
      return;
    }


    form.addEventListener(
      'submit',
      async function (event) {
        event.preventDefault();


        var country =
          clean(
            countryInput.value
          );

        var branchId =
          clean(
            headquartersSelect.value
          );


        if (
          !country ||
          !branchId
        ) {

          setStatus(
            'Select both a country and its headquarters branch.',
            'error'
          );

          return;
        }


        if (!getBranch(branchId)) {

          setStatus(
            'The selected branch no longer exists.',
            'error'
          );

          return;
        }


        var index =
          markets.findIndex(
            function (market) {
              return (
                market.country
                  .toLowerCase() ===
                country
                  .toLowerCase()
              );
            }
          );


        var row = {
          country:
            country,

          headquartersBranchId:
            branchId
        };


        if (index >= 0) {

          markets[index] =
            row;

        } else {

          markets.push(
            row
          );
        }


        try {

          await saveMarkets();

          countryInput.value = '';
          headquartersSelect.value = '';

          renderMarkets();

          setStatus(
            country +
            ' saved.',
            'success'
          );

        } catch (error) {

          console.error(error);

          setStatus(
            error.message ||
            'Unable to save country.',
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
            '[data-remove-market]'
          );

        if (!button) return;


        var country =
          decodeURIComponent(
            button.getAttribute(
              'data-remove-market'
            )
          );


        markets =
          markets.filter(
            function (market) {
              return (
                market.country
                  .toLowerCase() !==
                country
                  .toLowerCase()
              );
            }
          );


        try {

          await saveMarkets();

          renderMarkets();

          setStatus(
            country +
            ' removed.',
            'success'
          );

        } catch (error) {

          console.error(error);

          setStatus(
            error.message ||
            'Unable to remove country.',
            'error'
          );
        }
      }
    );
  }


  async function init() {
    injectCard();

    try {

      await loadData();

      populateBranchSelect();

      renderMarkets();

      bind();

    } catch (error) {

      console.error(
        '[Demo markets]',
        error
      );

      setStatus(
        error.message ||
        'Unable to load countries and headquarters.',
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
    loadData().then(function () {
      populateBranchSelect();
      renderMarkets();
    }).catch(function (error) {
      setStatus(error.message || 'Unable to load countries and headquarters.', 'error');
    });
  });

})();
