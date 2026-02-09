'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">SpotFreeze</h3>
            <p className="text-sm leading-relaxed">
              Capturing timeless moments and transforming genuine happiness into eternal imagery.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/wedding-photography" className="hover:text-yellow-400 transition">Wedding Photography</Link></li>
              <li><Link href="/gallery" className="hover:text-yellow-400 transition">Gallery</Link></li>
              <li><Link href="/blog" className="hover:text-yellow-400 transition">Blog</Link></li>
              <li><Link href="/about" className="hover:text-yellow-400 transition">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Wedding Types</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="hover:text-yellow-400 transition">Traditional Weddings</Link></li>
              <li><Link href="#" className="hover:text-yellow-400 transition">Pre-Wedding Shoots</Link></li>
              <li><Link href="#" className="hover:text-yellow-400 transition">Candid Photography</Link></li>
              <li><Link href="#" className="hover:text-yellow-400 transition">Wedding Films</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:+919840767566" className="hover:text-yellow-400 transition">+91 9840767566</a></li>
              <li><a href="mailto:hello@spotfreeze.in" className="hover:text-yellow-400 transition">hello@spotfreeze.in</a></li>
              <li className="mt-4">
                <div className="space-y-1 text-xs">
                  <p>Chennai | Bangalore</p>
                  <p>Hyderabad | Vellore</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-center md:text-left mb-4 md:mb-0">
              &copy; 2026 SpotFreeze Photography. All rights reserved. Made with ❤️
            </p>
            <div className="flex gap-6">
              <a href="https://instagram.com/spotfreezephotography" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">Instagram</a>
              <a href="https://facebook.com/spotfreeze" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">Facebook</a>
              <a href="https://youtube.com/@spotfreeze" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400 transition">YouTube</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}