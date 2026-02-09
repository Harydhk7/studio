'use client'
import Link from 'next/link'

export default function WeddingTypesShowcase({types = []}) {
  if (!types.length) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="container">
        <h2 className="text-4xl font-bold mb-12 text-center">Our Wedding Services</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type, idx) => (
            <Link 
              key={idx}
              href={type.link || '#'}
              className="group"
            >
              <div className="relative overflow-hidden rounded-lg h-64 mb-4">
                <img 
                  src={type.image || '/images/placeholder.png'}
                  alt={type.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition"></div>
              </div>
              <h3 className="text-xl font-bold text-center group-hover:text-yellow-600 transition">
                {type.name}
              </h3>
              {type.description && (
                <p className="text-gray-600 text-sm text-center mt-2">{type.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
