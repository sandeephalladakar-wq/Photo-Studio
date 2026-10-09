
const imageInput = document.getElementById("imageInput");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const uploadArea = document.getElementById("uploadArea");
const canvasWrap = document.getElementById("canvasWrap");

let photo = new Image();
let hasPhoto = false;
let rotation = 0;
let flipX = 1;
let flipY = 1;
let activeFilter = "Original";

const defaults = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0
};

function getValue(id) {
  return Number(document.getElementById(id).value);
}

function loadPhoto(file) {
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    alert("Please select a JPG, PNG, or WEBP image.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const newPhoto = new Image();

    newPhoto.onload = () => {
      photo = newPhoto;
      hasPhoto = true;
      rotation = 0;
      flipX = 1;
      flipY = 1;
      activeFilter = "Original";

      Object.entries(defaults).forEach(([id, value]) => {
        document.getElementById(id).value = value;
      });

      document.querySelectorAll(".filter").forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.filter === "Original"
        );
      });

      uploadArea.hidden = true;
      canvasWrap.hidden = false;
      renderPhoto();
    };

    newPhoto.onerror = () => alert("Could not open this image.");
    newPhoto.src = reader.result;
  };

  reader.onerror = () => alert("Could not read this file.");
  reader.readAsDataURL(file);
}

function renderPhoto() {
  if (!hasPhoto) return;

  const width = photo.naturalWidth;
  const height = photo.naturalHeight;
  const sideways = Math.abs(rotation % 180) === 90;

  canvas.width = sideways ? height : width;
  canvas.height = sideways ? width : height;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let brightness = getValue("brightness");
  let contrast = getValue("contrast");
  let saturation = getValue("saturation");
  const blur = getValue("blur");

  if (activeFilter === "Vintage") {
    brightness *= 1.04;
    contrast *= 0.92;
    saturation *= 0.65;
  } else if (activeFilter === "Mono") {
    saturation = 0;
  } else if (activeFilter === "Warm") {
    saturation *= 1.15;
    brightness *= 1.04;
  } else if (activeFilter === "Cool") {
    saturation *= 0.9;
    brightness *= 1.02;
  } else if (activeFilter === "Vivid") {
    saturation *= 1.65;
    contrast *= 1.12;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation * Math.PI / 180);
  ctx.scale(flipX, flipY);

  ctx.filter =
    `brightness(${brightness}%) ` +
    `contrast(${contrast}%) ` +
    `saturate(${saturation}%) ` +
    `blur(${blur}px)`;

  ctx.drawImage(photo, -width / 2, -height / 2);
  ctx.restore();

  document.getElementById("brightnessValue").textContent =
    getValue("brightness") + "%";
  document.getElementById("contrastValue").textContent =
    getValue("contrast") + "%";
  document.getElementById("saturationValue").textContent =
    getValue("saturation") + "%";
  document.getElementById("blurValue").textContent =
    getValue("blur") + "px";
}

imageInput.addEventListener("change", event => {
  loadPhoto(event.target.files[0]);
});

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;

    document.querySelectorAll(".filter").forEach(item => {
      item.classList.toggle("active", item === button);
    });

    renderPhoto();
  });
});

["brightness", "contrast", "saturation", "blur"].forEach(id => {
  document.getElementById(id).addEventListener("input", renderPhoto);
});

document.getElementById("rotateLeft").addEventListener("click", () => {
  rotation = (rotation - 90 + 360) % 360;
  renderPhoto();
});

document.getElementById("rotateRight").addEventListener("click", () => {
  rotation = (rotation + 90) % 360;
  renderPhoto();
});

document.getElementById("flipH").addEventListener("click", () => {
  flipX *= -1;
  renderPhoto();
});

document.getElementById("flipV").addEventListener("click", () => {
  flipY *= -1;
  renderPhoto();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!hasPhoto) {
    imageInput.value = "";
    return;
  }

  rotation = 0;
  flipX = 1;
  flipY = 1;
  activeFilter = "Original";

  Object.entries(defaults).forEach(([id, value]) => {
    document.getElementById(id).value = value;
  });

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.filter === "Original"
    );
  });

  renderPhoto();
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!hasPhoto) {
    alert("Please upload a photo before exporting.");
    return;
  }

  const format = document.getElementById("format").value;
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;

  const outputContext = outputCanvas.getContext("2d");

  // JPEG does not support transparency, so use a white background.
  if (format === "jpeg") {
    outputContext.fillStyle = "#ffffff";
    outputContext.fillRect(
      0, 0, outputCanvas.width, outputCanvas.height
    );
  }

  outputContext.drawImage(canvas, 0, 0);

  outputCanvas.toBlob(blob => {
    if (!blob) {
      alert("Export failed. Please try again.");
      return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `photo-studio-edited.${format}`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, mimeType, 0.95);
});