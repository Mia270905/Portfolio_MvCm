// /src/fonts/benedict.ts
import localFont from 'next/font/local'

// Configuración para fuentes locales (.otf)
export const benedict = localFont({
  src: [
    {
      path: '../../public/fonts/benedict-regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-benedict',
  display: 'swap',
})