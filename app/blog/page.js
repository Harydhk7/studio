export default function BlogPage() {
  const blogPosts = [
    {
      title: "15 Easy & Effective Wedding Poses for Couple Portraits",
      date: "January 26, 2026",
      image: "/images/placeholder.png",
      excerpt: "Discover 15 amazing wedding poses that will make your couple portraits timeless and beautiful. Our expert guide covers natural, romantic, and striking poses.",
      content: "Wedding photography is all about capturing the love and connection between the couple. In this comprehensive guide, we share 15 of our favorite poses that have worked perfectly for hundreds of couples."
    },
    {
      title: "Elegant Wedding Reception Photography Tips",
      date: "January 26, 2026",
      image: "/images/placeholder.png",
      excerpt: "Master the art of wedding reception photography with our guide on capturing candid moments, group shots, and romantic dances.",
      content: "Reception photography requires a different approach than the ceremony. You need to be quick, anticipatory, and ready to capture those fleeting moments of joy and celebration."
    },
    {
      title: "How to Use Natural Light for Stunning Wedding Photos",
      date: "November 15, 2024",
      image: "/images/placeholder.png",
      excerpt: "Natural light is a photographer's best friend. Learn how to use it effectively for your wedding shoot.",
      content: "Understanding how to work with natural light can transform your wedding photography. Golden hour is your secret weapon for creating warm, romantic, and absolutely stunning images."
    },
    {
      title: "Top 21 Bridal Photography Poses",
      date: "January 19, 2026",
      image: "/images/placeholder.png",
      excerpt: "Ultimate collection of bridal poses that will make you feel confident, beautiful, and cherished.",
      content: "The bride deserves to feel like the queen she is on her wedding day. These 21 poses are designed to make every bride look her absolute best."
    },
    {
      title: "Beach Pre-Wedding Photoshoot Ideas",
      date: "January 12, 2026",
      image: "/images/placeholder.png",
      excerpt: "7 beautiful beach outdoor pre-wedding photoshoot ideas and poses with expert tips.",
      content: "Beach settings offer a romantic and scenic backdrop for pre-wedding shoots. Learn how to maximize the location and create stunning memories."
    }
  ]

  return (
    <main>
      <section className="py-20 bg-gray-100">
        <div className="container">
          <h1 className="text-5xl font-bold text-center mb-4">Our Blog</h1>
          <p className="text-center text-gray-600 text-lg">Tips, ideas, and stories from our wedding photography journey</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-12">
            {blogPosts.map((post, idx) => (
              <article key={idx} className="border-b pb-12 last:border-b-0">
                <div className="mb-4">
                  <img 
                    src={post.image}
                    alt={post.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                <h2 className="text-3xl font-bold mb-4">{post.title}</h2>
                <p className="text-gray-700 mb-4 text-lg">{post.excerpt}</p>
                <p className="text-gray-600 leading-relaxed mb-4">{post.content}</p>
                <button className="text-yellow-600 font-semibold hover:underline">
                  Read Full Article →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
