'use client'
import Link from 'next/link'

export default function FeaturedWorks({works = []}) {
  if (!works.length) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="text-4xl font-bold mb-4 text-center">Featured Works</h2>
        <p className="text-center text-gray-600 mb-12">
          Discover some of our memorable wedding stories
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {works.map((work, idx) => (
            <Link key={idx} href={work.link || '#'}>
              <div className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg h-80 mb-4">
                  <img 
                    src={work.image || '/images/placeholder.png'}
                    alt={work.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 transition font-bold text-lg">
                      View Story →
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:text-yellow-600 transition">{work.title}</h3>
                <p className="text-gray-600">{work.description}</p>
                {work.date && (
                  <p className="text-sm text-gray-500 mt-2">{work.date}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/gallery"
            className="inline-block bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-900 transition"
          >
            View All Works
          </Link>
        </div>
      </div>
    </section>
  )
}
