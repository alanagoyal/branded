/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/one-pager": [
      "./assets/fonts/*.ttf",
      "./node_modules/react/**/*",
      // PDFKit loads these through package imports at runtime. Static tracing
      // misses them, including the default Helvetica font used at startup.
      "./node_modules/pdfkit/js/standard-fonts/**/*",
      "./node_modules/pdfkit/js/data/**/*",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        port: '',
        pathname: '/private/org-g9DVzuADwPF6yY20DMk2rHLx/user-EfSGctBkCrEQElitCVJLZNWA/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/djp21wtxm/image/upload/**',
      },
    ],
  },
};

module.exports = nextConfig;
