document.querySelector(".burger").addEventListener('click', e => {
  const selector = e.target.getAttribute("data-target")
  console.log(selector)
  document.querySelector(`#${selector}`).classList.toggle("is-active")
})

document.querySelectorAll(".lang-selector").forEach(el => {
  el.addEventListener("click", setLanguage)
})

async function setLanguage(e) {
  const lang = e.target.id
  await fetch("/set-lang/" + lang)
  location.reload()
  return
}