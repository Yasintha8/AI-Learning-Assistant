/**
 * Resizes and compresses an image file before upload.
 * Reduces large phone/camera photos down to a compact WebP/JPEG image (e.g. 20KB-50KB),
 * ensuring fast uploads, minimal memory consumption, and permanent storage in MongoDB Atlas.
 *
 * @param {File} file - Original file from input
 * @param {number} maxWidth - Maximum width (default 400px)
 * @param {number} maxHeight - Maximum height (default 400px)
 * @param {number} quality - Compression quality between 0.1 and 1.0 (default 0.85)
 * @returns {Promise<File>} Compressed File or original file if unsupported
 */
export const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
    return new Promise((resolve) => {
        // Skip non-images or animated SVGs/GIFs
        if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result;

            img.onload = () => {
                let { width, height } = img;

                // Scale down maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return resolve(file);
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return resolve(file);
                        }
                        const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
                        const compressedFile = new File([blob], fileName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = () => resolve(file);
        };

        reader.onerror = () => resolve(file);
    });
};
