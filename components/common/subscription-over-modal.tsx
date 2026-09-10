"use client"

import { montserrat } from "@/app/layout"
import Cookies from "js-cookie"
import { useState, useEffect } from "react"
import SmallRoundedSpinner from './small-rounded-spinner'


const SubscriptionOverModal = () => {

    const [loginUser, setLoginUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
        setLoginUser(user);
    }, []);

    const handleStartTrial = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'AUTH-SECRET-KEY': process.env.AUTH_SECRET_KEY as string,
                },
                body: JSON.stringify({
                    userId: loginUser?._id
                }),
            });

            const data = await response.json();
            if (data.url) {
                window.location.href = data?.url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
        finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={`relative ${montserrat.className}`}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"></div>
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-[#FFFDF8] md:max-w-[550px] sm:max-w-sm max-w-xs rounded-[25px] lg:py-[51px] py-[30px] lg:px-[39px] px-[30px] text-center">
                    <h2 className="md:text-[30px] text-[25px] font-black mb-[30px]">Hey, your free trial is over</h2>
                    <p className="text-[#000] lg:text-[18px] text-[16px] font-[500]">
                        Get Klque Pro for $20/month only and unlock the full experience tailored to help you grow faster.
                    </p>
                    <p className="lg:text-[16px] text-[14px] text-[#333] font-[500] pt-[15px] pb-[40px]">
                        Your content is safe - Subscribe now to continue creating.
                    </p>
                    <div className="flex justify-center">
                        <button className="flex justify-center max-w-[232px] w-full bg-[#5D60FF] hover:bg-[#4547d1] text-white font-[600] py-3 rounded-[5px] transition mb-[30px] text-[16px] cursor-pointer"
                            onClick={handleStartTrial}
                            disabled={isLoading}>
                            {isLoading ? <SmallRoundedSpinner className="border-white" /> : "Subscribe now"}
                        </button>
                    </div>
                    <div className="lg:flex block items-center text-[#313131] text-[13px] justify-center font-[500]">
                        <p className="font-[700] mr-1">Got questions?</p> Message us:
                        <a href="mailto:contact@klque.ai" className="text-[#5D60FF] underline ms-[5px]">
                            contact@klque.ai
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SubscriptionOverModal;