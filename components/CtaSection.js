export default function CtaSection() {
  return (
    <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black">
      <div className="container text-center">
        <h2 className="text-4xl font-bold mb-4">Ready to Preserve Your Love Story?</h2>
        <p className="text-lg mb-8 opacity-90">
          Let us capture the precious moments of your special day with artistry and passion
        </p>
        <a 
          href="/contact"
          className="inline-block bg-black text-white px-8 py-3 rounded font-semibold hover:bg-gray-900 transition"
        >
          Book a Consultation
        </a>
      </div>
    </section>
  )
}
