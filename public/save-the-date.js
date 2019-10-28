document.querySelector("#submit-save-the-date").addEventListener("click", async e => {
  e.preventDefault()
  const formData = new FormData(document.querySelector("#address-form"))
  try {
    const result = await fetch("/set-address", {
      method: "POST",
      body: formData
    })
    alert('Done!')
    // window.location.href = ""
  } catch (e) {
    console.error(e)
  }
})
