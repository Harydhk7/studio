import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
  title: 'SpotFreeze Photography - Wedding Photographer',
  description: 'Professional wedding photography capturing authentic moments across diverse cultures and traditions'
}

export default function RootLayout({children}){
  return (
    <html lang="en">
      <body className="bg-white">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}