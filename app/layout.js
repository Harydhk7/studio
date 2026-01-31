import '../styles/globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Studio',
  description: 'Studio website managed with Decap CMS'
}

export default function RootLayout({children}){
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container py-8">{children}</main>
        <Footer />
      </body>
    </html>
  )
}