(function () {
  'use strict';

  function stylesheetBase() {
    var link = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (!link) return './';
    return link.getAttribute('href').replace(/styles\.css(\?.*)?$/, '');
  }

  function isSubjectOnlyDeployment() {
    var path = decodeURIComponent(window.location.pathname).replace(/\\/g, '/');
    if (/\/Interview-Preparations\//.test(path) || /\/Engineering-Knowledge-Base\//.test(path)) {
      return false;
    }
    return /\/AI Engineer\/(learn|interview|research)\//.test(path);
  }

  function siteRootPrefix() {
    var base = stylesheetBase();
    // Over HTTP(S) the stylesheet's relative path already points at the site root,
    // so only adjust it for subject-only file:// browsing. (Adjusting it over HTTP
    // made search request AI Engineer/assets/search-index.js, which does not exist.)
    if (window.location.protocol === 'file:' && isSubjectOnlyDeployment() && (base.match(/\.\.\//g) || []).length >= 3) {
      return base.replace(/^\.\.\//, '');
    }
    return base;
  }

  function stripRelativePrefix(href) {
    var rest = href;
    while (rest.indexOf('../') === 0) {
      rest = rest.slice(3);
    }
    while (rest.indexOf('./') === 0) {
      rest = rest.slice(2);
    }
    return rest;
  }

  window.__EK_SITE_ROOT__ = siteRootPrefix;

  // Only rewrite links when browsing via file:// protocol.
  // When served over HTTP/HTTPS (Vercel, GitHub Pages, local server, etc.)
  // all relative paths in the HTML files are already correct.
  if (window.location.protocol !== 'file:') {
    return;
  }

  function fixNavigationLinks() {
    var base = siteRootPrefix();

    // Only rewrite anchor links in subject-only file:// deployments
    if (isSubjectOnlyDeployment()) {
      document.querySelectorAll('a[href]').forEach(function (anchor) {
        var href = anchor.getAttribute('href');
        if (!href || /^(https?:|mailto:|#)/.test(href)) {
          return;
        }
        if (href.indexOf('../') === 0 || href.indexOf('./') === 0) {
          anchor.setAttribute('href', base + stripRelativePrefix(href));
        }
      });

      document.querySelectorAll('link[rel="stylesheet"][href*="styles.css"]').forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.indexOf('../') === 0) {
          link.setAttribute('href', base + 'styles.css');
        }
      });

      document.querySelectorAll('link[rel="icon"][href*="assets/"]').forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && href.indexOf('../') === 0) {
          link.setAttribute('href', base + stripRelativePrefix(href));
        }
      });

      document.querySelectorAll('script[src*="assets/"]').forEach(function (script) {
        var src = script.getAttribute('src');
        if (src && src.indexOf('../') === 0) {
          script.setAttribute('src', base + stripRelativePrefix(src));
        }
      });
    }
  }

  if (document.body) {
    fixNavigationLinks();
  } else {
    document.addEventListener('DOMContentLoaded', fixNavigationLinks);
  }
})();

// Copy buttons for code blocks on learn pages. Works over http(s) and file://.
(function () {
  'use strict';

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for file:// and older browsers
    return new Promise(function (resolve, reject) {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand('copy') ? resolve() : reject(new Error('copy failed'));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function addCopyButtons() {
    document.querySelectorAll('.learn-page pre').forEach(function (pre) {
      if (pre.parentNode && pre.parentNode.classList && pre.parentNode.classList.contains('code-block')) {
        return;
      }
      var code = pre.querySelector('code') || pre;
      var wrapper = document.createElement('div');
      wrapper.className = 'code-block';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy';
      button.textContent = 'Copy';
      button.setAttribute('aria-label', 'Copy code to clipboard');
      button.addEventListener('click', function () {
        copyText(code.innerText.replace(/\n$/, '')).then(function () {
          button.textContent = 'Copied';
        }, function () {
          button.textContent = 'Press Ctrl+C';
        });
        setTimeout(function () { button.textContent = 'Copy'; }, 1600);
      });
      wrapper.appendChild(button);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addCopyButtons);
  } else {
    addCopyButtons();
  }
})();

// Inline MathJax formulas wider than their paragraph (common on phones) get the
// "math-wide" class (see styles.css), so they scroll sideways inside their own box
// instead of widening the whole page. Works with both the CHTML and SVG MathJax builds.
(function () {
  'use strict';

  function markWideMath(root) {
    (root || document).querySelectorAll('mjx-container:not([display="true"])').forEach(function (c) {
      var parent = c.parentElement;
      if (!parent) return;
      c.classList.remove('math-wide');
      if (c.getBoundingClientRect().width > parent.clientWidth + 1) {
        c.classList.add('math-wide');
      }
    });
  }

  function whenTypeset() {
    var mj = window.MathJax;
    if (!mj || !mj.startup || !mj.startup.promise) return;
    mj.startup.promise.then(function () {
      markWideMath();
      var timer;
      window.addEventListener('resize', function () {
        clearTimeout(timer);
        timer = setTimeout(function () { markWideMath(); }, 150);
      });
      document.querySelectorAll('details').forEach(function (el) {
        el.addEventListener('toggle', function () {
          // details content is typeset lazily when opened
          setTimeout(function () { markWideMath(el); }, 300);
        });
      });
    });
  }

  if (document.readyState === 'complete') {
    whenTypeset();
  } else {
    window.addEventListener('load', whenTypeset);
  }
})();

// Learn pages: a "#" link next to each section heading (so a reader can copy a
// direct link to that section), and a "Back to top" button on long pages.
(function () {
  'use strict';

  function addHeadingAnchors() {
    document.querySelectorAll('.learn-page main section[id] > h2').forEach(function (h) {
      if (h.querySelector('.heading-anchor')) return;
      var id = h.parentElement.id;
      var a = document.createElement('a');
      a.className = 'heading-anchor';
      a.href = '#' + id;
      a.textContent = '#';
      a.setAttribute('aria-label', 'Link to this section: ' + h.textContent.trim());
      h.appendChild(a);
    });
  }

  function addBackToTop() {
    if (!document.body.classList.contains('learn-page')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top';
    btn.textContent = '\u2191 Top';
    btn.setAttribute('aria-label', 'Back to top of page');
    btn.hidden = true;
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    var ticking = false;
    function update() {
      btn.hidden = window.scrollY < window.innerHeight * 1.5;
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function init() {
    addHeadingAnchors();
    addBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Long learn articles: "About N min read" under the intro, and a thin progress bar
// at the top of the window that fills as the reader scrolls through the article.
(function () {
  'use strict';

  var WORDS_PER_MINUTE = 200;

  function addReadingTime(article) {
    var header = document.querySelector('.learn-page > header');
    if (!header || header.querySelector('.reading-time')) return;
    var words = (article.innerText || article.textContent || '').trim().split(/\s+/).length;
    var minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
    var p = document.createElement('p');
    p.className = 'reading-time';
    p.textContent = 'About ' + minutes + ' min read';
    header.appendChild(p);
  }

  function addProgressBar(article) {
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function update() {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.style.transform = 'scaleX(' + done + ')';
      ticking = false;
    }
    function request() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  function init() {
    var article = document.querySelector('.learn-page main.article');
    if (!article) return;
    addReadingTime(article);
    addProgressBar(article);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Keyboard and screen-reader users: a "Skip to main content" link that is the
// first thing Tab reaches on every page. It stays hidden until it gets focus
// (see .skip-link in styles.css), then jumps past the breadcrumb, search box and
// table of contents straight to the page's <main>.
(function () {
  'use strict';

  function addSkipLink() {
    var main = document.querySelector('main');
    if (!main || document.querySelector('.skip-link')) return;
    if (!main.id) main.id = 'main-content';
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    var link = document.createElement('a');
    link.className = 'skip-link';
    link.href = '#' + main.id;
    link.textContent = 'Skip to main content';
    link.addEventListener('click', function (e) {
      e.preventDefault();
      main.focus({ preventScroll: true });
      main.scrollIntoView();
      if (history.replaceState) history.replaceState(null, '', '#' + main.id);
    });
    document.body.insertBefore(link, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addSkipLink);
  } else {
    addSkipLink();
  }
})();
