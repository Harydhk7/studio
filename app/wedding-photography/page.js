export default function WeddingPhotographyPage() {
  const weddingTypes = [
    {
      name: "Traditional Brahmin Wedding",
      description: "Capturing the sacred rituals and traditions of Brahmin weddings",
      image: "/images/placeholder.png"
    },
    {
      name: "Christian Wedding",
      description: "Beautiful documentation of Christian ceremonies and celebrations",
      image: "/images/placeholder.png"
    },
    {
      name: "Muslim Wedding",
      description: "Elegant capture of Islamic wedding traditions and moments",
      image: "/images/placeholder.png"
    },
    {
      name: "Telugu Wedding",
      description: "Vibrant celebration of Telugu traditions and customs",
      image: "/images/placeholder.png"
    },
    {
      name: "Malayali Wedding",
      description: "Graceful documentation of Kerala's beautiful wedding heritage",
      image: "/images/placeholder.png"
    },
    {
      name: "North-Indian Wedding",
      description: "Capturing the color and energy of Punjabi and North-Indian celebrations",
      image: "/images/placeholder.png"
    }
  ]

  return (
    <main>
      <section className="py-20 bg-gray-100">
        <div className="container">
          <h1 className="text-5xl font-bold text-center mb-4">Wedding Photography Services</h1>
          <p className="text-center text-gray-600 text-lg">Celebrate every tradition with cultural sensitivity and artistic excellence</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {weddingTypes.map((type, idx) => (
              <div key={idx} className="group">
                <div className="relative overflow-hidden rounded-lg h-64 mb-4">
                  <img 
                    src={type.image}
                    alt={type.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition"></div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-600 transition">{type.name}</h3>
                <p className="text-gray-600">{type.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-yellow-50 p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Our Wedding Photography Packages</h2>
            <p className="text-gray-700 mb-6">
              We offer flexible packages tailored to your needs. From full-day coverage to specific event documentation, we have options for every budget and requirement.
            </p>
            <a 
              href="/contact"
              className="inline-block bg-yellow-400 text-black px-8 py-3 rounded font-semibold hover:bg-yellow-300 transition"
            >
              Get a Quote
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
