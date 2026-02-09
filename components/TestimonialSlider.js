'use client'
import { useState, useEffect } from 'react'

export default function TestimonialSlider({testimonials = []}) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  if (!testimonials.length) return null

  const testimony = testimonials[current]

  return (
    <section className="py-20 bg-gray-50">
      <div className="container max-w-2xl mx-auto text-center">
        <h2 className="text-4xl font-bold mb-12">Client Testimonials</h2>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-xl text-gray-700 mb-4 italic">
            "{testimony.quote}"
          </p>
          <p className="font-bold text-lg">{testimony.author}</p>
          <p className="text-gray-600 text-sm">{testimony.event}</p>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`w-2 h-2 rounded-full transition ${
                idx === current ? 'bg-yellow-400 w-8' : 'bg-gray-300'
              }`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
