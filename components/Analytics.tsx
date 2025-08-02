"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { getSeoSettings } from '@/lib/seo-service';

export default function Analytics() {
  const [analyticsId, setAnalyticsId] = useState<string>('');
  const [tagManagerId, setTagManagerId] = useState<string>('');

  useEffect(() => {
    async function loadAnalyticsIds() {
      try {
        const seoSettings = await getSeoSettings();
        if (seoSettings.analytics.enable_analytics) {
          setAnalyticsId(seoSettings.analytics.google_analytics_id);
          setTagManagerId(seoSettings.analytics.google_tag_manager_id);
        }
      } catch (error) {
        console.error('Failed to load analytics settings:', error);
      }
    }

    loadAnalyticsIds();
  }, []);

  if (!analyticsId && !tagManagerId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics */}
      {analyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${analyticsId}', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {tagManagerId && (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${tagManagerId}');
            `}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${tagManagerId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}
    </>
  );
}
