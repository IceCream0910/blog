import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const themeScript = `
    (function() {
      try {
        var theme = localStorage.getItem('theme') || 'system';
        var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var isDark = theme === 'dark' || (theme === 'system' && supportDarkMode);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <Html lang="ko">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
