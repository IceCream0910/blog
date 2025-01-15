import { DynamicIslandSize } from './types'
import Image, { StaticImageData } from 'next/image'
import { MotionDiv, MotionH2, MotionP } from './MotionHtml'
import { NowPlaying } from './Now'
import { useEffect, useMemo, useState } from 'react'
import { AppleMusicData, AppleMusicSong } from './types/AppleMusicData'
import { MusicEqualizer } from './MusicEqualizer'
import emptyAlbumCover from '../../public/empty.png'
import { getEmptyAlbumCover } from './emptyAlbumCover'
import Head from 'next/head'

export const hasNoImageUrl = (songUrl: string | StaticImageData) => {
  return !(typeof songUrl === 'string')
}


const BackwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="28" fill="none" viewBox="0 0 34 28">
    <path fill="#fefefe" d="M14.774 23.83c1.016 0 1.878-.777 1.878-2.188V7.187c0-1.412-.856-2.187-1.874-2.187-.516 0-.949.152-1.459.45l-12 7.053C.432 13.024 0 13.628 0 14.406c0 .785.438 1.404 1.319 1.921l12 7.052c.498.299.939.45 1.455.45Zm16.593 0c1.018 0 1.878-.777 1.878-2.188V7.187c0-1.412-.856-2.187-1.871-2.187-.519 0-.95.152-1.462.45l-12 7.053c-.887.521-1.319 1.125-1.319 1.903 0 .785.44 1.404 1.319 1.921l12 7.052c.498.299.941.45 1.455.45Z" />
  </svg>
);

const ForwardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="28" fill="none" viewBox="0 0 34 28">
    <path fill="#fefefe" d="M1.877 23.83c.517 0 .957-.152 1.456-.45l12.002-7.053c.879-.517 1.328-1.136 1.328-1.921 0-.778-.441-1.382-1.328-1.903L3.333 5.45c-.51-.298-.941-.45-1.46-.45C.858 5 0 5.775 0 7.187v14.455c0 1.411.862 2.188 1.877 2.188Zm16.596 0c.514 0 .956-.152 1.455-.45l12.01-7.053c.869-.517 1.318-1.136 1.318-1.921 0-.778-.441-1.382-1.318-1.903L19.928 5.45c-.5-.298-.943-.45-1.462-.45-1.015 0-1.87.775-1.87 2.187v14.455c0 1.411.86 2.188 1.877 2.188Z" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 28 28">
    <path fill="#fefefe" d="M8.925 23.465c.516 0 .949-.152 1.459-.45l12-7.053c.881-.517 1.319-1.136 1.319-1.921 0-.778-.432-1.382-1.319-1.903l-12-7.053c-.51-.298-.943-.45-1.459-.45C7.909 4.635 7.053 5.41 7.053 6.822v14.455c0 1.411.856 2.188 1.872 2.188Z" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 28 28">
    <path fill="#fefefe" d="M8.675 23.465h2.75c1.1 0 1.672-.573 1.672-1.682V5.673c0-1.128-.573-1.665-1.672-1.673h-2.75C7.575 4 7 4.573 7 5.673v16.11c-.006 1.11.567 1.682 1.675 1.682Zm8.87 0h2.74c1.109 0 1.674-.573 1.674-1.682V5.673C21.96 4.544 21.394 4 20.285 4h-2.74c-1.11 0-1.685.573-1.685 1.673v16.11c0 1.11.569 1.682 1.684 1.682Z" />
  </svg>
);




export const DynamicIslandMusicPlayer = ({ size, title, currentTime, duration, isPlaying, onTogglePlayPause, onTimeUpdate, onBackward, onForward }:
  { size: DynamicIslandSize, title: string, currentTime: any, duration: any, isPlaying: boolean, onTogglePlayPause: any, onTimeUpdate: (time: number) => void, onBackward: any, onForward: any }) => {

  const [song, setSong] = useState<AppleMusicSong[]>()
  const [now, setNow] = useState<number>(0)
  const blurUrl = getEmptyAlbumCover()
  const currentSong = useMemo(() => song?.[now] ?? null, [song, now])
  let imageUrl = currentSong?.attributes?.artwork?.url?.replace('{w}', '500').replace('{h}', '500') ?? ''
  const [imgSrc, setImgSrc] = useState("/podcast-albumart.jpg")


  useEffect(() => {
    const fetchSong = async () => {
      NowPlaying().then((data: AppleMusicData) => {
        setSong(data.data)
      })
    }
    fetchSong().catch(console.error)
  }, [])

  const timeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const durationInSeconds = timeToSeconds(duration);
    if (!isNaN(durationInSeconds)) {
      const newTime = clickPosition * durationInSeconds;
      onTimeUpdate(newTime);
    }
  }

  const progress = (() => {
    const currentTimeInSeconds = timeToSeconds(currentTime);
    const durationInSeconds = timeToSeconds(duration);
    if (isNaN(currentTimeInSeconds) || isNaN(durationInSeconds) || durationInSeconds === 0) {
      return 0;
    }
    return (currentTimeInSeconds / durationInSeconds) * 100;
  })();

  let musicColors = useMemo(() => {
    return [
      '705ef2',
      '36289d',
      '36289d',
      '4331c3',
      '5740ff',
    ]
  }, [])

  return (
    <>
      <div style={size === 'ultra' ? { display: 'none' } : { display: 'block', padding: '0 10px 0 5px' }} className='h-full'>
        <MotionDiv className='grid justify-center h-full grid-cols-6 ml-1.5' size={size} before='ultra'>
          <MotionDiv className='relative col-span-1 mx-auto my-auto overflow-hidden rounded-lg w-7 h-7' size={size} before='ultra' >
            {hasNoImageUrl(imageUrl) ? (
              <Image src={imageUrl} alt='Album Art' layout='fill' objectFit='cover' />
            ) : (
              <Image src={imgSrc} alt={`album art of song`} layout='fill' placeholder='blur' blurDataURL={blurUrl} onLoadingComplete={(result) => {
                if (result.naturalWidth === 0) {
                  setImgSrc(blurUrl);
                }
              }} />
            )}
          </MotionDiv>
          <MotionDiv className='col-span-4 mx-auto my-auto' size={size} before='ultra' />
          <MotionDiv className='w-7.5 col-span-1 mx-auto my-auto pr-0.5' size={size} before='ultra'>
            <MusicEqualizer size={size} colors={musicColors} before='ultra' isActive={isPlaying} />
          </MotionDiv>
        </MotionDiv>
      </div>
      <div style={size === 'compact' ? { display: 'none' } : { display: 'block' }} className='h-full'>
        <MotionDiv className='h-full' size={size} before='compact'>
          <MotionDiv size={size} before='compact' className='w-full'>
            <MotionDiv className='grid grid-cols-5 my-6' size={size} before='compact'>
              <MotionDiv
                className='relative w-16 h-16 col-span-1 my-auto ml-6 overflow-hidden shadow-lg rounded-2xl shadow-gray-900'
                size={size}
                before='compact'
              >
                {hasNoImageUrl(imageUrl) ? (
                  <Image src={imageUrl} alt='Album Art' layout='fill' objectFit='cover'
                    onLoadingComplete={(result) => {
                      if (result.naturalWidth === 0) {
                        setImgSrc(blurUrl);
                      }
                    }}
                  />
                ) : (
                  <Image
                    src={imgSrc}
                    alt={`album art of song`}
                    layout='fill'
                    placeholder='blur'
                    blurDataURL={blurUrl}
                    onLoadingComplete={(result) => {
                      if (result.naturalWidth === 0) {
                        setImgSrc(blurUrl);
                      }
                    }}
                  />
                )}
              </MotionDiv>
              <MotionDiv className='col-span-3 my-auto ml-6 overflow-hidden text-left' size={size} before='compact'>
                <MotionP className='m-0 font-sans text-sm text-gray-500 truncate' size={size} before='compact'>
                  지금 재생 중
                </MotionP>
                <MotionH2 className='m-0 font-sans text-white truncate text-base whitespace-nowrap' size={size} before='compact'>
                  {title ?? 'Nothing'}
                </MotionH2>
                <MotionP className='m-0 font-sans text-sm text-gray-500 truncate' size={size} before='compact'>
                  AI가 읽어주는 태인의 Blog
                </MotionP>
              </MotionDiv>
              <div className='flex flex-row justify-end'>
                <div className='relative my-auto mr-6 overflow-hidden scale-125'>
                  <MusicEqualizer size={size} colors={musicColors} before='compact' isActive={isPlaying} />
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>
          <div onClick={(e) => e.stopPropagation()}>
            <MotionDiv className='grid grid-cols-5 my-2' size={size} before='compact'>

              <MotionDiv className='block text-left' size={size} before='compact'>
                <MotionP className='m-auto font-sans text-sm text-center text-gray-500 align-middle' before={'compact'} size={size}>
                  {currentTime}
                </MotionP>
              </MotionDiv>
              <MotionDiv className='col-span-3 my-auto' size={size} before='compact'>
                <div
                  className='relative w-full h-2 my-auto mr-6 overflow-hidden bg-gray-500 rounded-full cursor-pointer'
                  onClick={handleProgressBarClick}
                >
                  <div className='absolute w-full h-2 my-auto mr-6 overflow-hidden bg-gray-500' />
                  <div
                    className='absolute h-2 my-auto mr-6 overflow-hidden bg-white transition-all duration-200'
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </MotionDiv>
              <MotionDiv className='block text-left align-middle' size={size} before='compact'>
                <MotionP className='m-auto font-sans text-sm text-center text-gray-500 align-middle' before={'compact'} size={size}>
                  {duration}
                </MotionP>
              </MotionDiv>
            </MotionDiv>
          </div>
          <MotionDiv className='grid grid-cols-5 my-5' size={size} before='compact'>
            <MotionDiv className='col-span-1 ' size={size} before='compact' />
            <MotionDiv className='col-span-1 my-auto flex justify-center items-center' size={size} before='compact'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBackward();
                }}
                className='m-auto'
                style={{ transform: 'scale(1.1)' }}>
                <BackwardIcon />
              </button>
            </MotionDiv>
            <MotionDiv className='col-span-1 my-auto flex justify-center items-center' size={size} before='compact'>
              {isPlaying ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlayPause();
                  }}
                  className='m-auto'
                  style={{ transform: 'scale(1.1)' }}>
                  <PauseIcon />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlayPause();
                  }}
                  className='m-auto'
                  style={{ transform: 'scale(1.1)' }}>
                  <PlayIcon />
                </button>
              )}
            </MotionDiv>
            <MotionDiv className='col-span-1 my-auto flex justify-center items-center' size={size} before='compact'>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForward();
                }}
                className='m-auto'
                style={{ transform: 'scale(1.1)' }}>
                <ForwardIcon />
              </button>
            </MotionDiv>
            <MotionDiv className='col-span-1 my-auto' size={size} before='compact'>
            </MotionDiv>
          </MotionDiv>
        </MotionDiv>
      </div>
    </>
  )
}
