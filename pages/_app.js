import "../styles/globals.css";
import '../styles/notion.css'
import { Header } from "../components/Header";
import { useRouter } from 'next/router';
import { SliderTabBar } from "../components/SliderTabBar";
import { Spinner } from "../components/Spinner";
import { useState, useEffect } from 'react';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <>
      <Header />
      {loading ? (
        <Spinner />
      ) : (
        <Component {...pageProps} key={router.asPath} />
      )}
      {(router.pathname.includes('/forest') || router.pathname == '/graph') &&
        <SliderTabBar />}
    </>
  );
}
