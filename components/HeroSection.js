'use client'
import Link from 'next/link'

export default function HeroSection({home = {}}) {
  const {
    title = "Welcome to Our Studio",
    subtitle = "",
    heroImage = "/images/placeholder.png",
    ctaText = "Get Started",
    ctaLink = "/contact",
    tagline = ""
  } = home

  return (
    <section className="relative w-full">
      <div className="relative h-96 md:h-screen overflow-hidden">
        <img 
          src={heroImage} 
          alt="Hero" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-lg md:text-2xl mb-8 font-light">
              {subtitle}
            </p>
          )}
          {tagline && (
            <p className="text-sm md:text-base mb-8 italic opacity-90">
              {tagline}
            </p>
          )}
          <Link 
            href={ctaLink}
            className="inline-block bg-white text-black px-8 py-3 rounded font-semibold hover:bg-gray-100 transition"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  )
}
