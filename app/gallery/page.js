export default function GalleryPage() {
  const galleryCategories = [
    {
      title: "Bridal Portraits",
      description: "Stunning bridal shots capturing the beauty of the bride",
      image: "/images/placeholder.png",
      count: "150+ Photos"
    },
    {
      title: "Couple Portraits",
      description: "Timeless moments of the couple in love",
      image: "/images/placeholder.png",
      count: "200+ Photos"
    },
    {
      title: "Candid Moments",
      description: "Unscripted emotions and genuine laughter",
      image: "/images/placeholder.png",
      count: "500+ Photos"
    },
    {
      title: "Groom Portraits",
      description: "Stylish and elegant groom photography",
      image: "/images/placeholder.png",
      count: "120+ Photos"
    },
    {
      title: "Jewellery & Details",
      description: "Close-up shots of rings, accessories and details",
      image: "/images/placeholder.png",
      count: "300+ Photos"
    },
    {
      title: "Wedding Rituals",
      description: "Sacred moments from wedding ceremonies",
      image: "/images/placeholder.png",
      count: "400+ Photos"
    }
  ]

  return (
    <main>
      <section className="py-20 bg-gray-100">
        <div className="container">
          <h1 className="text-5xl font-bold text-center mb-4">Our Gallery</h1>
          <p className="text-center text-gray-600 text-lg">Explore our collection of beautiful wedding photography</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleryCategories.map((category, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="relative overflow-hidden rounded-lg h-64 mb-4">
                  <img 
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition flex items-center justify-center">
                    <div className="text-center text-white">
                      <h3 className="text-2xl font-bold mb-2">{category.title}</h3>
                      <p className="text-sm">{category.count}</p>
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-center">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
