/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            screens: {
                'mobile': '480px',
                'tablet': '768px',
                'desktop': '1024px',
                'largeDesktop': '1440px',
            },
            transitionDuration: {
                DEFAULT: '250ms',
            }
        },
    },
    plugins: [],
}
