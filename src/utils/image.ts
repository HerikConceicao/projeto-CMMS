/**
 * Lê um arquivo de imagem e retorna um data URL redimensionado/comprimido
 * (lado maior ≤ maxSide), evitando manter na memória fotos de câmera em
 * resolução total. O upload ao Storage ainda passa por `compressDataUrl`
 * (src/lib/photoStorage.ts), que usa os mesmos limites como rede de segurança.
 */
export function fileToCompressedDataUrl(
  file: File,
  maxSide = 1280,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao carregar a imagem.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas não suportado neste navegador.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
