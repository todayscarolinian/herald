// Mirrors the TC brand tokens defined in apps/core/app/globals.css (--tc_*).
// Duplicated as literal hex values because email clients don't reliably
// support CSS custom properties.
export const emailTheme = {
  primary: {
    600: '#9b2626',
    700: '#842020',
    800: '#711d1d',
  },
  secondary: {
    300: '#fdf2e7',
    400: '#e7ddd1',
  },
  grayscale: {
    600: '#4b5563',
    900: '#111827',
  },
  text: '#1f2937',
  white: '#ffffff',
} as const

export function getHeraldLogoUrl() {
  const baseCoreUrl = process.env.NEXT_PUBLIC_CORE_URL ?? 'https://herald.todayscarolinian.com'
  return `${baseCoreUrl}/tc-logo-red.png`
}
