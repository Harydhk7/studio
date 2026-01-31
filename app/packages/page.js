import { getPackages } from '../../lib/content'

export default function Packages(){
  const packs = require('../../lib/content').getPackages() || []

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Packages</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packs.map((p, i)=> (
          <div key={i} className="p-4 border rounded">
            <h3 className="font-semibold">{p.title}</h3>
            <div className="text-lg font-bold mt-2">{p.price}</div>
            <p className="text-sm text-gray-700 mt-2">{p.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}