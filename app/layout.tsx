import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpeedTest - Apple Design',
  description: 'Ein eleganter Internet Speedtest im Apple Design',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#007AFF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gradient-to-br from-apple-gray to-blue-50">
        {children}
      </body>
    </html>
  )
}