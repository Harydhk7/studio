import HeroSection from '../components/HeroSection'
import StatisticsSection from '../components/StatisticsSection'
import WhyChooseUs from '../components/WhyChooseUs'
import WeddingTypesShowcase from '../components/WeddingTypesShowcase'
import FeaturedWorks from '../components/FeaturedWorks'
import TestimonialSlider from '../components/TestimonialSlider'
import BlogSection from '../components/BlogSection'
import InstagramFeed from '../components/InstagramFeed'
import CtaSection from '../components/CtaSection'
import { getHome } from '../lib/content'

export default function Home() {
  const home = require('../lib/content').getHome() || {}
  const gallery = require('../content/gallery.json') || {}
  
  const {
    stats = [],
    whyChooseUs = []
  } = home

  return (
    <>
      <HeroSection home={home} />
      
      {stats && stats.length > 0 && (
        <StatisticsSection stats={stats} />
      )}
      
      {whyChooseUs && whyChooseUs.length > 0 && (
        <WhyChooseUs items={whyChooseUs} />
      )}
      
      {gallery.weddingTypes && gallery.weddingTypes.length > 0 && (
        <WeddingTypesShowcase types={gallery.weddingTypes} />
      )}

      {gallery.featuredWorks && gallery.featuredWorks.length > 0 && (
        <FeaturedWorks works={gallery.featuredWorks} />
      )}
      
      {gallery.testimonials && gallery.testimonials.length > 0 && (
        <TestimonialSlider testimonials={gallery.testimonials} />
      )}
      
      {gallery.blogPosts && gallery.blogPosts.length > 0 && (
        <BlogSection posts={gallery.blogPosts} />
      )}

      <InstagramFeed />
      <CtaSection />
      
      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="container">
          <h2 className="text-4xl font-bold mb-4">Your Love Story Deserves to be Told</h2>
          <p className="text-gray-300 mb-8 text-lg">Let's create beautiful memories together</p>
          <a 
            href="/contact"
            className="inline-block bg-yellow-400 text-black px-8 py-3 rounded font-semibold hover:bg-yellow-300 transition"
          >
            Book Your Date
          </a>
        </div>
      </section>
    </>
  )
}