export default function Team(){
  const team = require('../../lib/content').getTeam() || []

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Team</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {team.map((m, i)=> (
          <div key={i} className="text-center p-4 border rounded">
            <img src={m.photo || '/images/placeholder.png'} alt={m.name} className="w-32 h-32 rounded-full mx-auto object-cover" />
            <h4 className="mt-3 font-semibold">{m.name}</h4>
            <div className="text-sm text-gray-600">{m.role}</div>
          </div>
        ))}
      </div>
    </section>
  )
}