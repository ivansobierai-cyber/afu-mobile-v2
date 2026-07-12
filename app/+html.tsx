import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const MATERIAL_ICONS_CDN =
  "https://fonts.gstatic.com/s/materialicons/v140/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2";

/**
 * HTML shell for web — optimized for smartphone browsers (Android Chrome / iOS Safari).
 * Material Icons via CDN: @expo/vector-icons uses font-family `material` on web.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#2D6A4F" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: material;
                font-style: normal;
                font-weight: 400;
                font-display: swap;
                src: url(${MATERIAL_ICONS_CDN}) format('woff2');
              }
              html, body, #root { height: 100%; }
              body {
                margin: 0;
                -webkit-text-size-adjust: 100%;
                -webkit-tap-highlight-color: transparent;
                overscroll-behavior: none;
              }
              #root { display: flex; min-height: 100%; }
              [tabindex="0"], a[role="tab"], button { cursor: pointer; }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
