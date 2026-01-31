import { getHome } from '../lib/content'

export default function Home() {
  const home = require('../lib/content').getHome() || {}

  return (
    <section>
      <div className="rounded-lg overflow-hidden mb-8">
        <img src={home.heroImage || '/images/placeholder.png'} alt="hero" className="w-full h-64 object-cover" />
        <div className="-mt-20 container">
          <div className="bg-white p-6 rounded shadow">
            <h1 className="text-3xl font-bold">{home.title || 'Studio Title'}</h1>
            <p className="mt-2 text-gray-700">{home.subtitle || 'Subtitle editable via CMS'}</p>
            <a href={home.ctaLink || '/contact'} className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded">{home.ctaText || 'Contact Us'}</a>
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">About</h2>
        <div className="prose max-w-none text-gray-700">{home.about || 'About section editable via CMS'}</div>
      </section>
    </section>
  )
}