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
