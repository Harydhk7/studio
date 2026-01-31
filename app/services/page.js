import { getServices } from '../../lib/content'

export default function Services(){
  const services = require('../../lib/content').getServices() || []

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((s, i)=> (
          <div key={i} className="p-4 border rounded">
            <h3 className="font-semibold">{s.title}</h3>
            <p className="text-sm text-gray-700">{s.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}