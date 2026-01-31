'use client'

export default function ContactForm(){
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold">Contact form</h3>
      <p className="text-sm text-gray-600 mt-2">This form is static — configure your preferred form provider or mailto link in the CMS.</p>
      <form className="mt-4 space-y-2" onSubmit={(e)=>e.preventDefault()}>
        <input className="w-full border px-3 py-2 rounded" placeholder="Name" />
        <input className="w-full border px-3 py-2 rounded" placeholder="Email" />
        <textarea className="w-full border px-3 py-2 rounded" placeholder="Message" rows="4"></textarea>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Send</button>
      </form>
    </div>
  )
}