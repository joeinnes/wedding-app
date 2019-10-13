document.querySelector("#submit-rsvp").addEventListener("click", async e => {
  const formData = new FormData(document.querySelector("#rsvp-form"))
  for (var pair of formData.entries()) {
    console.log(pair[0] + ", " + pair[1])
  }
  try {
    const result = await fetch("/rsvp", {
      method: "POST",
      body: formData
    })
    window.location.href = "/rsvp"
  } catch (e) {
    console.error(e)
  }
})
