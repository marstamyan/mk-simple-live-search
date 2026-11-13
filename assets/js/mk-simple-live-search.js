(function () {
  "use strict";

  const config = window.mkSimpleLiveSearch;
  if (!config || !config.ajax_url) return;

  const strings = Object.assign({
    loading: "Searching…",
    noResults: "Nothing found.",
    error: "Search is unavailable. Please try again.",
    resultCount: "%d results found.",
    untitled: "(Untitled)",
  }, config.strings || {});

  function initialize() {
    document.querySelectorAll(".mk-simple-live-search").forEach((root) => {
      if (root.dataset.mkSearchInitialized) return;

      const input = root.querySelector(".mk-simple-live-search-input");
      const results = root.querySelector(".mk-simple-live-search-results");
      const status = root.querySelector(".mk-simple-live-search-status");
      if (!input || !results || !status) return;
      root.dataset.mkSearchInitialized = "true";
      const hint = status.textContent;

      let timer;
      let controller;
      let sequence = 0;
      let composing = false;

      function setOpen(open) {
        results.hidden = !open;
        results.classList.toggle("active", open);
      }

      function cancelPending() {
        clearTimeout(timer);
        sequence += 1;
        if (controller) controller.abort();
        controller = null;
        results.setAttribute("aria-busy", "false");
      }

      function dismiss() {
        cancelPending();
        // A dismissed loading message is not a completed result to reuse on focus.
        results.replaceChildren();
        setOpen(false);
        status.textContent = "";
      }

      function message(text, className) {
        const element = document.createElement("div");
        element.className = className;
        element.textContent = text;
        results.replaceChildren(element);
        status.textContent = text;
        setOpen(true);
      }

      async function search(query, requestSequence) {
        controller = new AbortController();
        results.setAttribute("aria-busy", "true");
        message(strings.loading, "mk-simple-loading");

        try {
          const url = new URL(config.ajax_url, window.location.href);
          url.searchParams.set("query", query);
          url.searchParams.set("posts_per_page", input.dataset.postsPerPage || "10");
          url.searchParams.set("search_in", input.dataset.searchIn || "both");
          url.searchParams.set("post_type", input.dataset.postType || "post,page");
          const response = await fetch(url.toString(), { signal: controller.signal });
          if (!response.ok) throw new Error("Search request failed");
          const data = await response.json();
          if (requestSequence !== sequence) return;
          if (!Array.isArray(data)) throw new Error("Invalid search response");

          const list = document.createElement("ul");
          list.className = "mk-simple-results-list";
          data.forEach((post) => {
            if (!post || typeof post.url !== "string" || typeof post.title !== "string") return;
            let linkUrl;
            try {
              linkUrl = new URL(post.url, window.location.href);
            } catch (error) {
              return;
            }
            if (linkUrl.protocol !== "https:" && linkUrl.protocol !== "http:") return;

            const item = document.createElement("li");
            item.className = "mk-simple-result-item";
            const link = document.createElement("a");
            link.className = "mk-simple-result-link";
            link.href = linkUrl.href;
            link.textContent = post.title || strings.untitled;
            item.appendChild(link);
            list.appendChild(item);
          });

          if (!list.children.length) {
            message(strings.noResults, "mk-simple-no-results");
          } else {
            results.replaceChildren(list);
            status.textContent = strings.resultCount.replace("%d", String(list.children.length));
            setOpen(true);
          }
        } catch (error) {
          if (requestSequence !== sequence || error.name === "AbortError") return;
          message(strings.error, "mk-simple-error");
        } finally {
          if (requestSequence === sequence) {
            controller = null;
            results.setAttribute("aria-busy", "false");
          }
        }
      }

      function scheduleSearch() {
        cancelPending();
        results.replaceChildren();
        setOpen(false);
        status.textContent = "";
        const query = input.value.trim();
        if (composing) return;
        if (Array.from(query).length < 3) {
          status.textContent = hint;
          return;
        }
        const requestSequence = sequence;
        timer = setTimeout(() => search(query, requestSequence), 350);
      }

      input.addEventListener("input", scheduleSearch);
      input.addEventListener("compositionstart", () => {
        composing = true;
        dismiss();
      });
      input.addEventListener("compositionend", () => {
        composing = false;
        scheduleSearch();
      });
      input.addEventListener("focus", () => {
        if (results.children.length) setOpen(true);
        else scheduleSearch();
      });

      root.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          // Focus first: its focus handler may reopen results, then dismiss them.
          input.focus();
          dismiss();
          return;
        }
        if (results.hidden || (event.key !== "ArrowDown" && event.key !== "ArrowUp")) return;
        const links = Array.from(results.querySelectorAll("a"));
        if (!links.length) return;
        const current = links.indexOf(document.activeElement);
        let next = event.key === "ArrowDown" ? current + 1 : current - 1;
        if (document.activeElement === input) next = event.key === "ArrowDown" ? 0 : links.length - 1;
        event.preventDefault();
        if (next < 0 || next >= links.length) input.focus();
        else links[next].focus();
      });

      root.addEventListener("focusout", (event) => {
        if (!root.contains(event.relatedTarget)) dismiss();
      });
      document.addEventListener("click", (event) => {
        if (!root.contains(event.target)) dismiss();
      });
      setOpen(false);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
