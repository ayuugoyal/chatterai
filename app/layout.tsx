import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import Script from "next/script"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Chatter AI - Create AI Chatbots for Your Website",
  description: "Create, customize, and deploy AI chatbots on your website with Chatter AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Script src="http://localhost:3000/embed.js" data-slug="test-xnozgd"></Script>
        </ThemeProvider>
      </body>
    </html >
  )
}
