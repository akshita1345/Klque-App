"use client"
import Illustration from "@/public/images/pages/misc-under-maintenance.png"
import MaskLight from "@/public/images/pages/auth-v2-mask-light.png"
import MaskDark from "@/public/images/pages/auth-v2-mask-dark.png"
import Image from 'next/image'
import Link from "next/link"
import { Button } from "@/components/ui/button"

const MiscellaneousUnderMaintenance = () => {
  return (
    <div className="flex flex-col justify-center items-center text-center pt-[130px] px-[1.25rem]">
      <div className="flex flex-col justify-center items-center">
        <span className="text-3xl block">Under Maintenance!</span>
        <span className="text-sm text-muted-foreground mt-4 mb-6 block">Sorry for the inconvenience but we`re performing some maintenance at the moment</span>
        <Link href="/"><Button type="submit">Back to Home</Button></Link>
      </div>
      <div className='flex items-center justify-center w-full mt-5'
      >
        <Image width={100} height={100} className='z-[2] w-auto max-h-[450px] 1500:max-h-[600px] 900:max-h-[550px] my-[3rem] object-contain' alt="login-illustration" src={Illustration} />
        <Image width={100} height={100} className='900:flex hidden bottom-0 h-[300px] w-full absolute' alt="mask" src={MaskLight} />
      </div>
    </div>
  )
}

export default MiscellaneousUnderMaintenance