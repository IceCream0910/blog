import React from "react";
import Link from "next/link";
import { useHotkeys } from "react-hotkeys-hook";
import { Search } from "./Search";
import IonIcon from '@reacticons/ionicons';


export const Header: React.FC = () => {
    const [showSearch, setShowSearch] = React.useState(false);

    useHotkeys('/', event => {
        setShowSearch(true);
        event.preventDefault();
        event.stopPropagation();
    });

    useHotkeys('esc', () => setShowSearch(false), { enableOnFormTags: true });

    const handleCloseSearch = () => {
        setShowSearch(false);
    }

    return (
        <header>
            <div className="container mx-auto px-4 py-8 header-content">
                <Link href="/" className="no-underline text-inherit">
                    <h3 className="text-lg m-0">태인의 Blog</h3>
                </Link>

                <div className="flex space-x-4">
                    <Link href="/forest" className="no-underline text-inherit">
                        <h3 className="text-sm m-0">forest</h3>
                    </Link>
                    <h3 className="text-sm m-0 cursor-pointer" onClick={() => setShowSearch(true)}>
                        <IonIcon name="search" style={{ marginTop: '4px' }} />
                    </h3>
                </div>
            </div>

            {showSearch && (
                <Search onClose={handleCloseSearch} />
            )}
        </header>
    );
}
