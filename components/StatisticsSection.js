'use client'

export default function StatisticsSection({stats = []}) {
  return (
    <section className="py-16 bg-gray-900 text-white">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, idx) => (
            <div key={idx}>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">
                {stat.value}
              </div>
              <p className="text-gray-300 text-sm md:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
