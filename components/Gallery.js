export default function Gallery({items=[]}){
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((it, i)=> (
        <div key={i} className="rounded overflow-hidden border">
          <img src={it.image} alt={it.title} className="w-full h-48 object-cover" />
          <div className="p-3">
            <h4 className="font-semibold">{it.title}</h4>
            <p className="text-sm text-gray-600">{it.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}