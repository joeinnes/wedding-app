document.querySelector("#scancode").addEventListener("click", enableScanner)
document.querySelector("#submitlogin").addEventListener("click", submitLogin)

function enableScanner() {
  let scanner = new Instascan.Scanner({
    mirror: false
  })
  scanner.addListener("scan", function(content) {
    window.location.href = `/send-token?email=${content}`
  })

  Instascan.Camera.getCameras()
    .then(function(cameras) {
      if (cameras.length > 0) {
        scanner.start(cameras[cameras.length - 1])
      } else {
        console.error("No cameras found.")
      }
    })
    .catch(function(e) {
      console.error(e)
    })
}

function submitLogin() {
  const email = document.querySelector("#email").value
  window.location.href = `/send-token?email=${email}`
}
