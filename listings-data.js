/* Public inventory for dedicated listing pages. No preview-data fallback. */
(function (root) {
  'use strict';
  var fields = 'id, reference_number, title, description, price, currency_code, purpose, property_type, area, full_address, province_id, city_id, area_slug, bedrooms, bathrooms, garages, square_metres, status, featured, branch_id, created_at, amenities';
  var imageFields = 'property_id, image_url, display_order, is_cover';
  var pageSize = 500;

  function numberOrNull(value) {
    if (value == null || value === '') return null;
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function normalizeProperty(row) {
    var property = Object.assign({}, row);
    ['id', 'reference_number', 'title', 'description', 'area', 'full_address', 'property_type'].forEach(function (key) {
      property[key] = String(row[key] == null ? '' : row[key]).trim();
    });
    ['price', 'bedrooms', 'bathrooms', 'garages', 'square_metres'].forEach(function (key) {
      property[key] = numberOrNull(row[key]);
    });
    // Match the main site's legacy ZMW default; never invent an exchange rate.
    property.currency_code = root.HilltopCurrency.normalizeCurrencyCode(row.currency_code);
    property.amenities = Array.isArray(row.amenities) ? row.amenities.filter(function (item) {
      return typeof item === 'string' && item.trim();
    }).map(function (item) { return item.trim(); }) : [];
    return property;
  }

  async function readPages(buildQuery, signal) {
    var rows = [];
    for (var offset = 0; ; offset += pageSize) {
      var result = await buildQuery().range(offset, offset + pageSize - 1).abortSignal(signal);
      if (result.error) throw result.error;
      var page = result.data || [];
      rows = rows.concat(page);
      if (page.length < pageSize) return rows;
    }
  }

  async function loadPublicListings(purpose) {
    if (purpose !== 'For Sale' && purpose !== 'For Rent') throw new Error('Invalid listing purpose.');
    var client = root.hilltopSupabase;
    if (!client) throw new Error('Supabase is unavailable.');
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 30000);
    try {
      var inventory = await Promise.all([
        readPages(function () {
          return client.from('properties').select(fields)
            .eq('purpose', purpose).in('status', ['Active', 'Under Offer'])
            .order('created_at', {ascending: false}).order('id', {ascending: true});
        }, controller.signal),
        readPages(function () {
          return client.from('provinces').select('id, name, slug').order('name', {ascending: true});
        }, controller.signal),
        readPages(function () {
          return client.from('cities').select('id, province_id, name, slug').order('name', {ascending: true});
        }, controller.signal)
      ]);
      var properties = inventory[0];
      // Fail closed if a malformed response violates the server query contract.
      if (properties.some(function (row) {
        return !row.id || row.purpose !== purpose || ['Active', 'Under Offer'].indexOf(row.status) === -1;
      })) throw new Error('Unexpected public inventory response.');
      var images = [];
      for (var start = 0; start < properties.length; start += 100) {
        var ids = properties.slice(start, start + 100).map(function (row) { return row.id; });
        var batch = await readPages(function () {
          return client.from('property_images').select(imageFields).in('property_id', ids)
            .order('is_cover', {ascending: false}).order('display_order', {ascending: true})
            .order('property_id', {ascending: true}).order('image_url', {ascending: true});
        }, controller.signal);
        images = images.concat(batch.filter(function (row) {
          return ids.indexOf(row.property_id) !== -1 && typeof row.image_url === 'string' && /^https?:\/\//i.test(row.image_url.trim());
        }).map(function (row) {
          return {property_id: row.property_id, image_url: row.image_url.trim(),
            display_order: numberOrNull(row.display_order) || 0, is_cover: row.is_cover === true};
        }));
      }
      return {
        properties: properties.map(normalizeProperty),
        images: images,
        provinces: inventory[1],
        cities: inventory[2]
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  function comparePrices(a, b, direction) {
    var currencies = {ZMW: 0, USD: 1};
    var currencyDifference = currencies[a.currency_code] - currencies[b.currency_code];
    if (currencyDifference) return currencyDifference;
    if (a.price == null) return b.price == null ? 0 : 1;
    if (b.price == null) return -1;
    return direction * (a.price - b.price);
  }

  root.HilltopListingsData = Object.freeze({loadPublicListings: loadPublicListings, comparePrices: comparePrices});
}(window));
