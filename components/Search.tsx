import IonIcon from '@reacticons/ionicons';
import Link from 'next/link';
import React from 'react';

const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function (...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};

export const Search: React.FC<any> = ({ onClose }) => {
    const [query, setQuery] = React.useState('');
    const [results, setResults] = React.useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);
    const abortControllerRef = React.useRef<AbortController | null>(null);
    const resultsContainerRef = React.useRef<HTMLDivElement>(null);
    const selectedItemRef = React.useRef<HTMLAnchorElement>(null);
    const searchBoxRef = React.useRef<HTMLDivElement>(null);

    const search = React.useCallback((query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setIsLoading(true);
        fetch(`/api/search-notion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                ancestorId: "e5f8cfa7-6c5c-48e0-b060-734faa8cb4bb",
                filter: {
                    "isDeletedOnly": false,
                    "excludeTemplates": false,
                    "navigableBlockContentOnly": false,
                    "requireEditPermissions": false,
                    "includePublicPagesWithoutExplicitAccess": true,
                    "ancestors": [],
                    "createdBy": [],
                    "editedBy": [],
                    "lastEditedTime": {},
                    "createdTime": {},
                    "inTeams": []
                },
                limit: 100,
                searchSessionId: "c88eadd0-f242-4cfc-aaf7-5610761491a0"
            }),
            signal: abortController.signal,
        })
            .then(res => res.json())
            .then(async (data: any) => {
                if (!abortController.signal.aborted) {
                    await data.results.map(async (result: any) => {
                        try {
                            const title = data.recordMap.block[result.id].value.properties.title[0][0];
                            result.title = title;
                        }
                        catch (e) {
                            console.log(e);
                            result.title = "";
                        }
                    });
                    setResults(data.results);
                    setIsLoading(false);
                }
            })
            .catch((error) => {
                if (error.name === 'AbortError') {
                    return;
                }
                console.error(error);
                setIsLoading(false);
            });
    }, []);

    const debouncedSearch = React.useMemo(
        () => debounce(search, 300),
        [search]
    );

    React.useEffect(() => {
        debouncedSearch(query);
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [query, debouncedSearch]);

    const handleKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    window.location.href = `/${results[selectedIndex].id}`;
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    };

    React.useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [results, selectedIndex]);

    React.useEffect(() => {
        if (selectedItemRef.current && resultsContainerRef.current) {
            const container = resultsContainerRef.current;
            const item = selectedItemRef.current;

            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();

            if (itemRect.bottom > containerRect.bottom) {
                item.scrollIntoView({ behavior: 'smooth', block: 'end' });
            } else if (itemRect.top < containerRect.top) {
                item.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, [selectedIndex]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="fixed w-full h-screen inset-0 bg-black/70 flex items-center justify-center">
            <div ref={searchBoxRef} className="w-[600px] max-w-[90%] bg-[#1E1E1E] rounded-3xl shadow-2xl overflow-hidden">
                <div className="relative">
                    <IonIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 text-xl" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        className="w-full bg-transparent text-gray-400 text-lg p-4 px-12 focus:outline-none"
                        placeholder="검색"
                        autoFocus
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="p-1 hover:bg-gray-700 rounded"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                        {isLoading && (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-white" />
                        )}
                    </div>
                </div>
                <div ref={resultsContainerRef} className={`max-h-[400px] overflow-y-auto p-2 ${results.length === 0 ? 'hidden' : ''}`}>
                    {results.map((result, index) => (
                        result.highlight.title ? (
                            <Link
                                key={result.id}
                                ref={index === selectedIndex ? selectedItemRef : null}
                                onClick={onClose}
                                href={`/${result.id}`}
                                className={`block p-3 hover:bg-gray-700/20 no-underline rounded-2xl ${index === selectedIndex ? 'bg-gray-700/50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-lg aspect-square">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="m-0 text-white text-sm">{result.highlight.title.replaceAll("<gzkNfoUU>", "").replaceAll("</gzkNfoUU>", "")}</h3>
                                    </div>
                                </div>
                            </Link>
                        ) :
                            (
                                <Link
                                    key={result.id}
                                    ref={index === selectedIndex ? selectedItemRef : null}
                                    href={`/${result.id}`}
                                    onClick={onClose}
                                    className={`block p-3 hover:bg-gray-700/20 no-underline rounded-2xl ${index === selectedIndex ? 'bg-gray-700/50' : ''
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-lg aspect-square">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="m-0 text-white text-sm">{result.title}</h3>
                                            {result.highlight.text &&
                                                <p className="m-0 text-gray-400 text-sm" dangerouslySetInnerHTML={{ __html: result.highlight.text.replaceAll("<gzkNfoUU>", "<b>").replaceAll("</gzkNfoUU>", "</b>") }} />

                                            }
                                        </div>
                                    </div>
                                </Link>
                            )

                    ))}
                </div>
                <div className="p-4 hidden md:block">
                    <div className="flex items-center justify-end gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-1">/</kbd>
                            <span>검색창 열기</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">↑</kbd>
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-1">↓</kbd>
                            <span>탐색</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-1">Enter</kbd>
                            <span>이동</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-gray-700 rounded text-xs mr-1">Esc</kbd>
                            <span>닫기</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}