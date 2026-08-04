import BrandSignal from '@/concepts/skiing/components/BrandSignal'
import SkiingNavbar from '@/concepts/skiing/components/SkiingNavbar'

const backgroundVideo =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_063509_7d167302-4fd4-480b-8260-18ab572333d4.mp4'

export default function SkiingHero() {
  return (
    <section id="top" className="relative min-h-[100dvh] w-full overflow-hidden bg-black">
      <video
        aria-hidden="true"
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        loop
        muted
        playsInline
        src={backgroundVideo}
      />

      <SkiingNavbar />

      <div className="relative z-10 min-h-[100dvh] w-full">
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-48 bg-gradient-to-b from-transparent to-black" />

        <h1 aria-label="enjoy your passion" className="pointer-events-none absolute inset-0 z-10">
          <span className="hero-title absolute left-4 top-[18%] text-[13vw] font-medium text-white md:left-10 md:text-[12vw]">
            enjoy
          </span>
          <span className="hero-title absolute right-4 top-[38%] text-[13vw] font-medium text-white md:right-10 md:text-[12vw]">
            your
          </span>
          <span className="hero-title absolute left-[18%] top-[58%] text-[13vw] font-medium text-white md:left-[28%] md:text-[12vw]">
            passion
          </span>
        </h1>

        <p className="absolute left-6 top-[46%] z-10 max-w-[280px] text-sm leading-relaxed text-white/90 md:left-10 md:text-[15px]">
          享受你的热爱。
          <br />
          以数字产品、内容运营与体育热爱，连接正在发生的未来。
        </p>

        <BrandSignal
          ariaLabel="进入高歌体育"
          className="absolute right-6 top-[14%] z-10 md:right-24"
          dividerClassName="rotate-[20deg]"
          dividerPosition="before"
          href="https://sports.gaoge.cc"
          label="体育热爱"
          value="SPORTS"
        />
        <BrandSignal
          ariaLabel="进入数字产品"
          className="absolute bottom-20 left-6 z-10 md:bottom-24 md:left-20"
          dividerClassName="rotate-[-20deg]"
          dividerPosition="after"
          label="数字产品"
          to="/digital"
          value="DIGITAL"
        />
        <BrandSignal
          ariaLabel="进入内容创造"
          className="absolute bottom-16 right-6 z-10 md:bottom-20 md:right-20"
          dividerClassName="rotate-[-20deg]"
          dividerPosition="before"
          label="内容创造"
          to="/content"
          value="CONTENT"
        />
      </div>
    </section>
  )
}
