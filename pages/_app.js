import "../styles/globals.css";
import '../styles/notion.css'
import { Header } from "../components/Header";
import { useRouter } from 'next/router';
import { SliderTabBar } from "../components/SliderTabBar";

export default function App({ Component, pageProps }) {
  const router = useRouter();

  return (
    <>
      <Header />
      <Component {...pageProps} key={router.asPath} />
      {(router.pathname.includes('/forest') || router.pathname == '/graph') &&
        <SliderTabBar />}
    </>
  );
}
