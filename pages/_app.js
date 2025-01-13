import "../styles/globals.css";
import '../styles/notion.css'
import { Header } from "../components/Header";
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // 히스토리 상태 초기화를 위한 핸들러
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

  return (
    <>
      <Header />
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
          }
        }}
      >
        <Component {...pageProps} key={router.asPath} />
      </AnimatePresence>
    </>
  );
}
