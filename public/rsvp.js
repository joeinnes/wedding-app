document.querySelector("#submit-rsvp").addEventListener("click", (e) => {
  const resp = document.querySelector("input[name=rsvp]:checked").id
  if (resp === 'rsvp-yes') {
    window.location.href = "/rsvp/yes"
  } else if (resp === 'rsvp-no') {
    window.location.href = "/rsvp/no"
  } else {
    alert("Please pick an option!")
  }
})
