/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // ── Stitch "Cinematic Noir" Design System Tokens ──
                surface: '#131317',
                'surface-dim': '#131317',
                'surface-bright': '#39393d',
                'surface-container': '#1f1f23',
                'surface-container-low': '#1b1b1f',
                'surface-container-lowest': '#0e0e12',
                'surface-container-high': '#2a292e',
                'surface-container-highest': '#353439',
                'surface-variant': '#353439',
                'surface-tint': '#d3bbff',

                primary: '#d3bbff',
                'primary-container': '#6d28d9',
                'primary-fixed': '#ebddff',
                'primary-fixed-dim': '#d3bbff',

                secondary: '#ffb4ac',
                'secondary-container': '#921517',
                'secondary-fixed': '#ffdad6',

                tertiary: '#ffb68b',
                'tertiary-container': '#8f4200',

                'on-surface': '#e4e1e7',
                'on-surface-variant': '#ccc3d7',
                'on-primary': '#3f008d',
                'on-primary-container': '#dac5ff',
                'on-secondary': '#690007',
                'on-secondary-container': '#ff9f95',

                outline: '#958da1',
                'outline-variant': '#4a4455',

                'inverse-surface': '#e4e1e7',
                'inverse-on-surface': '#303034',
                'inverse-primary': '#7331df',

                error: '#ffb4ab',
                'error-container': '#93000a',
                'on-error': '#690005',
                'on-error-container': '#ffdad6',
            },
            fontFamily: {
                display: ['var(--font-space)', 'sans-serif'],
                sans: ['var(--font-inter)', 'sans-serif'],
            },
            screens: {
                'mobile': '480px',
                'tablet': '768px',
                'desktop': '1024px',
                'largeDesktop': '1440px',
            },
            transitionDuration: {
                DEFAULT: '250ms',
            },
            backgroundImage: {
                'noir-gradient': 'linear-gradient(135deg, #d3bbff, #6d28d9)',
                'danger-gradient': 'linear-gradient(135deg, #ffb4ac, #921517)',
            },
            boxShadow: {
                'glow-primary': '0 0 20px rgba(109, 40, 217, 0.3)',
                'glow-secondary': '0 0 20px rgba(146, 21, 23, 0.3)',
                'ambient': '0 20px 60px rgba(228, 225, 231, 0.04)',
            },
        },
    },
    plugins: [],
}
