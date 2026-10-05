from pathlib import Path
import re

ROOT = Path.cwd()

def read(name):
    return (ROOT / name).read_text(encoding="utf-8")

def write(name, content):
    (ROOT / name).write_text(content, encoding="utf-8")
    print("UPDATED:", name)


print()
print("======================================================")
print("FIX COUNTRY -> REAL HEADQUARTERS BRANCH")
print("======================================================")
print()


# ============================================================
# 1. DASHBOARD COUNTRY / HEADQUARTERS MAPPING
# ============================================================

dashboard_js = r'''
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
    var raw =
      value &&
      Array.isArray(value.markets)
        ? value.markets
        : [];

    return raw
      .map(function (item) {
        return {
          country:
            clean(item.country),

          headquartersBranchId:
            clean(
              item.headquartersBranchId ||
              item.headquarters_branch_id
            )
        };
      })
      .filter(function (item) {
        return (
          item.country &&
          item.headquartersBranchId
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

    var results =
      await Promise.all([

        supabase
          .from('branches')
          .select(
            'id, name, address, contact_number'
          )
          .order(
            'name',
            { ascending: true }
          ),

        supabase
          .from('app_settings')
          .select('setting_value')
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
     * Compatibility with the first version we created.
     *
     * If demo_market previously contained:
     *
     * {
     *   country: "Zambia",
     *   headquarters: "Lusaka"
     * }
     *
     * convert it in memory only if an ACTUAL branch
     * named Lusaka exists.
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
      await supabase
        .from('app_settings')
        .select('id')
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
        await supabase
          .from('app_settings')
          .update({
            setting_value:
              settingValue
          })
          .eq(
            'setting_key',
            'demo_market'
          );

    } else {

      response =
        await supabase
          .from('app_settings')
          .insert({
            setting_key:
              'demo_market',

            setting_category:
              'website',

            setting_value:
              settingValue
          });
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
            Connect each demo country to a real
            branch in the system. Properties will
            continue saving the correct branch ID.
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
                  <option value="United Kingdom"></option>
                  <option value="Canada"></option>
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
                    Select an existing branch...
                  </option>

                </select>

              </label>

            </div>


            <div class="theme-settings-actions">

              <button
                class="action-btn primary"
                type="submit">

                Add / Update Country

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
      'Select an existing branch...' +
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
            'Choose both a country and an existing headquarters branch.',
            'error'
          );

          return;
        }


        if (!getBranch(branchId)) {

          setStatus(
            'That headquarters branch no longer exists.',
            'error'
          );

          return;
        }


        var existingIndex =
          markets.findIndex(
            function (item) {
              return (
                item.country
                  .toLowerCase() ===
                country
                  .toLowerCase()
              );
            }
          );


        var mapping = {
          country:
            country,

          headquartersBranchId:
            branchId
        };


        if (existingIndex >= 0) {

          markets[
            existingIndex
          ] = mapping;

        } else {

          markets.push(
            mapping
          );
        }


        try {

          await saveMarkets();

          countryInput.value = '';
          headquartersSelect.value = '';

          renderMarkets();

          setStatus(
            country +
            ' headquarters saved.',
            'success'
          );

        } catch (error) {

          console.error(error);

          setStatus(
            error.message ||
            'Unable to save the country.',
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
            function (item) {
              return (
                item.country
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
            'Unable to remove the country.',
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
        'Unable to load countries and branches.',
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

})();
'''

write(
    "demo-market-config.js",
    dashboard_js
)


# ============================================================
# 2. PROPERTY FORM COUNTRY -> HEADQUARTERS
# ============================================================

property_js = r'''
(function () {
  'use strict';

  var branches = [];
  var markets = [];
  var applyingBranch = false;


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


  function getMarketByBranch(
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
      return;
    }


    var results =
      await Promise.all([

        supabase
          .from('branches')
          .select('id, name')
          .order(
            'name',
            { ascending: true }
          ),

        supabase
          .from('app_settings')
          .select('setting_value')
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
        function (item) {
          return {
            country:
              clean(
                item.country
              ),

            headquartersBranchId:
              clean(
                item.headquartersBranchId ||
                item.headquarters_branch_id
              )
          };
        }
      )
      .filter(
        function (item) {
          return (
            item.country &&
            item.headquartersBranchId
          );
        }
      );
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


  function relabelBranch() {
    var label =
      document.querySelector(
        'label[for="fBranch"]'
      );

    if (!label) return;

    label.innerHTML =
      'Headquarters ' +
      '<span class="req">*</span>';
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
          The headquarters below is determined by
          the selected country.
        </p>

      </div>
      `;


    branchRow.parentNode.insertBefore(
      row,
      branchRow
    );


    relabelBranch();
  }


  function populateCountries() {
    var select =
      countrySelect();

    if (!select) return;


    var current =
      select.value;


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


    if (
      current &&
      getMarket(current)
    ) {
      select.value =
        current;
    }
  }


  function setBranchWaiting() {
    var select =
      branchSelect();

    if (!select) return;


    applyingBranch = true;

    try {

      select.innerHTML =
        '<option value="">' +
        'Select country first...' +
        '</option>';

      select.value = '';

      select.disabled = true;

    } finally {

      applyingBranch = false;
    }
  }


  function applyCountry(
    country,
    suppressChange
  ) {
    var select =
      branchSelect();

    if (!select) return;


    var market =
      getMarket(country);


    if (!market) {
      setBranchWaiting();
      return;
    }


    var branch =
      getBranch(
        market.headquartersBranchId
      );


    if (!branch) {

      applyingBranch = true;

      try {

        select.innerHTML =
          '<option value="">' +
          'Headquarters branch unavailable' +
          '</option>';

        select.value = '';
        select.disabled = true;

      } finally {

        applyingBranch = false;
      }

      return;
    }


    var desiredValue =
      String(branch.id);

    var desiredText =
      cleanBranchName(
        branch.name
      ) +
      ' (Headquarters)';


    if (
      select.options.length === 1 &&
      String(
        select.options[0].value
      ) === desiredValue &&
      select.options[0].textContent ===
        desiredText
    ) {

      select.value =
        desiredValue;

      return;
    }


    applyingBranch = true;

    try {

      select.innerHTML = '';

      var option =
        document.createElement(
          'option'
        );

      option.value =
        branch.id;

      option.textContent =
        desiredText;

      select.appendChild(
        option
      );

      select.value =
        branch.id;

      select.disabled = false;


      var profile =
        window.hilltopCurrentUser ||
        {};

      if (
        profile.role ===
          'branch_manager' ||
        profile.role ===
          'Branch Manager'
      ) {
        select.disabled = true;
      }


      if (!suppressChange) {

        select.dispatchEvent(
          new Event(
            'change',
            { bubbles: true }
          )
        );
      }

    } finally {

      applyingBranch = false;
    }
  }


  function inferCountryFromBranch() {
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

      setBranchWaiting();

      return;
    }


    var market =
      getMarketByBranch(
        branchId
      );


    if (!market) {

      country.value = '';

      /*
       * Do not rename an unmapped branch.
       * Keep the real value visible so an old
       * property cannot silently change branch.
       */
      branch.disabled = false;

      return;
    }


    country.value =
      market.country;


    applyCountry(
      market.country,
      true
    );


    var profile =
      window.hilltopCurrentUser ||
      {};


    if (
      profile.role ===
        'branch_manager' ||
      profile.role ===
        'Branch Manager'
    ) {

      country.disabled =
        true;

    } else {

      country.disabled =
        false;
    }
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
     * properties.js owns the main branch population.
     * If it refreshes the select after our script,
     * re-apply the active country's real HQ branch.
     */
    var branchObserver =
      new MutationObserver(
        function () {

          if (applyingBranch) {
            return;
          }

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


    branchObserver.observe(
      branch,
      {
        childList: true,
        subtree: true
      }
    );


    /*
     * When Add/Edit Property opens, properties.js
     * has already selected the stored branch ID.
     * Use that real UUID to infer the country.
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
                inferCountryFromBranch,
                60
              );
            }
          }
        );


      modalObserver.observe(
        modal,
        {
          attributes: true,
          attributeFilter: [
            'class',
            'style'
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

      relabelBranch();

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

})();
'''

write(
    "demo-property-market.js",
    property_js
)


# ============================================================
# 3. STYLES
# ============================================================

styles = read(
    "styles.css"
)

styles = re.sub(
    r'/\* DEMO COUNTRY HQ MAPPING 20261002 \*/.*?(?=\Z)',
    '',
    styles,
    flags=re.S
)

styles += r'''

/* DEMO COUNTRY HQ MAPPING 20261002 */

.demo-market-list {
  display: grid;
  gap: 9px;
  margin-top: 16px;
}

.demo-market-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 12px 14px;
  border: 1px solid #dbe2e8;
  border-radius: 10px;
  background: #f8fafc;
}

.demo-market-row > div {
  display: grid;
  gap: 2px;
}

.demo-market-row strong {
  font-size: .92rem;
}

.demo-market-row span {
  color: #718096;
  font-size: .82rem;
}

.demo-market-row button {
  border: 0;
  background: transparent;
  color: #a93426;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.demo-market-empty {
  margin: 16px 0 0;
  color: #718096;
}

'''

write(
    "styles.css",
    styles
)


# ============================================================
# 4. VERIFY SCRIPT LOADING
# ============================================================

dashboard_html =
    read("admin-dashboard.html")

properties_html =
    read("properties.html")


checks = [
    (
        "Dashboard loads demo-market-config.js",
        "demo-market-config.js"
        in dashboard_html
    ),

    (
        "Property form loads demo-property-market.js",
        "demo-property-market.js"
        in properties_html
    ),

    (
        "Dashboard uses actual branch UUIDs",
        "headquartersBranchId"
        in read(
          "demo-market-config.js"
        )
    ),

    (
        "Country selector added to property form",
        "fDemoCountry"
        in read(
          "demo-property-market.js"
        )
    ),

    (
        "Property HQ uses branch UUID",
        "market.headquartersBranchId"
        in read(
          "demo-property-market.js"
        )
    ),

    (
        "Old first-branch relabel trick removed",
        "realOptions[0]"
        not in read(
          "demo-property-market.js"
        )
    ),

    (
        "Hero fallback feature retained",
        "demoHeroFile"
        in read(
          "demo-dashboard-config.js"
        )
    ),

    (
        "Location feature retained",
        "demoLocations"
        in read(
          "demo-dashboard-config.js"
        )
    )
]


print()
print("======================================================")
print("SOURCE CHECKS")
print("======================================================")


failed = False

for label, passed in checks:

    if passed:
        print("PASS:", label)

    else:
        print("FAIL:", label)
        failed = True


if failed:
    raise SystemExit(1)


print()
print("SOURCE CHECKS PASSED")
print()
print("No Supabase migration is required.")
print("Do NOT run supabase db push.")
print()

