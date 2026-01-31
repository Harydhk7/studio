import Gallery from '../../components/Gallery'

export default function Works(){
  const works = require('../../lib/content').getWorks() || []

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-6">Works</h1>
      <Gallery items={works.map(w => ({ title: w.title, image: w.image || '/images/placeholder.png', description: w.description }))} />
    </section>
  )
}