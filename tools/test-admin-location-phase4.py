from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

FILES = {
    "html": ROOT / "properties.html",
    "css": ROOT / "properties.css",
    "js": ROOT / "properties.js",
    "module": ROOT / "property-location-admin.js",
}

checks = []


def check(name, condition):
    if not condition:
        raise AssertionError(name)
    checks.append(name)


for name, path in FILES.items():
    check(f"{name} file exists", path.exists())

html = FILES["html"].read_text(encoding="utf-8")
css = FILES["css"].read_text(encoding="utf-8")
js = FILES["js"].read_text(encoding="utf-8")
module = FILES["module"].read_text(encoding="utf-8")


# ------------------------------------------------------------
# HTML / UI structure
# ------------------------------------------------------------

check(
    "single Property Location control exists",
    html.count('id="fPropertyLocation"') == 1,
)

check(
    "legacy area is hidden",
    '<input type="hidden" id="fArea"' in html,
)

check(
    "old visible area label removed",
    'Neighbourhood / Area' not in html,
)

check(
    "property location result list exists",
    'id="fPropertyLocationResults"' in html,
)

check(
    "property location validation node exists",
    'id="propertyLocationValidationMessage"' in html,
)

check(
    "ARIA combobox role exists",
    'role="combobox"' in html,
)

check(
    "ARIA listbox role exists",
    'role="listbox"' in html,
)

check(
    "location module loads before properties.js",
    html.find('property-location-admin.js')
    < html.find('properties.js'),
)

check(
    "map section remains present",
    'Map Location' in html,
)

check(
    "Full Address remains present",
    'id="fAddress"' in html,
)

check(
    "Branch remains present",
    'id="fBranch"' in html,
)

check(
    "Assigned Agent remains present",
    'id="fAgent"' in html,
)


# ------------------------------------------------------------
# CSS
# ------------------------------------------------------------

check(
    "location result styling exists",
    '.property-location-results' in css,
)

check(
    "location option styling exists",
    '.property-location-option' in css,
)

check(
    "validation styling exists",
    '.property-location-validation-message' in css,
)


# ------------------------------------------------------------
# Search behaviour
# ------------------------------------------------------------

check(
    "minimum search length is 2",
    'var MIN_SEARCH_LENGTH = 2;' in module,
)

check(
    "debounce is 250ms",
    'var SEARCH_DEBOUNCE_MS = 250;' in module,
)

check(
    "search uses search_locations RPC",
    "'search_locations'" in module,
)

check(
    "search sends search_term",
    'search_term: searchTerm' in module,
)

check(
    "search sends result_limit",
    'result_limit: SEARCH_RESULT_LIMIT' in module,
)

check(
    "stale response protection exists",
    module.count(
        'sequence !== state.searchSequence'
    ) >= 2,
)

check(
    "searching state exists",
    'Searching locations...' in module,
)

check(
    "no results state exists",
    'No locations found.' in module,
)

check(
    "RPC failure state exists",
    'Location suggestions are unavailable.' in module,
)


# ------------------------------------------------------------
# Structured selection
# ------------------------------------------------------------

check(
    "query and selected location are separate state",
    "locationQuery: ''" in module
    and "selectedPropertyLocation: null" in module,
)

check(
    "manual edit invalidates structured selection",
    'invalidateSelectionAfterManualEdit' in module,
)

check(
    "clear removes structured selection",
    "state.selectedPropertyLocation = null;" in module,
)

check(
    "province-only selection is rejected",
    'Choose a city or suburb for the property location.' in module,
)

check(
    "typed unselected text is rejected",
    'Select a location from the suggestions.' in module,
)


# ------------------------------------------------------------
# Save payload rules
# ------------------------------------------------------------

check(
    "save payload includes province_id",
    'province_id: selected.provinceId' in module,
)

check(
    "save payload includes city_id",
    'city_id: selected.cityId' in module,
)

check(
    "save payload includes suburb_id",
    'suburb_id:' in module,
)

check(
    "city-only compatibility area becomes empty",
    ": ''" in module
    and "selected.type === 'suburb'" in module,
)

check(
    "properties.js writes province_id",
    'province_id: geography.province_id' in js,
)

check(
    "properties.js writes city_id",
    'city_id: geography.city_id' in js,
)

check(
    "properties.js writes suburb_id",
    'suburb_id: geography.suburb_id' in js,
)

check(
    "old Area required validation removed",
    "throw new Error('Area is required.')" not in js,
)

check(
    "hidden area removed from required field list",
    "'fBranch', 'fArea', 'fStatus'" not in js,
)


# ------------------------------------------------------------
# Edit hydration / legacy behaviour
# ------------------------------------------------------------

check(
    "edit hydration uses exact location_search lookup",
    ".from('location_search')" in module,
)

check(
    "exact hydration filters by type",
    ".eq('type', type)" in module,
)

check(
    "exact hydration filters by id",
    ".eq('id', id)" in module,
)

check(
    "legacy text is not fuzzy-resolved",
    (
        "findExactNormalizedLocation(ids)" in module
        and "String(property.area || '')" in module
        and "requestLocations(property.area" not in module
        and "search_term: property.area" not in module
    ),
)

check(
    "edit modal hydrates normalized location",
    'await window.HilltopAdminLocation.hydrate(p);' in js,
)

check(
    "add modal clears normalized location",
    'window.HilltopAdminLocation.clear();' in js,
)


# ------------------------------------------------------------
# Existing responsibilities preserved
# ------------------------------------------------------------

check(
    "map coordinates still use existing form logic",
    'latitude: propertyLocation.latitude' in js
    and 'longitude: propertyLocation.longitude' in js,
)

check(
    "map address still uses existing form logic",
    'map_address: propertyLocation.map_address' in js,
)

check(
    "branch payload remains unchanged",
    'branch_id: branchId' in js,
)

check(
    "assigned agent payload remains unchanged",
    'assigned_agent_id: assignedAgentId || null' in js,
)

check(
    "website.js was not imported into Phase 4 module",
    'website.js' not in module,
)


result = {
    "checks_passed": len(checks),
    "checks": checks,
}

print(json.dumps(result, indent=2))
