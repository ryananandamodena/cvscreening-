/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./layouts/**/*.{js,ts,jsx,tsx}",
        "./routes/**/*.{js,ts,jsx,tsx}",
        "./guards/**/*.{js,ts,jsx,tsx}",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Humaniq brand blue (matches the mark's left pillar / icon.png) — was a red
                // scale (#dc2626 "Red Main") left over from an earlier RecruitAI-era palette,
                // mismatched with the actual Humaniq brand mark used across the app.
                brand: {
                    50: '#EAF1FE',
                    100: '#D6E4FD',
                    200: '#B0C9FB',
                    300: '#82A9F8',
                    400: '#5B8FF5',
                    500: '#3B82F6',
                    600: '#0B4DDB', // Humaniq Blue — Main
                    700: '#093FB0', // Hover
                    800: '#0A2E82',
                    900: '#0B2460',
                    950: '#061434',
                },
                // Humaniq brand teal (the mark's right pillar) — secondary accent for highlights
                // that need to read as "brand" without competing with the primary blue.
                accent: {
                    50: '#ECFEFF',
                    100: '#CFFAFE',
                    200: '#A5F3FC',
                    300: '#67E8F9',
                    400: '#2DD4BF',
                    500: '#06B6D4',
                    600: '#0891B2',
                    700: '#0E7490',
                    800: '#155E75',
                    900: '#164E63',
                    950: '#083344',
                },
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                    950: '#020617', // Obsidian
                },
                success: { 50: '#f0fdf4', 100: '#dcfce7', 500: '#22c55e', 600: '#16a34a', 700: '#15803d' },
                warning: { 50: '#fffbeb', 100: '#fef3c7', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
                danger:  { 50: '#fef2f2', 100: '#fee2e2', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c' },
                info:    { 50: '#eff6ff', 100: '#dbeafe', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
            },
            boxShadow: {
                'glow': '0 0 20px rgba(11, 77, 219, 0.35)',
                'glow-lg': '0 0 30px rgba(11, 77, 219, 0.45)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
                'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
            }
        },
    },
    plugins: [],
}
