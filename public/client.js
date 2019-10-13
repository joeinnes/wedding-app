try {
  const scanbutton = document.querySelector("#scancode")
  if (scanbutton) {
    scanbutton.addEventListener("click", enableScanner)
  }
} catch (e) {
  console.log(e)
}

function enableScanner() {
  let scanner = new Instascan.Scanner({
    video: document.getElementById("preview")
  })
  scanner.addListener("scan", function(content) {
    document.querySelector("#data").innerText = content
    // send email
  })

  Instascan.Camera.getCameras()
    .then(function(cameras) {
      if (cameras.length > 0) {
        scanner.start(cameras[0])
      } else {
        console.error("No cameras found.")
      }
    })
    .catch(function(e) {
      console.error(e)
    })
}
