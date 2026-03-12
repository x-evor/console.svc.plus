/* eslint-disable @next/next/no-page-custom-font */

export const dynamic = 'error'

import './globals.css'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/react'
import { AppProviders } from './AppProviders'
import { getConsoleIntegrationDefaults } from '@/server/consoleIntegrations'

const DEFAULT_TITLE = 'Cloud-Neutral Console | Unified Cloud Native Tools'
const DEFAULT_DESCRIPTION =
  'Cloud-Neutral Console unifies cloud-native operations. Manage infrastructure, deployment, identity, and observability across providers from one control plane.'
const DEFAULT_OG_IMAGE = '/icons/webchat.jpg'

export const metadata: Metadata = {
  metadataBase: new URL('https://console.svc.plus'),
  title: {
    default: DEFAULT_TITLE,
    template: '%s | Cloud-Neutral',
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: 'Cloud-Neutral Console',
  category: 'technology',
  keywords: ['cloud native', 'kubernetes', 'infrastructure', 'devops', 'cloud management', 'multi-cloud', 'platform engineering'],
  authors: [{ name: 'Cloud-Neutral Team' }],
  creator: 'Cloud-Neutral',
  publisher: 'Cloud-Neutral',
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    siteName: 'Cloud-Neutral',
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Cloud-Neutral Console',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

const htmlAttributes = { lang: 'en' }
const bodyClassName = 'bg-[var(--color-background)] text-[var(--color-text)]'
const GA_ID = 'G-T4VM8G4Q42'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const assistantDefaults = getConsoleIntegrationDefaults()

  return (
    <html {...htmlAttributes}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Cloud-Neutral',
              url: 'https://console.svc.plus',
              logo: 'https://console.svc.plus/icons/cloudnative_32.png',
              description: DEFAULT_DESCRIPTION,
            }).replace(/</g, '\\u003c'),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Cloud-Neutral',
              url: 'https://console.svc.plus',
              description: DEFAULT_DESCRIPTION,
            }).replace(/</g, '\\u003c'),
          }}
        />
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
        {/* Cloudflare Web Analytics */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "CF_TOKEN_PLACEHOLDER"}'
          strategy="afterInteractive"
        />
        {/* End Cloudflare Web Analytics */}
      </head>
      <body className={bodyClassName}>
        <AppProviders assistantDefaults={assistantDefaults}>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  )
}
