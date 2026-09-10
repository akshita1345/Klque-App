import { Inter } from "next/font/google";
import "../styles/globals.css";
import { Suspense } from "react";
import Loading from "./loading";
import { Dela_Gothic_One, Montserrat, Plus_Jakarta_Sans } from 'next/font/google'
import ClientLayout from "../components/layout/client-layout";
import 'react-perfect-scrollbar/dist/css/styles.css';

const inter = Inter({
  subsets: ["latin"],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
})

export const delaGothic = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
})

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No direct Google Fonts links needed anymore */}
      </head>
      <body
        className={inter.className}
      >
        <Suspense fallback={<Loading />}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  )
}