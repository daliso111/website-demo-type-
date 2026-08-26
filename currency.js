/* ============================================================
   HILLTOP PROPERTIES ZAMBIA - SHARED PROPERTY PRICE FORMATTING
   Supported listing currencies: ZMW and USD.
   ============================================================ */

(function (root) {
  'use strict';

  var SUPPORTED_CURRENCIES = Object.freeze(['ZMW', 'USD']);
  var CURRENCY_PREFIXES = Object.freeze({
    ZMW: 'K',
    USD: '$'
  });

  function isSupportedCurrency(value) {
    return SUPPORTED_CURRENCIES.indexOf(String(value || '').trim().toUpperCase()) !== -1;
  }

  function normalizeCurrencyCode(value) {
    var code = String(value || '').trim().toUpperCase();
    return isSupportedCurrency(code) ? code : 'ZMW';
  }

  function normalizeBillingPeriod(value) {
    var period = String(value || '').trim().toLowerCase();
    period = period.replace(/^\s*(?:\/|per)\s*/, '');

    var aliases = {
      daily: 'day',
      day: 'day',
      weekly: 'week',
      week: 'week',
      monthly: 'month',
      month: 'month',
      yearly: 'year',
      annually: 'year',
      annual: 'year',
      year: 'year'
    };

    return aliases[period] || 'month';
  }

  function parsePropertyPriceInput(value) {
    var raw = String(value == null ? '' : value).trim();

    if (!raw) {
      return { value: null, empty: true, invalid: false };
    }

    // Match the database numeric(14,2) shape without accepting symbols,
    // grouping commas, signs, exponent notation, or arbitrary text.
    if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(raw)) {
      return { value: null, empty: false, invalid: true };
    }

    var amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { value: null, empty: false, invalid: true };
    }

    return {
      value: Math.round(amount * 100) / 100,
      empty: false,
      invalid: false
    };
  }

  function formatPropertyPrice(price, currencyCode, purpose, billingPeriod) {
    var amount = Number(price);
    if (!Number.isFinite(amount)) amount = 0;

    var code = normalizeCurrencyCode(currencyCode);
    var formattedAmount = amount.toLocaleString('en-ZM', {
      minimumFractionDigits: 0,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2
    });
    var formatted = CURRENCY_PREFIXES[code] + formattedAmount;
    var isRental = /rent|lease/i.test(String(purpose || ''));

    return isRental
      ? formatted + ' / ' + normalizeBillingPeriod(billingPeriod)
      : formatted;
  }

  root.HilltopCurrency = Object.freeze({
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isSupportedCurrency: isSupportedCurrency,
    normalizeCurrencyCode: normalizeCurrencyCode,
    parsePropertyPriceInput: parsePropertyPriceInput,
    formatPropertyPrice: formatPropertyPrice
  });
}(typeof window !== 'undefined' ? window : globalThis));
