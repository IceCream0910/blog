import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import DynamicIsland from './DynamicIsland/DynamicIsland'
import { DynamicIslandMusicPlayer } from './DynamicIsland/MusicPlayer'
import Squircle from './DynamicIsland/Squircle'
import { useIntersection } from './DynamicIsland/useIntersection'
import { DynamicIslandSize } from './DynamicIsland/types'
import { motion } from 'framer-motion'

const useIntersectionObserver = (ref: React.RefObject<Element>, options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = React.useState(true);

  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref, options]);

  return isIntersecting;
};

const PlayIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5.14v14.72a.5.5 0 00.76.428l11.345-7.36a.5.5 0 000-.856L8.76 4.712A.5.5 0 008 5.14z" fill="currentColor" />
  </svg>
);

const PauseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5h2.5v14H8V5zm5.5 0H16v14h-2.5V5z" fill="currentColor" />
  </svg>
);

const progressBarStyles = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  height: '100%',
  backgroundColor: 'var(--primary)',
  transition: 'width 0.1s ease',
};

export const Podcast: React.FC<any> = ({ title }) => {
  const [data, setData] = React.useState<any>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [showDynamicIsland, setShowDynamicIsland] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const podcastRef = React.useRef<HTMLDivElement>(null)
  const isPodcastVisible = useIntersectionObserver(podcastRef, { threshold: 0 })

  React.useEffect(() => {
    if (!title) return;

    fetch('/api/podcast', {
      method: 'POST',
      body: JSON.stringify({ title }),
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setData(data)
      })

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [title]);

  const handleEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowDynamicIsland(true);
    }
  }

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  }

  const handleBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    if (audioRef.current) {
      const newTime = clickPosition * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }

  const handleIslandTimeSeek = (time: number) => {
    if (audioRef.current && !isNaN(time) && isFinite(time)) {
      audioRef.current.currentTime = time;
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  if (!data || !data.enclosure || data.length === 0) {
    return null;
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div ref={podcastRef} className='podcast' style={{
        width: isPlaying ? '100%' : 'fit-content',
        marginTop: '-0.6em',
        marginBottom: '2em',
      }}>
        <audio
          ref={audioRef}
          src={data.enclosure.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1em'
        }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlayPause}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px',
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </motion.button>
          <span style={{ opacity: .5, fontSize: '14px' }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div style={{ flex: 1 }}>
            <div
              onClick={handleWaveformClick}
              style={{
                position: 'relative',
                height: '4px',
                borderRadius: '2px',
                cursor: 'pointer',
                overflow: 'hidden',
                backgroundColor: 'var(--primary-light)',
              }}
            >
              <div
                style={{
                  ...progressBarStyles,
                  width: `${progress}%`,
                  animation: isPlaying ? 'wave 1s ease-in-out infinite' : 'none',
                  transformOrigin: 'center',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {(!isPodcastVisible && showDynamicIsland) &&
        <Player title={title}
          currentTime={formatTime(currentTime)}
          duration={formatTime(duration)}
          isPlaying={isPlaying}
          onTogglePlayPause={togglePlayPause}
          onTimeUpdate={handleIslandTimeSeek}
          onForward={handleForward}
          onBackward={handleBackward}
        />}
    </>
  )
}


const Player = ({ title, currentTime, duration, isPlaying, onTogglePlayPause, onTimeUpdate, onForward, onBackward }) => {
  const [musicPlayerState, setMusicPlayerState] = useState<DynamicIslandSize>('compact')
  const dynamicIslandRef = useRef(null)

  const ref = useRef(null)
  const inViewport = useIntersection(ref, '0px')

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dynamicIslandRef.current &&
        !(dynamicIslandRef.current as any).contains(event.target as Node)) {
        setMusicPlayerState('compact')
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (inViewport) {
      setTimeout(() => {
        setMusicPlayerState('ultra')
      }, 2000)
    } else {
      setMusicPlayerState('compact')
    }
  }, [inViewport])

  return (
    <div className='fixed bottom-2 left-1/2 transform -translate-x-1/2 w-[fit-content] py-4 z-[999]'>
      <div ref={dynamicIslandRef}>
        <DynamicIsland
          id='music-player'
          default='compact'
          state={musicPlayerState}
          setState={setMusicPlayerState}
          onClick={musicPlayerState === 'compact' ?
            () => setMusicPlayerState('ultra') :
            () => setMusicPlayerState('compact')}
        >
          <DynamicIslandMusicPlayer
            size={musicPlayerState}
            title={title}
            currentTime={currentTime}
            duration={duration}
            isPlaying={isPlaying}
            onTogglePlayPause={onTogglePlayPause}
            onTimeUpdate={onTimeUpdate}
            onForward={onForward}
            onBackward={onBackward}
          />
        </DynamicIsland>
      </div>

      <div className={musicPlayerState === 'compact' ? '' : 'hidden'}>
        <Squircle size='compact' />
      </div>
      <div className={musicPlayerState === 'ultra' ? '' : 'hidden'}>
        <Squircle size='ultra' />
      </div>
    </div>
  )
}