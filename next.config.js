/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      port: '',
      pathname: '/private/org-g9DVzuADwPF6yY20DMk2rHLx/user-EfSGctBkCrEQElitCVJLZNWA/**'
    }]
  }
};

module.exports = nextConfig;
