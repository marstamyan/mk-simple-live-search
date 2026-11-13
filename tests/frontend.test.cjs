const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/mk-simple-live-search.js'), 'utf8');

// A small DOM boundary keeps these race-condition tests independent of browser packages.
function harness(count = 1) {
  const document = { readyState: 'complete', activeElement: null, listeners: {} };
  class Element {
    constructor(tag, className = '') {
      this.tagName = tag;
      this.className = className;
      this.children = [];
      this.dataset = {};
      this.attributes = {};
      this.listeners = {};
      this.textContent = '';
      this.value = '';
      this.classList = { toggle() {} };
    }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this.attributes[name] = value; }
    addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
    emit(name, event = {}) {
      event.preventDefault ||= () => {};
      (this.listeners[name] || []).forEach((callback) => callback(event));
    }
    contains(target) { return this === target || this.children.some((child) => child.contains(target)); }
    querySelectorAll(selector) {
      return this.children.flatMap((child) => {
        const matches = selector.startsWith('.')
          ? child.className.split(' ').includes(selector.slice(1))
          : child.tagName === selector;
        return [...(matches ? [child] : []), ...child.querySelectorAll(selector)];
      });
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() {
      if (document.activeElement !== this) {
        document.activeElement = this;
        this.emit('focus');
      }
    }
  }
  const roots = Array.from({ length: count }, () => {
    const root = new Element('div', 'mk-simple-live-search');
    const input = root.appendChild(new Element('input', 'mk-simple-live-search-input'));
    input.dataset = { postsPerPage: '5', searchIn: 'title', postType: 'post,page' };
    const results = root.appendChild(new Element('div', 'mk-simple-live-search-results'));
    const status = root.appendChild(new Element('span', 'mk-simple-live-search-status'));
    return { root, input, results, status };
  });
  document.querySelectorAll = () => roots.map(({ root }) => root);
  document.createElement = (tag) => new Element(tag);
  document.addEventListener = (name, callback) => (document.listeners[name] ||= []).push(callback);
  const timers = new Map();
  const requests = [];
  let timerId = 0;
  vm.runInNewContext(source, {
    document,
    window: {
      location: { href: 'https://example.test/demo/' },
      mkSimpleLiveSearch: { ajax_url: 'https://example.test/?rest_route=/mk-simple/v1/search' },
    },
    URL, AbortController,
    setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) {
      return new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
    },
  });
  return {
    roots, document, requests, timers,
    type(value, index = 0) { roots[index].input.value = value; roots[index].input.emit('input'); },
    tick() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach((callback) => callback()); },
    async respond(index, data, ok = true) {
      requests[index].resolve({ ok, json: async () => data });
      await new Promise(setImmediate);
    },
    outsideClick() { (document.listeners.click || []).forEach((callback) => callback({ target: new Element('button') })); },
  };
}

test('debounce is cancelled immediately when query becomes too short', () => {
  const app = harness();
  app.type('wordpress');
  app.type('wo');
  app.tick();
  assert.equal(app.requests.length, 0);
  assert.equal(app.roots[0].results.hidden, true);
});

test('late old response cannot overwrite a newer query, even when abort is ignored', async () => {
  const app = harness();
  app.type('older'); app.tick();
  app.type('newer'); app.tick();
  assert.equal(app.requests[0].options.signal.aborted, true);
  await app.respond(1, [{ title: 'New result', url: '/new/' }]);
  await app.respond(0, [{ title: 'Old result', url: '/old/' }]);
  assert.equal(app.roots[0].results.querySelector('a').textContent, 'New result');
  assert.equal(app.roots[0].results.attributes['aria-busy'], 'false');
});

test('plain permalink endpoint preserves rest_route and encodes search data', () => {
  const app = harness();
  app.type('A & B'); app.tick();
  const url = new URL(app.requests[0].url);
  assert.equal(url.searchParams.get('rest_route'), '/mk-simple/v1/search');
  assert.equal(url.searchParams.get('query'), 'A & B');
  assert.equal(url.searchParams.get('post_type'), 'post,page');
  assert.equal(url.searchParams.get('posts_per_page'), '5');
});

test('each shortcode has independent query, request and results state', async () => {
  const app = harness(2);
  app.type('first', 0); app.type('second', 1); app.tick();
  await app.respond(1, [{ title: 'Second', url: '/second/' }]);
  await app.respond(0, [{ title: 'First', url: '/first/' }]);
  assert.equal(app.roots[0].results.querySelector('a').textContent, 'First');
  assert.equal(app.roots[1].results.querySelector('a').textContent, 'Second');
});

test('HTTP and malformed responses show errors rather than empty-search messages', async () => {
  const app = harness();
  app.type('query'); app.tick();
  await app.respond(0, { code: 'rest_error' }, false);
  assert.equal(app.roots[0].results.children[0].className, 'mk-simple-error');
  app.type('again'); app.tick();
  await app.respond(1, { unexpected: true });
  assert.equal(app.roots[0].results.children[0].className, 'mk-simple-error');
});

test('outside dismissal prevents a pending response from reopening results', async () => {
  const app = harness();
  app.type('query'); app.tick();
  app.outsideClick();
  await app.respond(0, [{ title: 'Late', url: '/late/' }]);
  assert.equal(app.roots[0].results.hidden, true);
  assert.equal(app.roots[0].status.textContent, '');
});

test('refocusing after dismissing loading starts a new request instead of restoring loading forever', async () => {
  const app = harness();
  const { input, results } = app.roots[0];
  input.focus();
  app.type('query'); app.tick();
  assert.equal(results.children[0].className, 'mk-simple-loading');
  app.outsideClick();
  assert.equal(results.children.length, 0);
  app.document.activeElement = null;
  input.focus(); app.tick();
  assert.equal(app.requests.length, 2);
  await app.respond(1, [{ title: 'Retried result', url: '/retry/' }]);
  await app.respond(0, [{ title: 'Cancelled result', url: '/cancelled/' }]);
  assert.equal(results.querySelector('a').textContent, 'Retried result');
});

test('result links reject unsafe schemes, preserve text, and support keyboard navigation', async () => {
  const app = harness();
  const { input, root, results } = app.roots[0];
  input.focus();
  app.type('query'); app.tick();
  await app.respond(0, [
    { title: 'Unsafe', url: 'javascript:alert(1)' },
    { title: '<img src=x onerror=alert(1)>', url: '/safe/' },
    { title: '', url: '/untitled/' },
  ]);
  const links = results.querySelectorAll('a');
  assert.equal(links.length, 2);
  assert.equal(links[0].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(links[1].textContent, '(Untitled)');
  root.emit('keydown', { key: 'ArrowDown' });
  assert.equal(app.document.activeElement, links[0]);
  root.emit('keydown', { key: 'ArrowDown' });
  assert.equal(app.document.activeElement, links[1]);
  root.emit('keydown', { key: 'Escape' });
  assert.equal(app.document.activeElement, input);
  assert.equal(results.hidden, true);
});

test('composition waits until input is committed, and empty results announce status', async () => {
  const app = harness();
  app.roots[0].input.emit('compositionstart');
  app.type('日本語'); app.tick();
  assert.equal(app.requests.length, 0);
  app.roots[0].input.emit('compositionend'); app.tick();
  await app.respond(0, []);
  assert.equal(app.roots[0].status.textContent, 'Nothing found.');
  assert.equal(app.roots[0].results.hidden, false);
});
