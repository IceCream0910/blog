import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Search } from "../Search";
import type { SearchOptions } from "../../utils/search/types";

const SearchContext = createContext<(options?: SearchOptions) => void>(() => {});
export const useSearch = () => useContext(SearchContext);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<SearchOptions | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const openSearch = useCallback((next: SearchOptions = {}) => setOptions(next), []);
  const closeSearch = useCallback(() => setOptions(null), []);
  return <SearchContext.Provider value={openSearch}>
    {children}
    {mounted && createPortal(
      <AnimatePresence>{options && <Search key="global-search" onClose={closeSearch} initialOptions={options} />}</AnimatePresence>, document.body,
    )}
  </SearchContext.Provider>;
}
