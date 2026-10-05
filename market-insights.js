/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - MARKET INSIGHTS LOOKUP UTILITIES
   Canonical lookup helpers plus the property-details market renderer.
   ============================================================ */

(function (root) {
  'use strict';

  var RESIDENTIAL_PROPERTY_TYPES = Object.freeze(['House', 'Apartment']);
  var SUPPORTED_CURRENCIES = Object.freeze(['ZMW', 'USD']);
  var MARKET_TABLE = 'market_price_statistics';
  var BEDROOM_BUCKET_ORDER = Object.freeze(['1', '2', '3', '4', '5_plus']);

  var APPROVED_AREA_ALIASES = Object.freeze({
    chalala: Object.freeze({ areaKey: 'chalala', areaName: 'Chalala' }),
    kabulonga: Object.freeze({ areaKey: 'kabulonga', areaName: 'Kabulonga' }),
    makeni: Object.freeze({ areaKey: 'makeni', areaName: 'Makeni' }),
    maramba: Object.freeze({ areaKey: 'maramba', areaName: 'Maramba' }),
    'new-kasama': Object.freeze({ areaKey: 'new-kasama', areaName: 'New Kasama' }),
    olympia: Object.freeze({ areaKey: 'olympia', areaName: 'Olympia' }),
    roma: Object.freeze({ areaKey: 'roma', areaName: 'Roma' }),
    silverest: Object.freeze({ areaKey: 'silverest', areaName: 'Silverest' }),
    woodlands: Object.freeze({ areaKey: 'woodlands', areaName: 'Woodlands' }),

    // TEST DATA ONLY: temporary development/QA market. This must never be
    // used as an alias for a real Hilltop property location.
    'qa-market-test': Object.freeze({
      areaKey: 'qa-market-test',
      areaName: 'QA Market Test'
    })
  });

  function normalizeAreaKey(rawArea) {
    if (typeof rawArea !== 'string') return null;

    return rawArea
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function resolveMarketArea(rawArea) {
    var normalizedArea = normalizeAreaKey(rawArea);
    var approvedArea = normalizedArea
      ? APPROVED_AREA_ALIASES[normalizedArea]
      : null;

    if (!approvedArea) return null;

    return {
      areaKey: approvedArea.areaKey,
      areaName: approvedArea.areaName
    };
  }

  function getBedroomBucket(propertyType, bedrooms) {
    if (RESIDENTIAL_PROPERTY_TYPES.indexOf(propertyType) === -1) return null;
    if (!Number.isInteger(bedrooms) || bedrooms <= 0) return null;
    if (bedrooms >= 5) return '5_plus';

    return String(bedrooms);
  }

  function buildMarketLookup(property) {
    if (!property || typeof property !== 'object' || Array.isArray(property)) {
      return null;
    }

    var resolvedArea = resolveMarketArea(property.area);
    if (!resolvedArea) return null;

    var propertyType = property.property_type;
    if (RESIDENTIAL_PROPERTY_TYPES.indexOf(propertyType) === -1) return null;
    if (property.purpose !== 'For Sale') return null;

    var currencyCode = typeof property.currency_code === 'string'
      ? property.currency_code.trim().toUpperCase()
      : '';
    if (SUPPORTED_CURRENCIES.indexOf(currencyCode) === -1) return null;

    var bedroomBucket = getBedroomBucket(propertyType, property.bedrooms);
    if (!bedroomBucket) return null;

    return {
      areaKey: resolvedArea.areaKey,
      areaName: resolvedArea.areaName,
      propertyType: propertyType,
      purpose: property.purpose,
      currencyCode: currencyCode,
      bedroomBucket: bedroomBucket
    };
  }

  function isMarketInsightsEligible(property) {
    return buildMarketLookup(property) !== null;
  }

  function getBedroomBucketLabel(bucket) {
    var labels = {
      1: '1 Bedroom',
      2: '2 Bedrooms',
      3: '3 Bedrooms',
      4: '4 Bedrooms',
      '5_plus': '5+ Bedrooms'
    };

    return labels[bucket] || null;
  }

  function getMarketElements() {
    if (!root.document) return null;

    return {
      section: root.document.getElementById('marketInsightsSection'),
      areaSummary: root.document.getElementById('marketInsightsAreaSummary'),
      priceBody: root.document.getElementById('marketInsightsPriceBody'),
      trends: root.document.querySelector('#marketInsightsSection .market-insights-trends'),
      trendSummary: root.document.getElementById('marketInsightsTrendSummary'),
      chart: root.document.getElementById('marketInsightsPriceChart')
    };
  }

  function resetMarketInsights() {
    var elements = getMarketElements();
    if (!elements) return null;

    if (elements.section) elements.section.hidden = true;
    if (elements.areaSummary) elements.areaSummary.textContent = '';
    if (elements.priceBody) elements.priceBody.textContent = '';
    if (elements.trends) elements.trends.hidden = true;
    if (elements.trendSummary) elements.trendSummary.textContent = '';

    if (elements.chart) {
      elements.chart.classList.remove('is-drawn');
      elements.chart.setAttribute('aria-label', 'Historical average property price trend chart');
      elements.chart.textContent = '';

      var fallback = root.document.createElement('p');
      fallback.className = 'market-price-chart-fallback';
      fallback.textContent = 'Historical average property price trends will be available when market data is loaded.';
      elements.chart.appendChild(fallback);
    }

    return elements;
  }

  function applyMarketFilters(query, lookup) {
    return query
      .eq('area_key', lookup.areaKey)
      .eq('property_type', lookup.propertyType)
      .eq('purpose', lookup.purpose)
      .eq('currency_code', lookup.currencyCode)
      .eq('is_published', true);
  }

  function formatFullPrice(value, currencyCode) {
    if (!root.HilltopCurrency || typeof root.HilltopCurrency.formatPropertyPrice !== 'function') {
      return null;
    }

    return root.HilltopCurrency.formatPropertyPrice(
      Number(value),
      currencyCode,
      'For Sale'
    );
  }

  function formatCompactPrice(value, currencyCode) {
    var amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) return null;

    var prefix = currencyCode === 'USD' ? '$' : 'K';
    if (amount === 0) return prefix + '0';

    var divisor = 1;
    var suffix = '';

    if (amount >= 1000000) {
      divisor = 1000000;
      suffix = 'm';
    } else if (amount >= 1000) {
      divisor = 1000;
      suffix = 'k';
    }

    var compactValue = amount / divisor;
    var digits = Number.isInteger(compactValue) ? 0 : (suffix === 'm' ? 2 : 1);
    return prefix + compactValue.toLocaleString('en-ZM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    }) + suffix;
  }

  function getNiceCeilingStep(value) {
    if (!Number.isFinite(value) || value <= 0) return 1;

    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var fraction = value / magnitude;
    var niceFraction;

    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 2.5) niceFraction = 2.5;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;

    return niceFraction * magnitude;
  }

  function buildPriceTicks(maxPrice, chartWidth) {
    var targetIntervals = chartWidth && chartWidth <= 480 ? 4 : 5;
    var step = getNiceCeilingStep(maxPrice / targetIntervals);
    var ticks = [0];

    for (var value = step; value < maxPrice; value += step) {
      ticks.push(value);
    }

    if (ticks[ticks.length - 1] !== maxPrice) ticks.push(maxPrice);
    return ticks;
  }

  function createTextElement(tagName, className, text) {
    var element = root.document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function renderPriceTable(rows, currencyCode, elements) {
    rows.forEach(function (row) {
      var label = getBedroomBucketLabel(row.bedroom_bucket);
      var formattedPrice = formatFullPrice(row.average_price, currencyCode);
      if (!label || !formattedPrice) return;

      var tableRow = root.document.createElement('tr');
      tableRow.appendChild(createTextElement('td', '', label));
      tableRow.appendChild(createTextElement('td', '', formattedPrice));
      elements.priceBody.appendChild(tableRow);
    });
  }

  function renderTrendSummary(lookup, areaName, latestRow, elements) {
    var bedroomText = lookup.bedroomBucket === '5_plus'
      ? '5+ bedroom'
      : lookup.bedroomBucket + ' bedroom';
    var formattedPrice = formatFullPrice(latestRow.average_price, lookup.currencyCode);

    elements.trendSummary.textContent = [
      'The average price of a',
      bedroomText,
      lookup.propertyType.toLowerCase(),
      lookup.purpose.toLowerCase(),
      'in',
      areaName,
      'is',
      formattedPrice
    ].join(' ') + '.';
  }

  function renderTrendChart(rows, lookup, areaName, elements) {
    var maxPrice = rows.reduce(function (maximum, row) {
      return Math.max(maximum, Number(row.average_price));
    }, 0);

    if (!maxPrice) return false;

    var chart = elements.chart;
    var chartWidth = chart.getBoundingClientRect ? chart.getBoundingClientRect().width : 0;
    if (!chartWidth) chartWidth = Number(root.innerWidth || 0);
    var ticks = buildPriceTicks(maxPrice, chartWidth);
    var grid = root.document.createElement('div');
    var labels = root.document.createElement('div');
    var plot = root.document.createElement('div');
    var gridlines = root.document.createElement('div');
    var bars = root.document.createElement('div');
    var axisRow = root.document.createElement('div');
    var axisSpacer = root.document.createElement('div');
    var axis = root.document.createElement('div');

    chart.textContent = '';
    chart.setAttribute(
      'aria-label',
      'Historical average property prices for ' + getBedroomBucketLabel(lookup.bedroomBucket)
        + ' in ' + areaName + ', from ' + rows[0].year + ' to ' + rows[rows.length - 1].year + '.'
    );

    grid.className = 'market-trend-grid';
    labels.className = 'market-trend-labels';
    labels.setAttribute('aria-hidden', 'true');
    plot.className = 'market-trend-plot';
    gridlines.className = 'market-trend-gridlines';
    gridlines.setAttribute('aria-hidden', 'true');
    bars.className = 'market-trend-bars';
    axisRow.className = 'market-trend-axis-row';
    axisSpacer.setAttribute('aria-hidden', 'true');
    axis.className = 'market-trend-axis';
    axis.setAttribute('aria-hidden', 'true');

    ticks.forEach(function (tick) {
      var percentage = tick / maxPrice * 100;
      var gridline = root.document.createElement('i');
      var tickLabel = createTextElement(
        'span',
        'market-trend-axis-tick',
        formatCompactPrice(tick, lookup.currencyCode)
      );

      gridline.className = 'market-trend-gridline';
      gridline.style.left = percentage + '%';
      tickLabel.style.left = percentage + '%';
      gridlines.appendChild(gridline);
      axis.appendChild(tickLabel);
    });

    rows.forEach(function (row) {
      var averagePrice = Number(row.average_price);
      var width = averagePrice / maxPrice * 100;
      var fullPrice = formatFullPrice(averagePrice, lookup.currencyCode);
      var rowElement = root.document.createElement('div');
      var bar = root.document.createElement('div');
      var value = createTextElement('span', 'market-trend-value', fullPrice);

      labels.appendChild(createTextElement('span', 'market-trend-label', String(row.year)));
      rowElement.className = 'market-trend-row';
      rowElement.style.setProperty('--market-bar-width', width + '%');
      bar.className = 'market-trend-bar';
      bar.tabIndex = 0;
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', row.year + ': average property price ' + fullPrice);
      value.setAttribute('aria-hidden', 'true');
      rowElement.appendChild(bar);
      rowElement.appendChild(value);
      bars.appendChild(rowElement);
    });

    plot.appendChild(gridlines);
    plot.appendChild(bars);
    grid.appendChild(labels);
    grid.appendChild(plot);
    axisRow.appendChild(axisSpacer);
    axisRow.appendChild(axis);
    chart.appendChild(grid);
    chart.appendChild(axisRow);

    return true;
  }

  function normalizeTableRows(rows, lookup, latestYear) {
    return (rows || []).filter(function (row) {
      return getBedroomBucketLabel(row.bedroom_bucket)
        && Number(row.year) === Number(latestYear)
        && Number.isFinite(Number(row.average_price))
        && Number(row.average_price) > 0
        && String(row.currency_code || '').toUpperCase() === lookup.currencyCode
        && typeof row.area_name === 'string'
        && row.area_name.trim();
    }).sort(function (a, b) {
      return BEDROOM_BUCKET_ORDER.indexOf(a.bedroom_bucket)
        - BEDROOM_BUCKET_ORDER.indexOf(b.bedroom_bucket);
    });
  }

  function normalizeTrendRows(rows) {
    return (rows || []).filter(function (row) {
      return Number.isInteger(Number(row.year))
        && Number.isFinite(Number(row.average_price))
        && Number(row.average_price) > 0;
    }).sort(function (a, b) {
      return Number(a.year) - Number(b.year);
    });
  }

  async function loadForProperty(property, supabase) {
    var elements = resetMarketInsights();
    var lookup = buildMarketLookup(property);

    if (!elements || !elements.section || !elements.priceBody || !elements.trends || !elements.chart) {
      return { status: 'unavailable' };
    }

    if (!lookup) return { status: 'ineligible' };
    if (!supabase || typeof supabase.from !== 'function') return { status: 'unavailable' };

    try {
      var latestYearResult = await applyMarketFilters(
        supabase.from(MARKET_TABLE).select('year'),
        lookup
      ).order('year', { ascending: false }).limit(1);

      if (latestYearResult.error) throw latestYearResult.error;
      if (!latestYearResult.data || !latestYearResult.data.length) {
        return { status: 'no-data' };
      }

      var latestMarketYear = Number(latestYearResult.data[0].year);
      var tableResult = await applyMarketFilters(
        supabase.from(MARKET_TABLE)
          .select('area_name, bedroom_bucket, average_price, sample_size, currency_code, year'),
        lookup
      ).eq('year', latestMarketYear);

      if (tableResult.error) throw tableResult.error;

      var tableRows = normalizeTableRows(tableResult.data, lookup, latestMarketYear);
      if (!tableRows.length) return { status: 'no-data' };

      var areaName = tableRows[0].area_name.trim();
      elements.areaSummary.textContent = 'Average price of properties in ' + areaName;
      renderPriceTable(tableRows, lookup.currencyCode, elements);

      var currentBedroomRow = tableRows.find(function (row) {
        return row.bedroom_bucket === lookup.bedroomBucket;
      }) || null;

      if (!currentBedroomRow) {
        elements.section.hidden = false;
        return {
          status: 'table-only',
          latestMarketYear: latestMarketYear,
          tableRows: tableRows,
          trendRows: []
        };
      }

      var trendResult = await applyMarketFilters(
        supabase.from(MARKET_TABLE).select('year, average_price'),
        lookup
      ).eq('bedroom_bucket', lookup.bedroomBucket)
        .order('year', { ascending: true });

      if (trendResult.error) throw trendResult.error;

      var trendRows = normalizeTrendRows(trendResult.data);
      if (trendRows.length >= 2) {
        renderTrendSummary(lookup, areaName, currentBedroomRow, elements);
        renderTrendChart(trendRows, lookup, areaName, elements);
        elements.trends.hidden = false;
      }

      elements.section.hidden = false;

      return {
        status: trendRows.length >= 2 ? 'complete' : 'table-only',
        latestMarketYear: latestMarketYear,
        tableRows: tableRows,
        trendRows: trendRows
      };
    } catch (error) {
      resetMarketInsights();
      console.warn('Market Insights could not be loaded.', error);
      return { status: 'error' };
    }
  }

  root.HilltopMarketInsights = Object.freeze({
    normalizeAreaKey: normalizeAreaKey,
    resolveMarketArea: resolveMarketArea,
    getBedroomBucket: getBedroomBucket,
    isMarketInsightsEligible: isMarketInsightsEligible,
    buildMarketLookup: buildMarketLookup,
    getBedroomBucketLabel: getBedroomBucketLabel,
    loadForProperty: loadForProperty
  });
}(typeof window !== 'undefined' ? window : globalThis));
