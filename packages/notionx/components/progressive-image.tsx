import React from 'react'
import { useNotionContext } from '../context'

type Phase = 'skeleton' | 'preview' | 'ready' | 'error'
export function ProgressiveImage({ src, thumbnail, alt, width, height, zoomable }: {
  src: string; thumbnail?: string; alt: string; width: number; height: number; zoomable: boolean
}) {
  const [phase, setPhase] = React.useState<Phase>('skeleton')
  const imageRef = React.useRef<HTMLImageElement>(null)
  const previewRef = React.useRef<HTMLImageElement>(null)
  const mounted = React.useRef(true)
  const { zoom } = useNotionContext()
  const imageZoom = React.useMemo(() => zoomable && zoom ? zoom.clone() : null, [zoom, zoomable])
  const decoded = async (image: HTMLImageElement, full: boolean) => {
    try { await image.decode?.() } catch { /* A loaded image may not support decoding. */ }
    if (!mounted.current || !image.naturalWidth) return
    setPhase((current) => full ? 'ready' : current === 'skeleton' ? 'preview' : current)
  }
  React.useEffect(() => {
    mounted.current = true
    for (const [image, full] of [[previewRef.current, false], [imageRef.current, true]] as const) {
      if (image?.complete && image.naturalWidth) void decoded(image, full)
    }
    return () => { mounted.current = false }
  }, [])
  React.useEffect(() => {
    const image = imageRef.current
    if (phase !== 'ready' || !imageZoom || !image) return
    imageZoom.attach(image)
    return () => { imageZoom.detach(image) }
  }, [phase, imageZoom])
  return <div className="notion-progressive-image" data-phase={phase} style={{ aspectRatio: `${width} / ${height}`, '--notion-image-ratio': width / height } as React.CSSProperties} aria-busy={phase === 'skeleton' || phase === 'preview'}>
    <div className="notion-image-skeleton" aria-hidden="true" />
    {thumbnail && <img ref={previewRef} className="notion-image-thumbnail" src={thumbnail} alt="" aria-hidden="true" loading="lazy" decoding="async"
      onLoad={(event) => void decoded(event.currentTarget, false)} />}
    <img ref={imageRef} className="notion-image-original" src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async"
      onLoad={(event) => void decoded(event.currentTarget, true)} onError={() => setPhase('error')} />
    {phase === 'error' && <span className="notion-image-error" role="status">이미지를 불러오지 못했습니다.</span>}
  </div>
}
