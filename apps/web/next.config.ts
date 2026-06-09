import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  async redirects() {
    return [
      {
        source: '/my-forms/:formId',
        destination: '/public/forms/:formId',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
