import { useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'

import type { BrandNavigationHandle } from '@/brand/components/BrandNavigation'
import BrandSignal from '@/concepts/skiing/components/BrandSignal'
import SkiingNavbar from '@/concepts/skiing/components/SkiingNavbar'

const backgroundVideo =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4'
const backgroundPoster = '/assets/brand/skiing-poster.jpg'
const inlinePlaybackAttributes = {
  'webkit-playsinline': 'true',
  'x5-playsinline': 'true',
  'x5-video-player-type': 'h5-page',
} as const

interface WeixinJSBridge {
  invoke: (method: string, params: Record<string, never>, callback: () => void) => void
}

type WeixinWindow = Window & {
  readonly WeixinJSBridge?: WeixinJSBridge
}

function getWeixinJSBridge() {
  return (window as WeixinWindow).WeixinJSBridge
}

interface SkiingHeroProps {
  readonly onCapabilityOpenChange?: ((open: boolean) => void) | undefined
  readonly onGroupNavigate?: (() => void) | undefined
}

export default function SkiingHero({ onCapabilityOpenChange, onGroupNavigate }: SkiingHeroProps) {
  const reducedMotion = useReducedMotion()
  const navigationRef = useRef<BrandNavigationHandle>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const tryPlayVideo = useCallback(async () => {
    const video = videoRef.current

    if (!video) return

    video.muted = true
    video.defaultMuted = true
    try {
      await video.play()
    } catch {
      // Autoplay failures remain silent; touch and WeChat retries stay active.
    }
  }, [])

  const tryPlayVideoThroughWeixinBridge = useCallback(() => {
    const bridge = getWeixinJSBridge()

    if (!bridge) {
      void tryPlayVideo()
      return
    }

    try {
      bridge.invoke('getNetworkType', {}, () => void tryPlayVideo())
    } catch {
      void tryPlayVideo()
    }
  }, [tryPlayVideo])

  useEffect(() => {
    if (reducedMotion) return

    document.addEventListener('WeixinJSBridgeReady', tryPlayVideoThroughWeixinBridge)
    document.addEventListener('touchstart', tryPlayVideo, { once: true, passive: true })
    void tryPlayVideo()
    if (getWeixinJSBridge()) tryPlayVideoThroughWeixinBridge()

    return () => {
      document.removeEventListener('WeixinJSBridgeReady', tryPlayVideoThroughWeixinBridge)
      document.removeEventListener('touchstart', tryPlayVideo)
    }
  }, [reducedMotion, tryPlayVideo, tryPlayVideoThroughWeixinBridge])

  return (
    <section id="top" className="relative min-h-[100dvh] w-full overflow-hidden bg-black">
      <img
        alt="滑雪运动员穿越雪地"
        className="absolute inset-0 h-full w-full object-cover"
        height="1072"
        loading="eager"
        src={backgroundPoster}
        width="1928"
      />
      {!reducedMotion ? (
        <video
          ref={videoRef}
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          loop
          muted
          onCanPlay={() => void tryPlayVideo()}
          playsInline
          poster={backgroundPoster}
          preload="auto"
          src={backgroundVideo}
          {...inlinePlaybackAttributes}
        />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_18%_46%,rgba(0,0,0,0.48),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.36),transparent_28%,transparent_72%,rgba(0,0,0,0.3))]"
      />

      <SkiingNavbar
        ref={navigationRef}
        onCapabilityOpenChange={onCapabilityOpenChange}
        onGroupNavigate={onGroupNavigate}
      />

      <div className="relative z-10 min-h-[100dvh] w-full">
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-48 bg-gradient-to-b from-transparent to-black" />

        <h1 aria-label="enjoy your passion" className="pointer-events-none absolute inset-0 z-10">
          <span className="hero-title hero-title--enjoy absolute left-[4vw] top-[22%] text-[15vw] font-medium text-white md:left-10 md:top-[18%] md:text-[12vw]">
            enjoy
          </span>
          <span className="hero-title hero-title--your absolute right-[4vw] top-[38%] text-[15vw] font-medium text-white md:right-10 md:top-[38%] md:text-[12vw]">
            your
          </span>
          <span className="hero-title hero-title--passion absolute left-[10vw] top-[61%] text-[15vw] font-medium text-white md:left-[28%] md:top-[58%] md:text-[12vw]">
            passion
          </span>
        </h1>

        <p className="hero-copy absolute left-6 top-[49%] z-10 max-w-[280px] text-sm font-medium leading-relaxed text-white/95 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)] md:left-10 md:top-[46%] md:text-[15px]">
          享受你的热爱。
          <br />
          以数字产品、内容运营与影视制作创造价值，也让体育热爱持续发生。
        </p>

        <BrandSignal
          ariaLabel="打开体育能力说明"
          className="hero-signal--sports absolute right-4 top-24 z-10 md:right-24 md:top-[14%]"
          dividerClassName="rotate-[20deg]"
          dividerPosition="before"
          label="体育社区"
          onClick={(event) => navigationRef.current?.openCapability('sports', event.currentTarget)}
          value="SPORTS"
        />
        <BrandSignal
          ariaLabel="打开数字能力说明"
          className="hero-signal--digital absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-5 z-10 md:bottom-24 md:left-20"
          dividerClassName="rotate-[20deg]"
          dividerPosition="after"
          label="数字产品"
          onClick={(event) => navigationRef.current?.openCapability('digital', event.currentTarget)}
          value="DIGITAL"
        />
        <BrandSignal
          ariaLabel="打开影视能力说明"
          className="hero-signal--film absolute left-4 top-24 z-10 md:left-auto md:right-[12%] md:top-[32%]"
          dividerClassName="rotate-[-20deg]"
          dividerPosition="after"
          label="影视制作"
          onClick={(event) => navigationRef.current?.openCapability('film', event.currentTarget)}
          value="FILM"
        />
        <BrandSignal
          ariaLabel="打开内容能力说明"
          className="hero-signal--content absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-5 z-10 md:bottom-20 md:right-20"
          dividerClassName="rotate-[-20deg]"
          dividerPosition="before"
          label="内容运营"
          onClick={(event) => navigationRef.current?.openCapability('content', event.currentTarget)}
          value="CONTENT"
        />
      </div>
    </section>
  )
}
