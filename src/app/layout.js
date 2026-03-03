import './globals.css'

import './globals.css'

export const viewport = {
    themeColor: '#020617',
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
        statusBarStyle: 'default',
        title: 'Mafia Culture',
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
        <html lang="fr">
            <body>
                {children}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </body>
        </html>
    )
}
