import './globals.css'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
    title: 'Mafia Online',
    description: 'Le jeu du Loup-Garou / Mafia en temps réel',
    manifest: '/manifest.json',
    themeColor: '#020617',
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Mafia',
    },
}

export default function RootLayout({ children }) {
    return (
        <html lang="fr">
            <body>
                {children}
                <Analytics />
            </body>
        </html>
    )
}
