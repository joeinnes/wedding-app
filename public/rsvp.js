document.querySelector("#submit-rsvp").addEventListener("click", e => {
  const formData = new FormData(document.querySelector("#rsvp-form"))
  for (var pair of formData.entries()) {
    console.log(pair[0] + ", " + pair[1])
  }
  fetch('/rsvp', {
    method: 'POST',
    body: formData
  })
})
