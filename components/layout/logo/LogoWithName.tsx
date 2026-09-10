"use client";
import { cn } from '@/lib/utils';
import Light from "@/public/logos/blue-transparent.png";
import Image from 'next/image';
import { CSSProperties } from 'react';

const LogoWithName = ({ className, style }: { className?: string, style?: CSSProperties }) => {
  return (
    <div className="flex items-center justify-start">
      {/* <Image width={35} height={35} className='object-contain' alt="logo" src={Light} /> */}
      <span
        className={cn(className, 'ltr:ml-[5px] rtl:mr-[5px] text-[16px] font-semibold')}
        style={{
          ...style,
          color: "hsl(231, 21%, 38%)"
        }}
      >
        KLQUE
      </span>

    </div>
  )
}

export default LogoWithName