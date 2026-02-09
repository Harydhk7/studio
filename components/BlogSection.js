'use client'
import Link from 'next/link'

export default function BlogSection({posts = []}) {
  if (!posts.length) return null

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <h2 className="text-4xl font-bold mb-12">Latest Articles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.slice(0, 3).map((post, idx) => (
            <article key={idx} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
              {post.image && (
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-5">
                <p className="text-sm text-gray-500 mb-2">{post.date}</p>
                <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link 
                  href={post.link || '#'}
                  className="text-yellow-600 font-semibold hover:underline"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/blog"
            className="inline-block bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-900 transition"
          >
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  )
}
