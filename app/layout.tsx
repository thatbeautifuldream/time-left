import { ThemeProvider } from '@/components/theme-provider'
import type { Metadata } from 'next'
import { Bricolage_Grotesque } from 'next/font/google'
import './globals.css'

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Time Left',
  description: 'Time left to live',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bricolageGrotesque.className}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
