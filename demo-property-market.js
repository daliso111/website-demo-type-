(function () {
  'use strict';

  var branches = [];
  var markets = [];
  var applying = false;


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


  function branchSelect() {
    return document.getElementById(
      'fBranch'
    );
  }


  function countrySelect() {
    return document.getElementById(
      'fDemoCountry'
    );
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


  function getMarket(country) {
    return markets.find(
      function (market) {
        return (
          market.country
            .toLowerCase() ===
          clean(country)
            .toLowerCase()
        );
      }
    ) || null;
  }


  function marketFromBranch(
    branchId
  ) {
    return markets.find(
      function (market) {
        return (
          String(
            market.headquartersBranchId
          ) ===
          String(branchId)
        );
      }
    ) || null;
  }


  async function loadData() {
    var supabase =
      getSupabase();

    if (!supabase) {
      throw new Error(
        'Supabase client unavailable.'
      );
    }


    await window.HilltopWorkspace.ready();
    var loadingWorkspaceId = window.HilltopWorkspace.getActive().id;
    var results =
      await Promise.all([

        window.HilltopWorkspace.scope(supabase
          .from('branches')
          .select('id, name'))
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
      (
        Array.isArray(value.markets)
          ? value.markets
          : []
      )
      .map(
        function (market) {
          return {
            country:
              clean(
                market.country
              ),

            headquartersBranchId:
              clean(
                market.headquartersBranchId ||
                market.headquarters_branch_id
              )
          };
        }
      )
      .filter(
        function (market) {
          return (
            market.country &&
            market.headquartersBranchId
          );
        }
      );
  }


  function ensureCountryField() {
    if (
      document.getElementById(
        'demoCountryPropertyRow'
      )
    ) {
      return;
    }


    var branch =
      branchSelect();

    if (!branch) return;


    var branchRow =
      branch.closest(
        '.form-row'
      );

    if (!branchRow) return;


    var row =
      document.createElement(
        'div'
      );

    row.className =
      'form-row';

    row.id =
      'demoCountryPropertyRow';


    row.innerHTML =
      `
      <div class="form-group full">

        <label for="fDemoCountry">
          Country <span class="req">*</span>
        </label>

        <select
          id="fDemoCountry"
          required>

          <option value="">
            Select country...
          </option>

        </select>

        <p class="form-help">
          Selecting a country automatically chooses
          that country's headquarters.
        </p>

      </div>
      `;


    branchRow.parentNode
      .insertBefore(
        row,
        branchRow
      );


    var label =
      document.querySelector(
        'label[for="fBranch"]'
      );

    if (label) {

      label.innerHTML =
        'Headquarters ' +
        '<span class="req">*</span>';
    }
  }


  function populateCountries() {
    var select =
      countrySelect();

    if (!select) return;


    select.innerHTML =
      '<option value="">' +
      'Select country...' +
      '</option>';


    markets
      .slice()
      .sort(
        function (a, b) {
          return a.country.localeCompare(
            b.country
          );
        }
      )
      .forEach(
        function (market) {

          var option =
            document.createElement(
              'option'
            );

          option.value =
            market.country;

          option.textContent =
            market.country;

          select.appendChild(
            option
          );
        }
      );
  }


  function showWaitingBranch() {
    var select =
      branchSelect();

    if (!select) return;


    applying = true;

    try {

      select.innerHTML =
        '<option value="">' +
        'Select country first...' +
        '</option>';

      select.value = '';

      select.disabled = true;

    } finally {

      applying = false;
    }
  }


  function applyCountry(
    country,
    silent
  ) {
    var select =
      branchSelect();

    if (!select) return;


    var market =
      getMarket(country);


    if (!market) {

      showWaitingBranch();

      return;
    }


    var branch =
      getBranch(
        market.headquartersBranchId
      );


    if (!branch) {

      applying = true;

      try {

        select.innerHTML =
          '<option value="">' +
          'Headquarters unavailable' +
          '</option>';

        select.value = '';

        select.disabled = true;

      } finally {

        applying = false;
      }

      return;
    }


    applying = true;

    try {

      select.innerHTML = '';

      var option =
        document.createElement(
          'option'
        );

      option.value =
        branch.id;

      option.textContent =
        cleanBranchName(
          branch.name
        ) +
        ' (Headquarters)';

      select.appendChild(
        option
      );

      select.value =
        branch.id;


      var profile =
        window.hilltopCurrentUser ||
        {};


      var manager =
        profile.role ===
          'branch_manager' ||
        profile.role ===
          'Branch Manager';


      select.disabled =
        manager;


      if (!silent) {

        select.dispatchEvent(
          new Event(
            'change',
            { bubbles: true }
          )
        );
      }

    } finally {

      applying = false;
    }
  }


  function inferCountry() {
    var branch =
      branchSelect();

    var country =
      countrySelect();

    if (!branch || !country) {
      return;
    }


    var branchId =
      branch.value ||
      (
        window.hilltopCurrentUser &&
        window.hilltopCurrentUser.branch_id
      ) ||
      '';


    if (!branchId) {

      country.value = '';

      showWaitingBranch();

      return;
    }


    var market =
      marketFromBranch(
        branchId
      );


    if (!market) {

      /*
       * Existing property with an unmapped
       * branch must NOT be silently changed.
       */
      country.value = '';

      return;
    }


    country.value =
      market.country;


    applyCountry(
      market.country,
      true
    );
  }


  function bind() {
    var country =
      countrySelect();

    var branch =
      branchSelect();

    if (!country || !branch) {
      return;
    }


    country.addEventListener(
      'change',
      function () {

        applyCountry(
          country.value,
          false
        );
      }
    );


    /*
     * properties.js may rebuild fBranch after
     * loading Supabase data. Re-apply the
     * selected country's headquarters afterward.
     */
    var observer =
      new MutationObserver(
        function () {

          if (applying) return;

          if (country.value) {

            window.setTimeout(
              function () {

                applyCountry(
                  country.value,
                  true
                );

              },
              0
            );
          }
        }
      );


    observer.observe(
      branch,
      {
        childList: true
      }
    );


    /*
     * Detect Add/Edit Property opening.
     */
    var modal =
      document.getElementById(
        'propModal'
      );


    if (modal) {

      var modalObserver =
        new MutationObserver(
          function () {

            if (
              modal.classList.contains(
                'open'
              )
            ) {

              window.setTimeout(
                inferCountry,
                80
              );
            }
          }
        );


      modalObserver.observe(
        modal,
        {
          attributes: true,
          attributeFilter: [
            'class'
          ]
        }
      );
    }
  }


  async function init() {
    ensureCountryField();

    try {

      await loadData();

      populateCountries();

      bind();

      showWaitingBranch();

    } catch (error) {

      console.error(
        '[Country / Headquarters]',
        error
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
    loadData().then(populateCountries).catch(function (error) {
      console.error('[Country / Headquarters]', error);
    });
  });

})();
