document.addEventListener("DOMContentLoaded", () => {
  const inputField = document.getElementById("mk-simple-live-search-input")
  const resultsContainer = document.getElementById(
    "mk-simple-live-search-results",
  )

  if (!inputField || !resultsContainer) return

  let debounceTimer

  inputField.addEventListener("input", () => {
    const searchQuery = inputField.value.trim()

    if (searchQuery.length < 3) {
      resultsContainer.innerHTML = ""
      resultsContainer.classList.remove("active")
      return
    }

    const postsPerPage =
      parseInt(inputField.getAttribute("data-posts-per-page"), 10) || 10
    const searchIn = inputField.getAttribute("data-search-in") || "both"
    const postType = inputField.getAttribute("data-post-type") || "post,page"

    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      const url = `${mkSimpleLiveSearch.ajax_url}?query=${encodeURIComponent(
        searchQuery,
      )}&posts_per_page=${postsPerPage}&search_in=${searchIn}&post_type=${postType}`

      fetch(url, { method: "GET" })
        .then((response) => response.json())
        .then((data) => {
          if (inputField.value.trim().length < 3) {
            resultsContainer.innerHTML = ""
            resultsContainer.classList.remove("active")
            return
          }

          resultsContainer.innerHTML = ""

          if (!Array.isArray(data) || data.length === 0) {
            resultsContainer.innerHTML =
              '<div class="mk-simple-no-results">Nothing found</div>'
            resultsContainer.classList.add("active")
            return
          }

          const resultList = document.createElement("ul")
          resultList.classList.add("mk-simple-results-list")

          data.forEach((post) => {
            if (!post.url || !post.title) return

            const listItem = document.createElement("li")
            listItem.classList.add("mk-simple-result-item")

            const link = document.createElement("a")
            link.href = post.url
            link.textContent = post.title
            link.classList.add("mk-simple-result-link")

            listItem.appendChild(link)
            resultList.appendChild(listItem)
          })

          resultsContainer.appendChild(resultList)
          resultsContainer.classList.add("active")
        })
        .catch((error) => {
          console.error("Error:", error)
          resultsContainer.innerHTML =
            '<div class="mk-simple-error">Error occurred while searching.</div>'
          resultsContainer.classList.add("active")
        })
    }, 500)
  })

  document.addEventListener("click", (event) => {
    if (
      !resultsContainer.contains(event.target) &&
      event.target !== inputField
    ) {
      resultsContainer.classList.remove("active")
    }
  })
})
