import throttle from 'lodash.throttle'
import { motion } from 'framer-motion'
import { type TableOfContentsEntry, uuidToId } from 'notion-utils'
import React from 'react'

import { cs } from '../utils'

export function PageAside({
  toc,
  activeSection,
  setActiveSection,
  pageAside,
  hasToc,
  hasAside,
  className
}: {
  toc: Array<TableOfContentsEntry>
  activeSection: string | null
  setActiveSection: (activeSection: string | null) => unknown
  hasToc: boolean
  hasAside: boolean
  pageAside?: React.ReactNode
  className?: string
}) {
  const throttleMs = 100
  const actionSectionScrollSpy = React.useMemo(
    () =>
      throttle(() => {
        const sections = document.getElementsByClassName('notion-h')

        let prevBBox: DOMRect | null = null
        let currentSectionId = activeSection

        for (const section of sections) {
          if (!section || !(section instanceof Element)) continue

          if (!currentSectionId) {
            currentSectionId = (section as any).dataset.id
          }

          const bbox = section.getBoundingClientRect()
          const prevHeight = prevBBox ? bbox.top - prevBBox.bottom : 0
          const offset = Math.max(150, prevHeight / 4)

          // GetBoundingClientRect returns values relative to the viewport
          if (bbox.top - offset < 0) {
            currentSectionId = (section as any).dataset.id

            prevBBox = bbox
            continue
          }

          // No need to continue loop, if last element has been detected
          break
        }

        setActiveSection(currentSectionId)
      }, throttleMs),

    [
      // explicitly not taking a dependency on activeSection
      setActiveSection
    ]
  )

  React.useEffect(() => {
    if (!hasToc) {
      return
    }

    window.addEventListener('scroll', actionSectionScrollSpy)

    actionSectionScrollSpy()

    return () => {
      window.removeEventListener('scroll', actionSectionScrollSpy)
    }
  }, [hasToc, actionSectionScrollSpy])

  if (!hasAside) {
    return null
  }

  return (
    <aside className={cs('notion-aside', className)}>
      {hasToc && (
        <nav className='notion-contentPosition'>
          {toc.map((tocItem) => {
            const id = uuidToId(tocItem.id)
            const isActive = activeSection === id

            return (
              <a
                key={id}
                href={`#${id}`}
                className={cs(
                  'item',
                  `level${tocItem.indentLevel}`,
                  isActive && 'active'
                )}
              >
                {isActive && (
                  <motion.div
                    className='activeLine'
                    key='activeLine'
                    layoutId='activeLine'
                    transition={{ duration: 0.25 }}
                  />
                )}

                <motion.div
                  className='text-sm'
                  style={{ marginBottom: '10px' }}
                  initial={false}
                  animate={{
                    fontWeight: isActive ? 800 : 100,
                    color: isActive
                      ? 'var(--primary)'
                      : 'var(--notion-gray)',
                    fontSize: isActive ? '0.95em' : '0.9em'
                  }}
                  transition={{ duration: 0.25 }}
                >
                  {tocItem.text}
                </motion.div>
              </a>
            )
          })}
        </nav>
      )}

      {pageAside}
    </aside>
  )
}
