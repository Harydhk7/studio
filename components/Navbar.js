import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="text-2xl font-bold text-yellow-600">
          SpotFreeze
        </Link>
        
        <nav className="flex items-center gap-8">
          <div className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-yellow-600 transition">
              Home
            </Link>
            <div className="relative group">
              <button className="text-sm font-medium hover:text-yellow-600 transition">
                Weddings
              </button>
              <div className="absolute left-0 pt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
                <Link href="/wedding-photography/traditional" className="block px-4 py-2 hover:bg-gray-100">Traditional Weddings</Link>
                <Link href="/wedding-photography/outdoor" className="block px-4 py-2 hover:bg-gray-100">Outdoor Pre-Wedding</Link>
                <Link href="/wedding-photography/candid" className="block px-4 py-2 hover:bg-gray-100">Candid Shots</Link>
              </div>
            </div>
            <Link href="/gallery" className="text-sm font-medium hover:text-yellow-600 transition">
              Gallery
            </Link>
            <Link href="/blog" className="text-sm font-medium hover:text-yellow-600 transition">
              Blog
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-yellow-600 transition">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-yellow-600 transition">
              Contact
            </Link>
          </div>
          
          <Link 
            href="/contact"
            className="bg-yellow-400 text-black px-6 py-2 rounded font-semibold hover:bg-yellow-300 transition text-sm"
          >
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  )
}