/**
 * Sub-layout for the /display route (TV player).
 *
 * Injected CSS reset overrides the global YuTa body styles so the
 * Samsung Tizen browser (and any other TV WebKit) shows a pure black,
 * overflow-hidden viewport — no scrollbars, no background bleed.
 *
 * Inline <style> is used intentionally: CSS custom properties and @layer
 * are sometimes unreliable on older Tizen / HbbTV browsers.
 */
export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* PWA manifest — "display": "fullscreen" hides browser chrome when added to home screen */}
      <link rel="manifest" href="/manifest.json" />

      {/* Mobile/TV fullscreen meta tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
          color: #fff;
        }
      `}</style>
      {children}
    </>
  );
}
