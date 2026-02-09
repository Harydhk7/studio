export default function AboutPage() {
  return (
    <main>
      <section className="py-20 bg-gray-100">
        <div className="container">
          <h1 className="text-5xl font-bold text-center mb-4">About SpotFreeze</h1>
          <p className="text-center text-gray-600 text-lg">Our Story, Our Mission, Our Passion</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-3xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Our Story</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              SpotFreeze Photography was founded with a singular mission: to capture the authentic emotions and timeless moments of weddings. What started as a passion project has grown into one of the country's leading wedding photography studios.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We've had the privilege of capturing over 500+ weddings, documenting love stories across multiple cultures, traditions, and continents. Each wedding is unique, and we approach every single one with the same level of enthusiasm, creativity, and dedication.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">Our Philosophy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We believe that wedding photography is not just about taking pictures. It's about weaving love stories, capturing genuine emotions, and creating visual narratives that couples can relive forever.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We don't pose stiffly or stage moments. Instead, we blend into your wedding day, anticipate precious moments, and capture authentic emotions. Your wedding day should be about celebrating love - our job is to document that celebration beautifully.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">Our Team</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Our team of 25+ professional photographers and videographers brings diverse perspectives and years of experience. We work as a cohesive unit, supporting each other to deliver excellence.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Each team member is certified, insured, and trained in the latest photography techniques. More importantly, they share our passion for capturing love and creating memories.
            </p>
          </div>

          <div className="bg-yellow-50 p-8 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Why Choose Us?</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold mt-1">✓</span>
                <span>500+ weddings photographed with consistent 5-star ratings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold mt-1">✓</span>
                <span>Experience across all cultures and traditions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold mt-1">✓</span>
                <span>Premium high-end equipment and expert post-processing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold mt-1">✓</span>
                <span>Multiple packages to fit every budget</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-600 font-bold mt-1">✓</span>
                <span>Personalized service with genuine care</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  )
}
