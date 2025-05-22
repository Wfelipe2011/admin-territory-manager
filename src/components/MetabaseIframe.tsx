'use client';

import { DecodedToken } from '@/types/auth';
import { jwtDecode } from 'jwt-decode';
import { useEffect, useState } from 'react';
import { parseCookies } from 'nookies';

export default function MetabaseIframe() {
  const [iframeUrl, setIframeUrl] = useState(null);

  useEffect(() => {
    const cookies = parseCookies();
    const token = cookies.token;

    const decoded = jwtDecode<DecodedToken>(token);
    console.log(decoded)
    fetch(`/api/metabase?id=${decoded.tenantId}`)
      .then(res => res.json())
      .then(({ iframeUrl }) => {
        setIframeUrl(iframeUrl)
      })
  }, []);


  if (!iframeUrl) return null

  return (
    <div className="relative">
      <iframe
        id="metabase-iframe"
        src={iframeUrl}
        frameBorder={0}
        width="100%"
        height={900}
        allowTransparency
      />
      <div
        className="
      absolute
      left-0
      right-0
      bottom-0
      h-20
      bg-gray-100
      z-10
      pointer-events-none
    "
      />
    </div>
  );
}
