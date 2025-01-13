import React from 'react'
import { MotionDiv } from './MotionHtml'
import { DynamicIslandSize } from './types'
import MusicEqualizerStick from './MusicEqualizerStick'
import Image from 'next/image'
import dd from '../../public/podcast.svg'

type Props = {
  size: DynamicIslandSize
  colors: string[]
  before: DynamicIslandSize
  isActive: boolean
}

export const MusicEqualizer = ({ size, colors, before, isActive }: Props) => {
  if(isActive) {
    return (
      <MotionDiv className='grid justify-center h-full grid-cols-6 gap-[1px] bg-transparent' size={size} before={before}>
        <MusicEqualizerStick baseLength={40} colors={colors} />
        <MusicEqualizerStick baseLength={50} colors={colors} />
        <MusicEqualizerStick baseLength={70} colors={colors} />
        <MusicEqualizerStick baseLength={60} colors={colors} />
        <MusicEqualizerStick baseLength={50} colors={colors} />
        <MusicEqualizerStick baseLength={50} colors={colors} />
      </MotionDiv>
    )
  } else {
    return(
      <Image src='https://www.svgrepo.com/show/510135/podcast.svg' width={20} height={20} alt="Podcast icon" style={{filter: 'invert(1)', opacity: .5}} />
    )
  }
 
}
