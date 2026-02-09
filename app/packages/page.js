export default function PackagesPage() {
  const packages = [
    {
      name: "Starter Package",
      price: "₹50,000",
      duration: "4 Hours",
      highlights: [
        "Pre-wedding session",
        "High-resolution photos",
        "Professional editing",
        "Digital album (100 photos)",
        "Usage rights"
      ],
      popular: false
    },
    {
      name: "Premium Package",
      price: "₹1,00,000",
      duration: "Full Day",
      highlights: [
        "Full-day coverage",
        "Multiple photoshoots",
        "High-resolution photos",
        "Professional editing",
        "Digital album (300+ photos)",
        "Printed album",
        "Videography (4 mins)",
        "Usage rights"
      ],
      popular: true
    },
    {
      name: "Luxury Package",
      price: "₹1,50,000+",
      duration: "Extended",
      highlights: [
        "Extended coverage",
        "Pre-wedding & events",
        "Cinematography",
        "Drone photography",
        "4K videography",
        "Premium album",
        "Album & Magazine",
        "Destination travel",
        "24/7 support"
      ],
      popular: false
    }
  ]

  return (
    <main>
      <section className="py-20 bg-gray-100">
        <div className="container">
          <h1 className="text-5xl font-bold text-center mb-4">Our Packages</h1>
          <p className="text-center text-gray-600 text-lg">Flexible pricing options to suit your needs</p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, idx) => (
              <div 
                key={idx}
                className={`rounded-lg overflow-hidden transition ${
                  pkg.popular 
                    ? 'ring-2 ring-yellow-400 transform md:scale-105' 
                    : 'border'
                }`}
              >
                {pkg.popular && (
                  <div className="bg-yellow-400 text-black py-2 text-center font-bold text-sm">
                    MOST POPULAR
                  </div>
                )}
                
                <div className={`p-8 ${pkg.popular ? 'bg-gray-50' : 'bg-white'}`}>
                  <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-yellow-600">{pkg.price}</span>
                    <p className="text-gray-600 text-sm mt-2">{pkg.duration} of photography</p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-600 font-bold mt-0.5">✓</span>
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>

                  <button className={`w-full py-3 rounded font-semibold transition ${
                    pkg.popular
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300'
                      : 'bg-gray-200 text-black hover:bg-gray-300'
                  }`}>
                    Inquire Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 bg-yellow-50 p-8 rounded-lg text-center">
            <h2 className="text-3xl font-bold mb-4">Custom Packages Available</h2>
            <p className="text-gray-700 mb-6">
              We understand every wedding is unique. Contact us to discuss custom packages tailored to your specific needs and budget.
            </p>
            <a 
              href="/contact"
              className="inline-block bg-yellow-400 text-black px-8 py-3 rounded font-semibold hover:bg-yellow-300 transition"
            >
              Get Custom Quote
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-8 text-center">What's Included in Every Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Photography</h3>
              <ul className="space-y-2">
                <li>✓ Professional photographers</li>
                <li>✓ High-end gear & equipment</li>
                <li>✓ Expert composition & lighting</li>
                <li>✓ RAW & edited files</li>
                <li>✓ Quick turnaround time</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Deliverables</h3>
              <ul className="space-y-2">
                <li>✓ High-resolution images</li>
                <li>✓ Digital gallery</li>
                <li>✓ Print-ready files</li>
                <li>✓ Album design assistance</li>
                <li>✓ Lifetime support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}