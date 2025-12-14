// This utility handles the core image processing logic using HTML5 Canvas API
// We simulate OpenCV-like operations: Grayscale -> Gaussian Blur -> Sobel Edge Detection -> Thresholding

export const processImage = (
  imgElement: HTMLImageElement,
  options: { threshold: number; invert: boolean }
): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) throw new Error('Could not get canvas context');

  const width = imgElement.naturalWidth;
  const height = imgElement.naturalHeight;

  canvas.width = width;
  canvas.height = height;

  // Draw original image
  ctx.drawImage(imgElement, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // 1. Grayscale
  const grayData = new Float32Array(width * height);
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Luminance formula
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    grayData[i / 4] = gray;
  }

  // 2. Gaussian Blur (3x3 Kernel) - Simplified for performance
  // This reduces noise before edge detection
  const blurredData = new Float32Array(width * height);
  const kernel = [1/16, 2/16, 1/16, 2/16, 4/16, 2/16, 1/16, 2/16, 1/16];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      let kIndex = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelVal = grayData[(y + ky) * width + (x + kx)];
          sum += pixelVal * kernel[kIndex++];
        }
      }
      blurredData[y * width + x] = sum;
    }
  }

  // 3. Sobel Edge Detection
  const sobelData = new Float32Array(width * height);
  const gxKernel = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const gyKernel = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelVal = blurredData[(y + ky) * width + (x + kx)];
          sumX += pixelVal * gxKernel[ky + 1][kx + 1];
          sumY += pixelVal * gyKernel[ky + 1][kx + 1];
        }
      }
      
      const magnitude = Math.sqrt(sumX * sumX + sumY * sumY);
      sobelData[y * width + x] = magnitude;
    }
  }

  // 4. Thresholding & Inversion
  // We apply the threshold to create a binary image (black ridges, white background)
  for (let i = 0; i < data.length; i += 4) {
    const idx = i / 4;
    let val = sobelData[idx];

    // Normalize roughly to 0-255 based on expected gradient magnitude
    // Sobel gradients can be large, we clamp.
    val = Math.min(255, val);

    // Binarize
    if (val > options.threshold) {
      val = 0; // Edge detected -> Black
    } else {
      val = 255; // No edge -> White
    }

    if (options.invert) {
      val = 255 - val;
    }

    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
    data[i + 3] = 255; // Alpha
  }

  // Put data back
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL('image/png');
};
