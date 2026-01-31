'use client';

import { useEffect } from 'react';
import Script from 'next/script';

export default function AdminPage() {
  useEffect(() => {
    // Ensure CMS loads config from /admin/config.yml
    if (typeof window !== 'undefined') {
      window.CMS_CONFIG_PATH = '/admin/config.yml';
    }
  }, []);

  return (
    <>
      <Script
        src="https://unpkg.com/decap-cms@^3.0.0/dist/decap-cms.js"
        strategy="afterInteractive"
      />
    </>
  );
}

