import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="bg-white border-b">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="text-xl font-semibold">Studio</Link>
        <nav className="space-x-4 text-sm">
          <Link href="/services">Services</Link>
          <Link href="/packages">Packages</Link>
          <Link href="/team">Team</Link>
          <Link href="/works">Works</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
    </header>
  )
}