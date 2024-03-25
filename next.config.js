const MillionLint = require('@million/lint');
/** @type {import('next').NextConfig} */
module.exports = MillionLint.next({
  rsc: true
})({
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'oaidalleapiprodscus.blob.core.windows.net',
      port: '',
      pathname: '/private/org-g9DVzuADwPF6yY20DMk2rHLx/user-EfSGctBkCrEQElitCVJLZNWA/**'
    }]
  }
});