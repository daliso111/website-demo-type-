/* Related articles only; replace preview hrefs when full articles are published. */
(function () {
  'use strict';
  var section = document.getElementById('relatedPropertyArticles');
  if (!section) return;
  var track = section.querySelector('.article-carousel-track');
  var cards = Array.from(track.querySelectorAll('.editorial-card'));
  var previous = section.querySelector('[data-article-step="-1"]');
  var next = section.querySelector('[data-article-step="1"]');
  var status = section.querySelector('#articleCarouselStatus');
  var pendingIndex = null;
  var settleTimer;
  var settledIndex = 0;

  function positions() {
    var left = cards[0].getBoundingClientRect().left;
    var maximum = track.scrollWidth - track.clientWidth;
    return cards.map(function (card) {
      return Math.min(maximum, card.getBoundingClientRect().left - left);
    }).filter(function (position, index, stops) {
      // Several cards can map to the same final, fully contained pair.
      return index === 0 || position - stops[index - 1] > 1;
    });
  }
  function currentIndex() {
    var stops = positions();
    return stops.reduce(function (nearest, position, index) {
      return Math.abs(position - track.scrollLeft) < Math.abs(stops[nearest] - track.scrollLeft) ? index : nearest;
    }, 0);
  }
  function updateControls() {
    var index = pendingIndex === null ? currentIndex() : pendingIndex;
    previous.disabled = index === 0;
    next.disabled = index === positions().length - 1;
  }
  function goTo(index) {
    pendingIndex = Math.max(0, Math.min(positions().length - 1, index));
    settledIndex = pendingIndex;
    track.scrollTo({left: positions()[pendingIndex], behavior: 'auto'});
    updateControls();
  }
  section.querySelector('.article-carousel-controls').hidden = false;
  [previous, next].forEach(function (button) {
    button.addEventListener('click', function () {
      goTo((pendingIndex === null ? currentIndex() : pendingIndex) + Number(button.dataset.articleStep));
    });
  });
  track.addEventListener('scroll', function () {
    clearTimeout(settleTimer);
    updateControls();
    settleTimer = setTimeout(function () {
      pendingIndex = null;
      settledIndex = currentIndex();
      updateControls();
      status.textContent = 'Article ' + (currentIndex() + 1) + ' of ' + cards.length;
    }, 150);
  }, {passive: true});
  // Leave wheel and touch gestures native, including vertical page scrolling.
  ['wheel', 'pointerdown', 'touchstart'].forEach(function (eventName) {
    track.addEventListener(eventName, function () { pendingIndex = null; }, {passive: true});
  });
  track.addEventListener('keydown', function (event) {
    var index = pendingIndex === null ? currentIndex() : pendingIndex;
    if (event.key === 'ArrowLeft') index--;
    else if (event.key === 'ArrowRight') index++;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = cards.length - 1;
    else return;
    event.preventDefault();
    goTo(index);
  });
  new ResizeObserver(function () {
    // Preserve the selected article and align to a complete pair after resizing.
    settledIndex = Math.min(settledIndex, positions().length - 1);
    track.scrollTo({left: positions()[settledIndex], behavior: 'instant'});
    pendingIndex = null;
    updateControls();
  }).observe(track);
  updateControls();

  var dialog = section.querySelector('#articlePreviewDialog');
  var opener;
  track.addEventListener('click', function (event) {
    var link = event.target.closest('.editorial-card-link');
    if (!link || link.getAttribute('href') !== '#articlePreviewDialog') return;
    event.preventDefault();
    opener = link;
    dialog.querySelector('#articlePreviewTitle').textContent = link.querySelector('h3').textContent;
    dialog.querySelector('#articlePreviewDescription').textContent = link.querySelector('p').textContent;
    dialog.showModal();
  });
  dialog.querySelector('.dialog-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    var rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', function () { if (opener) opener.focus({preventScroll: true}); });
})();

