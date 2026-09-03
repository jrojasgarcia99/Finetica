/** Recorta `imageSrc` a la región `crop` (en px de la imagen original) y
 *  devuelve un JPEG cuadrado de `outSize`x`outSize`. Solo se usa en el cliente. */
export async function getCroppedBlob(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  outSize = 512,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sin contexto 2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outSize, outSize);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
      "image/jpeg",
      0.9,
    );
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error("no se pudo cargar la imagen")));
    img.src = src;
  });
}
