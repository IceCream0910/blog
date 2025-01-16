import * as React from 'react'
import { PageHead } from '../components/PageHead'

import styles from '../components/styles.module.css'

export default function Page404({ site, pageId, error }) {
  const [url, setUrl] = React.useState('')
  const [script, setScript] = React.useState('')
  const [title, setTitle] = React.useState('')
  const [isNormalized, setIsNormalized] = React.useState(false)
  const [space, setSpace] = React.useState('fishaudio/fish-speech-1')
  const [result, setResult] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)

  const handleNormalize = async () => {
    try {
      if (!url) {
        alert('게시물 주소를 입력해주세요.')
        return
      }
      setIsLoading(true)
      const response = await fetch(`https://podcast.yuntae.in/normalize?url=${encodeURIComponent(url)}`, {
        headers: {
          'allowed-request': 'true'
        }
      })
      const data = await response.json()
      console.log(data)
      setScript(data.normalizedText)
      setTitle(data.title)
      setIsNormalized(true)
    } catch (error) {
      console.error('Normalize error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      if (!script || !title) {
        alert('스크립트와 제목을 모두 입력해주세요.')
        return
      }
      setIsLoading(true)
      const response = await fetch('https://podcast.yuntae.in/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'allowed-request': 'true'
        },
        body: JSON.stringify({
          title,
          text: script,
          space
        })
      })
      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      console.error('Generate error:', error)
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <>
      <PageHead site={site} title={title || "팟캐스트 스튜디오"} />

      <main style={{ color: 'var(--fg-color)', padding: '20px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>팟캐스트 스튜디오</h1>
        <br />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="게시물 주소"
          style={{ width: '100%', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none' }}
        />
        <br /><br />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="게시물 제목"
          style={{ width: '100%', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none' }}
        />
        <br />
        <button
          onClick={handleNormalize}
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none', marginTop: '10px' }}
        >
          Normalize
        </button>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="스크립트"
          style={{ width: '100%', minHeight: '300px', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none', marginTop: '10px' }}
        />
        <br />
        <select style={{ width: '100%', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none', marginTop: '10px' }} value={space} onChange={(e) => setSpace(e.target.value)}>
          <option value="fishaudio/fish-speech-1">fishspeech</option>
          <option value="icecream0910/fish-speech-1">self-hosted</option>
        </select>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          style={{ width: '100%', padding: '10px', fontSize: '16px', background: 'var(--bg-color-1)', borderRadius: '15px', outline: 'none', marginTop: '10px' }}
        >
          {isLoading ? 'Processing...' : 'Generate'}
        </button>
        <br /><br />
        <span>결과: </span>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
      </main>
    </>
  )
}