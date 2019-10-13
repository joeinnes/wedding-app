let showMenuExpanded = true
document.querySelector("#menu-button").addEventListener("click", toggleMenu)
document.querySelectorAll(".lang-selector").forEach(el => {
  el.addEventListener("click", setLanguage)
})
const margin =
  window.getComputedStyle(document.querySelector("#menu-button").parentNode)
    .display === "none"
    ? 16
    : 0

async function setLanguage(e) {
  const lang = e.target.id
  await fetch("/set-lang/" + lang)
  location.reload()
  return
}

function toggleMenu() {
  const element = document.querySelector("#menu-items")
  if (!element.style.height || element.style.height == "0px") {
    element.style.height =
      Array.prototype.reduce.call(
        element.childNodes,
        (p, c) => p + (c.offsetHeight || 0),
        0
      ) +
      16 +
      "px"
  } else {
    element.style.height = "0px"
  }
}

toggleMenu()
