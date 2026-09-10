"use client"
import Illustration from "@/public/images/pages/misc-coming-soon.png"
import MaskLight from "@/public/images/pages/auth-v2-mask-light.png"
import MaskDark from "@/public/images/pages/auth-v2-mask-dark.png"
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const MiscellaneousComingSoon = () => {
  return (
    <div className="flex flex-col justify-center items-center text-center pt-[130px] px-[1.25rem]">
      <div className="flex flex-col justify-center items-center">
        <span className="text-3xl block">We are launching soon</span>
        <span className="text-sm text-muted-foreground mt-4 mb-6 block">We`re creating something awesome. Please subscribe to get notified when it`s ready!</span>
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input type="email" placeholder="Enter Your Email" />
          <Button type="submit">Notify</Button>
        </div>
      </div>
      <div className='flex items-center justify-center w-full mt-5'
      >
        <Image width={100} height={100} className='z-[2] w-auto max-h-[450px] 1500:max-h-[600px] 900:max-h-[550px] my-[3rem] object-contain' alt="login-illustration" src={Illustration} />
        <Image width={100} height={100} className='900:flex hidden bottom-0 h-[300px] w-full absolute' alt="mask" src={MaskLight} />
      </div>
    </div>
  )
}

export default MiscellaneousComingSoon