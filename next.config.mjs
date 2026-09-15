/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Las fotos ya están dimensionadas para el sitio (~120–640 KB nativas).
    // Desactivar el optimizador on-demand evita los fallos intermitentes
    // de carga de imágenes en Vercel y sirve el archivo tal cual.
    unoptimized: true,
  },
};

export default nextConfig;