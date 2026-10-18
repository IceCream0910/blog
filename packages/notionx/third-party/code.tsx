import copyToClipboard from 'clipboard-copy'
import { type CodeBlock } from 'notion-types'
import { getBlockTitle } from 'notion-utils'
import { loadPrismLanguage, highlightPrismElement } from '../../../utils/load-prism-components'
import { resolvePrismLanguage } from '../../../utils/prism-languages'
import React from 'react'

import { Text } from '../components/text'
import { useNotionContext } from '../context'
import CopyIcon from '../icons/copy'
import { cs } from '../utils'

export function Code({
  block,
  defaultLanguage = 'typescript',
  className
}: {
  block: CodeBlock
  defaultLanguage?: string
  className?: string
}) {
  const [isCopied, setIsCopied] = React.useState(false)
  const copyTimeout = React.useRef<number | undefined>(undefined)
  const { recordMap } = useNotionContext()
  const content = getBlockTitle(block, recordMap)
  const language = resolvePrismLanguage(block.properties?.language?.[0]?.[0] || defaultLanguage)
  const caption = block.properties.caption

  const codeRef = React.useRef<HTMLElement | null>(null)
  React.useEffect(() => {
    let cancelled = false
    const element = codeRef.current
    if (!element) return
    element.textContent = content
    void loadPrismLanguage(language).then((supported) => {
      if (!cancelled && supported) highlightPrismElement(element)
    }).catch((error) => { if (!cancelled) console.warn('Code syntax highlighting failed', error) })
    return () => { cancelled = true }
  }, [content, language])

  const onClickCopyToClipboard = React.useCallback(() => {
    void copyToClipboard(content)
    setIsCopied(true)

    if (copyTimeout.current) {
      clearTimeout(copyTimeout.current)
      copyTimeout.current = undefined
    }

    copyTimeout.current = setTimeout(() => {
      setIsCopied(false)
    }, 1200) as unknown as number
  }, [content, copyTimeout])

  const copyButton = (
    <div className='notion-code-copy-button' onClick={onClickCopyToClipboard}>
      <CopyIcon />
    </div>
  )

  return (
    <>
      <pre
        className={cs('notion-code', `language-${language}`, className)}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
      >
        <div className='notion-code-copy'>
          {copyButton}

          {isCopied && (
            <div className='notion-code-copy-tooltip'>
              <div>{isCopied ? 'Copied' : 'Copy'}</div>
            </div>
          )}
        </div>

        <code className={`language-${language}`} ref={codeRef as any}>
          {content}
        </code>
      </pre>

      {caption && (
        <figcaption className='notion-asset-caption'>
          <Text value={caption} block={block} />
        </figcaption>
      )}
    </>
  )
}
