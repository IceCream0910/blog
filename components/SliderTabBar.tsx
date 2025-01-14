"use client"
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

const tabs = [
    { id: 'diary', label: '일지', path: '/forest' },
    { id: 'document', label: '문서', path: '/forest/docs' },
    { id: 'graph', label: '그래프', path: '/graph' },
]

export const SliderTabBar: React.FC<any> = (() => {
    const [activeTab, setActiveTab] = useState(tabs[0].id)
    const router = useRouter()

    const handleTabChange = (tabId: string, path: string) => {
        setActiveTab(tabId)
        router.push(path)
    }

    useEffect(() => {
        const path = window.location.pathname
        const tab = tabs.find((tab) => path === tab.path)
        if (tab) {
            setActiveTab(tab.id)
        }
    }, [])

    return (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center z-50">
            <div className="relative p-1 backdrop-filter backdrop-blur rounded-full shadow-lg border border-gray-300 dark:border-gray-800"
                style={{ backgroundColor: 'var(--blur)' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id, tab.path)}
                        className={`relative z-20 px-6 py-2 pr-5 text-sm font-medium transition-colors duration-300 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`}
                    >
                        {tab.label}
                    </button>
                ))}
                <motion.div
                    className="absolute left-1 top-1 bottom-1 rounded-full bg-opacity-50 z-10"
                    style={{ backgroundColor: 'var(--primary)' }}
                    initial={false}
                    animate={{
                        width: '33.33%',
                        x: activeTab === 'diary'
                            ? '0%'
                            : activeTab === 'document'
                                ? '90%'
                                : '188%',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            </div>
        </div>
    )
})
