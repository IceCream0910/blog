import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "./Search";
import IonIcon from '@reacticons/ionicons';
import { AnimatePresence, motion } from "framer-motion";

const navigation = [
    { href: "/recap", label: "월말결산" },
    { href: "/forest", label: "문서" },
];

export const Header: React.FC = () => {
    const [showSearch, setShowSearch] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);
    const router = useRouter();

    useHotkeys('/', event => {
        setShowSearch(true);
        event.preventDefault();
        event.stopPropagation();
    });

    useHotkeys('esc', () => {
        setShowSearch(false);
        setShowMenu(false);
    }, { enableOnFormTags: true });

    const handleCloseSearch = () => {
        setShowSearch(false);
    }

    React.useEffect(() => {
        setShowMenu(false);
    }, [router.asPath]);

    React.useEffect(() => {
        if (!showMenu) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [showMenu]);

    return (
        <header
            className={showMenu ? "header-menu-open" : undefined}
            style={{ mask: showSearch || showMenu ? 'unset' : 'linear-gradient(to bottom, var(--background) 45%, rgba(0, 0, 0, 0) 100%)' }}>
            <div className="container mx-auto px-4 py-8 header-content">
                <div className="header-leading">
                    <button
                        type="button"
                        className="header-menu-button"
                        aria-label="메뉴 열기"
                        aria-expanded={showMenu}
                        onClick={() => setShowMenu(true)}
                    >
                        <IonIcon name="menu-outline" />
                    </button>
                    <Link href="/" className="no-underline text-inherit">
                        <h3 className="text-sm m-0 font-black">태인의 Blog</h3>
                    </Link>
                    <nav className="header-navigation" aria-label="주요 메뉴">
                        {navigation.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`header-navigation-link no-underline ${router.pathname.startsWith(item.href) ? "is-active" : ""}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex">
                    <button
                        type="button"
                        className="header-search-button"
                        aria-label="검색 열기"
                        onClick={() => setShowSearch(true)}
                    >
                        <IonIcon name="search" style={{ marginTop: '4px' }} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showMenu && (
                    <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="주요 메뉴">
                        <motion.button
                            type="button"
                            className="mobile-menu-backdrop no-blur"
                            aria-label="메뉴 닫기"
                            onClick={() => setShowMenu(false)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        />
                        <motion.div
                            className="mobile-menu-panel"
                            style={{ width: '50%', top: "-25px" }}
                            initial={{ opacity: 0, scale: 0.5, x: "-50%", y: -18 }}
                            animate={{ opacity: 1, scale: 0.75, x: "-50%", y: 0 }}
                            exit={{ opacity: 0, scale: 0.85, x: "-50%", y: 50 }}
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        >
                            <nav className="mobile-menu-options" aria-label="모바일 주요 메뉴">
                                {navigation.map((item) => {
                                    const active = router.pathname.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`mobile-menu-link no-underline text-inherit ${active ? "is-active" : ""}`}
                                            onClick={() => setShowMenu(false)}
                                        >
                                            <span>{item.label}</span>
                                            <IonIcon name={active ? "checkmark-circle" : "chevron-forward-outline"} />
                                        </Link>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {showSearch && (
                <Search onClose={handleCloseSearch} />
            )}
        </header>
    );
}
