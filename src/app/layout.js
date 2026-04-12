import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'
import GlobalAudioProvider from '../components/GlobalAudioProvider'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport = {
    themeColor: '#131317',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
}

export const metadata = {
    metadataBase: new URL('https://mafiaculture.vercel.app'),
    title: 'Play Mafia Online | Multiplayer Social Deduction Game | Mafia Culture',
    description: 'Join Mafia Culture online. Experience the ultimate real-time voice multiplayer mafia game. Will you survive the night? Play now.',
    manifest: '/manifest.json',
    alternates: {
        canonical: '/',
    },
    openGraph: {
        title: 'Mafia Culture | Play Real-Time Voice Mafia Online',
        description: 'Join the ultimate multiplayer social deduction game. Lie, investigate, and survive the night with real-time voice chat.',
        url: 'https://mafiaculture.vercel.app',
        siteName: 'Mafia Culture',
        locale: 'fr_FR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Mafia Culture | Play Real-Time Voice Mafia Online',
        description: 'Join the ultimate multiplayer social deduction game. Lie, investigate, and survive the night with real-time voice chat.',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Mafia Culture',
    },
    other: {
        'mobile-web-app-capable': 'yes',
    },
}

export default function RootLayout({ children }) {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": "Mafia Culture",
        "url": "https://mafiaculture.vercel.app/",
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web",
        "description": "Play Mafia Culture online with real-time voice chat and multiplayer gameplay.",
        "genre": "Social Deduction"
    }

    return (
        <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
            <head>
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
                <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
            </head>
            <body>
                <GlobalAudioProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </GlobalAudioProvider>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </body>
        </html>
    )
}
