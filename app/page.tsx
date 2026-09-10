'use client';

import Link from 'next/link';
import { FaInstagram, FaLinkedin, FaTiktok } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { Dela_Gothic_One, Montserrat } from 'next/font/google';

const delaGothicOne = Dela_Gothic_One({
  weight: '400',
  subsets: ['latin'],
});

const montserrat = Montserrat({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

// export const dynamic = 'force-dynamic';
// export const revalidate = 0;
// export const fetchCache = 'force-no-store';

export default function Home() {
  return (
    <div
      className="min-h-screen w-full font-sans flex flex-col relative"
      style={{
        backgroundImage: `url('/images/social-background-3.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-65 pointer-events-none z-0" />

      {/* Centered content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-screen md:px-0 px-2">
        {/* Brand name */}
        <span className={`text-white text-4xl tracking-widest ${delaGothicOne.className}`}>KLQUE</span>

        {/* Main headline */}
        <h1 className={`mt-10 font-bold text-white text-3xl md:text-6xl lg:text-8xl text-center leading-tight mb-6 ${montserrat.className}`}>
          build a community,<br /> not just a following
        </h1>

        {/* Subheadline */}
        <p className={`text-gray-200 text-lg md:text-2xl text-center mb-10 max-w-[81%] ${montserrat.className}`}>
          let's get your brand seen without needing a content team
        </p>

        {/* CTA Button */}
        <Link href="/welcome" className="inline-block">
          <button
            className={`bg-white text-black font-medium text-lg md:text-xl px-8 py-4 rounded shadow-md hover:bg-gray-100 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${montserrat.className}`}
          >
            check it out
          </button>
        </Link>
      </div>

      {/* Bottom Bar - Social Icons Only */}
      <div className="fixed bottom-0 left-0 w-full z-30">
        <div className="flex items-center justify-end px-4 sm:px-8 py-3 bg-gradient-to-t from-black/60 to-transparent">
          {/* Social Icons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://x.com/Klque_ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white rounded-full h-6 w-6 sm:h-8 sm:w-8"
            >
              <FontAwesomeIcon icon={faXTwitter} className="text-black text-sm sm:text-lg" />
            </a>
            <a
              href="https://www.instagram.com/klque.tribe?igsh=eGQ1Y21zc3RsYXRr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white rounded-full h-6 w-6 sm:h-8 sm:w-8"
            >
              <FaInstagram className="text-black text-sm" size={16} />
            </a>
            <a
              href="https://www.linkedin.com/company/klque/about/?viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white rounded-full h-6 w-6 sm:h-8 sm:w-8"
            >
              <FaLinkedin className="text-black text-sm" size={16} />
            </a>
            <a
              href="https://www.tiktok.com/@klque.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-white rounded-full h-6 w-6 sm:h-8 sm:w-8"
            >
              <FaTiktok className="text-black text-sm" size={16} />
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}