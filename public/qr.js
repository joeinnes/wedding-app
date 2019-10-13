const urlParams = new URLSearchParams(window.location.search)
const code = urlParams.get("code")

const typeNumber = 0
const errorCorrectionLevel = "L"
const qr = qrcode(typeNumber, errorCorrectionLevel)
qr.addData(code)
qr.make()

document.querySelector("#qrcode").innerHTML = qr.createImgTag(8)
