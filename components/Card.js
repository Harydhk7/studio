export default function Card({title, children, image}){
  return (
    <div className="border rounded-lg overflow-hidden">
      {image && <img src={image} alt="" className="w-full h-48 object-cover" />}
      <div className="p-4">
        <h3 className="font-semibold mb-2">{title}</h3>
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </div>
  )
}