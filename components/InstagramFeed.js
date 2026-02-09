'use client'

export default function InstagramFeed() {
  const instagramPosts = [
    { id: 1, image: "/images/placeholder.png", likes: 234 },
    { id: 2, image: "/images/placeholder.png", likes: 456 },
    { id: 3, image: "/images/placeholder.png", likes: 789 },
    { id: 4, image: "/images/placeholder.png", likes: 234 },
    { id: 5, image: "/images/placeholder.png", likes: 567 },
    { id: 6, image: "/images/placeholder.png", likes: 890 }
  ]

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">Follow Us on Instagram</h2>
          <p className="text-gray-600">@spotfreezephotography</p>
          <a 
            href="https://instagram.com/spotfreezephotography"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-pink-600 font-semibold hover:text-pink-700"
          >
            Follow for more →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {instagramPosts.map((post) => (
            <div 
              key={post.id}
              className="relative group overflow-hidden rounded-lg h-64"
            >
              <img 
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover group-hover:scale-110 transition"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                <span className="text-white opacity-0 group-hover:opacity-100 transition font-semibold">
                  ❤️ {post.likes}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
