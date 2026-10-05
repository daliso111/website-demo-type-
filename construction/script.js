/* =========================================================
   HILLTOP CONSTRUCTION - SCRIPT
   Minimal JS: only handles the mobile navigation toggle.
   Add future interactivity (form handling, filters, etc.)
   below in clearly separated sections.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  // ---------- Mobile navigation toggle ----------
  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close the mobile menu after a nav link is clicked
    var navLinks = mainNav.querySelectorAll('a');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ---------- Our Expertise pinned scroll story ----------
  var expertise = document.querySelector('.expertise-scroll');

  if (expertise) {
    var sectionLabel = 'OUR EXPERTISE';
    var slides = [
      { heading: 'Building Construction', text: 'From foundations to finishes, Hilltop Construction delivers reliable building construction with careful planning, skilled coordination, and a focus on long-term value.', cta: 'Explore building work', ctaUrl:'#projects', image: '/construction/assets/expertise-building.png', alt: 'Commercial building structure under construction', focalX:50, focalY:50, overlayOpacity:.45 },
      { heading: 'Renovations & Extensions', text: 'We upgrade and extend existing spaces with practical solutions, safe execution, and attention to detail that respects both structure and use.', cta: 'Explore renovations', ctaUrl:'#projects', image: '/construction/assets/expertise-renovations.png', alt: 'Contemporary extension being added to an existing building', focalX:50, focalY:50, overlayOpacity:.45 },
      { heading: 'Civil Works', text: 'From site preparation to roadworks and drainage, Hilltop Construction delivers civil works with durability, coordination, and regulatory care.', cta: 'Explore civil works', ctaUrl:'#projects', image: '/construction/assets/expertise-civil.png', alt: 'Road and drainage civil works in progress', focalX:50, focalY:50, overlayOpacity:.45 },
      { heading: 'Project Management', text: 'We manage timelines, budgets, teams, and subcontractors with clear communication from planning through completion.', cta: 'Explore management', ctaUrl:'#projects', image: '/construction/assets/expertise-management.png', alt: 'Project management team reviewing plans on a construction site', focalX:50, focalY:50, overlayOpacity:.45 }
    ];
    var image = expertise.querySelector('.expertise-scroll__image');
    var overlay = expertise.querySelector('.expertise-scroll__overlay');
    var heading = expertise.querySelector('.expertise-scroll__heading');
    var text = expertise.querySelector('.expertise-scroll__text');
    var eyebrow = expertise.querySelector('.expertise-scroll__eyebrow');
    var eyebrowLabel = eyebrow ? eyebrow.firstChild : null;
    var link = expertise.querySelector('.expertise-scroll__link');
    var linkText = expertise.querySelector('.expertise-scroll__link-text');
    var counter = expertise.querySelector('.expertise-scroll__eyebrow span');
    var progressBar = expertise.querySelector('.expertise-scroll__progress span');
    var mobile = expertise.querySelector('.expertise-scroll__mobile');
    var activeIndex = 0;
    var changeTimer;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function syncReducedMotion() {
      expertise.classList.toggle('expertise-scroll--reduced-motion',reducedMotion.matches);
    }
    syncReducedMotion();
    reducedMotion.addEventListener('change',syncReducedMotion);

    function overlayGradient(value) {
      var strength = Math.max(0, Math.min(1, Number(value) || 0));
      return 'linear-gradient(180deg, rgba(7,31,61,' + (strength * .4).toFixed(3) + ') 0%, rgba(7,31,61,' + (strength * .8).toFixed(3) + ') 45%, rgba(7,31,61,' + Math.min(1, strength * 1.5).toFixed(3) + ') 100%)';
    }

    function slideLabel(slide) {
      return slide.eyebrow || sectionLabel;
    }

    function renderMobileSlides() {
      mobile.replaceChildren();
      slides.forEach(function (slide, index) {
        var article = document.createElement('article');
        article.className = 'expertise-card';
        var mobileImage = document.createElement('img');
        mobileImage.className = 'expertise-card__image';
        mobileImage.src = slide.image;
        mobileImage.alt = slide.alt;
        mobileImage.loading = 'lazy';
        mobileImage.style.objectPosition = slide.focalX + '% ' + slide.focalY + '%';
        var mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'expertise-card__overlay';
        mobileOverlay.style.background = overlayGradient(slide.overlayOpacity);
        var content = document.createElement('div');
        content.className = 'expertise-card__content';
        var number = document.createElement('p');
        number.className = 'expertise-card__number';
        number.textContent = slideLabel(slide) + '   ' + String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        var mobileHeading = document.createElement('h2');
        mobileHeading.textContent = slide.heading;
        var description = document.createElement('p');
        description.textContent = slide.text;
        content.append(number,mobileHeading,description);
        if (slide.cta && slide.ctaUrl) {
          var mobileLink = document.createElement('a');
          mobileLink.className = 'expertise-scroll__link';
          mobileLink.href = slide.ctaUrl;
          var mobileLinkText = document.createElement('span');
          mobileLinkText.className = 'expertise-scroll__link-text';
          mobileLinkText.textContent = slide.cta;
          var arrow = document.createElement('img');
          arrow.src = '/construction/assets/right-arrow-green.svg';
          arrow.alt = '';
          arrow.setAttribute('aria-hidden','true');
          mobileLink.append(mobileLinkText,arrow);
          content.append(mobileLink);
        }
        article.append(mobileImage,mobileOverlay,content);
        mobile.append(article);
      });
    }

    renderMobileSlides();

    function applySlide(index) {
      var slide = slides[index];
      image.src = slide.image;
      image.alt = slide.alt;
      image.style.objectPosition = slide.focalX + '% ' + slide.focalY + '%';
      overlay.style.background = overlayGradient(slide.overlayOpacity);
      heading.textContent = slide.heading;
      text.textContent = slide.text;
      if (eyebrowLabel) eyebrowLabel.nodeValue = slideLabel(slide) + ' ';
      linkText.textContent = slide.cta || '';
      link.href = slide.ctaUrl || '#projects';
      link.hidden = !(slide.cta && slide.ctaUrl);
      counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      progressBar.style.width = ((index + 1) / slides.length * 100) + '%';
      expertise.classList.remove('is-changing');
    }

    function showSlide(index, force) {
      if (!force && index === activeIndex) return;
      activeIndex = index;
      expertise.classList.add('is-changing');
      window.clearTimeout(changeTimer);
      changeTimer = window.setTimeout(function () {
        applySlide(index);
      }, reducedMotion.matches ? 0 : 220);
    }

    function updateExpertise() {
      if (window.innerWidth <= 640 || reducedMotion.matches) return;
      if (slides.length<=1) { showSlide(0); return; }
      var rect = expertise.getBoundingClientRect();
      var scrollable = Math.max(1,expertise.offsetHeight - window.innerHeight);
      var progress = Math.max(0, Math.min(0.9999, -rect.top / scrollable));
      showSlide(Math.floor(progress * slides.length));
    }

    document.addEventListener('hilltop:expertise-slides', function (event) {
      var detail = event.detail || {};
      if (!detail.settings || !Array.isArray(detail.slides) || !detail.slides.length) return;
      sectionLabel = detail.settings.sectionLabel || 'OUR EXPERTISE';
      slides = detail.slides.map(function (slide) {
        return {
          eyebrow: slide.eyebrow || '',
          heading: slide.heading,
          text: slide.description,
          cta: slide.ctaLabel || '',
          ctaUrl: slide.ctaUrl || '',
          image: slide.image,
          alt: slide.imageAlt,
          focalX: Number(slide.focalX ?? 50),
          focalY: Number(slide.focalY ?? 50),
          overlayOpacity: Number(slide.overlayOpacity ?? .45)
        };
      });
      expertise.style.height = (slides.length * 100) + 'vh';
      activeIndex = -1;
      renderMobileSlides();
      showSlide(0,true);
      updateExpertise();
    });

    window.addEventListener('scroll', updateExpertise, { passive: true });
    window.addEventListener('resize', updateExpertise);
    showSlide(0,true);
    updateExpertise();
  }

  // ---------- Logo Bridge entrance ----------
  var logoBridge = document.querySelector('.logo-bridge');

  if (logoBridge && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    logoBridge.classList.add('logo-bridge--animate');
    var logoBridgeObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('logo-bridge--visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .18 });
    logoBridgeObserver.observe(logoBridge);
  }

  // ---------- Future functionality ----------
  // e.g. contact form validation, project filtering,
  // dynamic loading of projects/news from Supabase, etc.

  // ---------- Published Discovery Bridge ----------
  // Keep the hard-coded HTML visible as a safe fallback while this request runs.
  var discoveryBridge = document.querySelector('.discovery-bridge');

  if (discoveryBridge) {
    import('./shared/discovery-bridge-service.js')
      .then(function (service) { return service.getPublishedDiscoveryBridge(); })
      .then(function (record) {
        if (!record) return;
        var paragraph = discoveryBridge.querySelector('p');
        var button = discoveryBridge.querySelector('.discovery-button');
        if (paragraph) {
          paragraph.textContent = record.main_paragraph;
          paragraph.style.textAlign = record.text_alignment;
        }
        if (button) {
          button.textContent = record.button_label;
          button.href = record.button_url;
        }
        discoveryBridge.style.textAlign = record.text_alignment;
      })
      .catch(function (error) {
        console.info('Using the built-in Discovery Bridge fallback.', error.message);
      });
  }

});
