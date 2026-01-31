import ContactForm from '../../components/ContactForm'

export default function Contact(){
  const site = require('../../lib/content').getSiteSettings() || {}

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Contact</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Get in touch</h3>
          <p className="mt-2 text-sm text-gray-700">Address: {site.address || '—'}</p>
          <p className="mt-1 text-sm text-gray-700">Email: {site.email || '—'}</p>
          <p className="mt-1 text-sm text-gray-700">Phone: {site.phone || '—'}</p>
        </div>

        <ContactForm />
      </div>
    </section>
  )
}