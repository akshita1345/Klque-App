"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"
import React, { useState, useEffect, useTransition, useMemo } from "react"
import { Montserrat } from "next/font/google"
import Image from "next/image"
import { Check, ExternalLink } from 'lucide-react';
import Link from "next/link"

export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
const StartOnboarding = () => {
  const router = useRouter();
  const [loginUser, setLoginUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
  }, []);

  const handleStartTrial = async (input: any) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AUTH-SECRET-KEY': process.env.AUTH_SECRET_KEY as string,
        },
        body: JSON.stringify({
          userId: loginUser?._id,
          isYearly,
          product_data: input?.product_data,
          monthlyPrice: input?.price,
          plan: input?.plan,
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

  const handleLogout = () => {
    Cookies.remove("userId");
    Cookies.remove("token");
    localStorage.clear();
    router.push("/login");
  };

  const pricingPlans = useMemo(() => [
    {
      id: 'basic',
      name: 'STARTER',
      price: {
        monthly: 0,
        yearly: 0
      },
      priceLabel: null,
      description: null,
      planDescription: 'For founders finding clarity',
      includesLabel: 'Starter includes:',
      creditLabel: '',
      features: [
        "Personalised Brand Profile",
        "Defined audience + positioning summary",
        "Limited idea generation",
        "Limited content scripts",
        "Limited content planner access",
        "Limited content calendar access"
      ],
      buttonText: 'Start Free',
      buttonStyle: 'outline',
      isPopular: false
    },
    {
      id: 'pro',
      name: 'BUILDER',
      price: {
        monthly: 19,
        yearly: 16
      },
      priceLabel: null,
      description: null,
      planDescription: "For founders building consistency",
      includesLabel: 'Everything in Starter, and:',
      creditLabel: '',
      features: [
        "Unlimited ideas",
        "Higher content script limits",
        "Expanded content planner access",
        "Full Content Calendar access"
      ],
      buttonText: 'Start with Builder',
      buttonStyle: 'filled',
      isPopular: true,
      product_data: {
        name: 'Klque Builder',
        description: 'Klque Builder subscription - For founders building consistency',
      },
    },
    {
      id: 'premium',
      name: 'AUTHORITY',
      price: {
        monthly: 49,
        yearly: 39
      },
      priceLabel: true,
      description: null,
      planDescription: "For founders building Influence",
      includesLabel: 'Everything in Builder, and:',
      creditLabel: '',
      features: [
        "Unlimited scripts",
        "Advanced brand refinement",
        "Deep audience + messaging calibration",
        "Competitor landscape analysis",
        "Refine your content strategy with a monthly call with Klque Team",
        "Direct Slack access to the Klque team for feedback and guidance",
        "Early access to new features and updates"
      ],
      buttonText: 'Book a Call',
      buttonStyle: 'filled',
      isPopular: false,
      product_data: {
        name: 'Klque Authority',
        description: 'Klque Authority subscription - For founders building Influence',
      },
    },
  ], []);

  return (
    <div className={`lg:flex flex-col lg:flex-row 2xl:h-screen ${montserrat.className}`}>

      <div className="w-full lg:max-w-[460px] bg-[#FFFDF8] flex flex-col h-screen justify-between">

        <div className="mt-[60px]">
          <Image
            src="/images/logos/klque-logo.PNG"
            alt="KLQUE Logo"
            width={100}
            height={34}
            priority
            className="lg:max-w-full max-w-[100px] mx-auto h-auto"
          />
        </div>


        <div className="md:px-0 px-6 flex flex-col justify-center items-center">
          <h2 className={`text-[24px] font-[700] ${montserrat.className}`}>Hey, it&apos;s Ina!</h2>

          <div className="relative w-full max-w-xs my-[55px]">
            <Image
              src="/images/pages/Image-calm.svg"
              alt="Ina"
              width={242}
              height={210}
              priority
              className="mx-auto"
            />
          </div>

          <div className="text-center w-full max-w-xs mb-8">
            <p className={`md:text-[16px] text-[14px] font-[500] text-[#282C40] ${montserrat.className}`}>
              Ready to create amazing content? I&apos;m your personal strategist, and I&apos;ll be guiding you throughout your journey.
            </p>
          </div>
        </div>

        <div className="w-full px-[40px] mb-[100px]">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="text-[#5D60FF] md:!text-[17px] text-[14px] font-[600] hover:text-[#5D60FF] flex items-center gap-2 w-full border-[#5D60FF] !py-[11px] !h-full !rounded-[5px] bg-transparent"

          >
            Log in with a different account ?
          </Button>
        </div>
      </div>
      <div className={`2xl:max-w-[calc(100%-460px)] 2xl:min-h-screen w-full relative flex items-center justify-center bg-[#FCF7E4]  2xl:h-screen h-full  ${montserrat.className}`}>
        <div className='lg:max-w-full md:max-w-[600px] max-w-[400px] w-full mx-auto flex flex-col 2xl:h-screen justify-center lg:pt-0 pt-4 lg:px-4 px-6'>
          {/* Header */}
          <div className="text-center mb-[30px]">
            <h1 className="text-[32px] font-bold text-black!mb-[12px]">Pricing</h1>
            <p className="text-[18px] mb-[30px] font-[500] !text-[#000]">
              It&apos;s time to create your content smarter & Faster.
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center">
              <div className="bg-white rounded-[5px] p-[4px] shadow-sm flex min-w-[212px] justify-between">

                <button
                  onClick={() => setIsYearly(false)}
                  className={`px-[12px] py-[6px] rounded-[5px] !text-[12px] font-medium transition-all ${!isYearly
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-[#5D60FF] hover:text-[#5D60FF]'
                    }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsYearly(true)}
                  className={`px-[12px] py-[6px] rounded-[5px] !text-[12px] font-medium transition-all flex items-center gap-2 ${isYearly
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-[#5D60FF] hover:text-[#5D60FF]'
                    }`}
                >
                  Yearly (Save 20%)

                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:gap-[30px] gap-[20px] 2xl:min-w-[660px] 2xl:mx-auto 2xl:items-stretch">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="min-w-[200px] bg-white rounded-[10px] px-[10px] py-[10px] flex flex-col h-full cursor-pointer border border-transparent hover:border-[#5D60FF] hover:scale-[1.04] transition-all duration-200 ease-in-out"
              >
                <div className="px-[10px]">
                  <h3 className="text-[16px] font-[600] text-black mb-[4px]">{plan.name}</h3>
                  <p className="text-[11px] font-[500] text-[#383838] mb-[4px]">{plan.planDescription}</p>
                  <div className="2xl:h-[65px] xl:h-[75px]">
                    <div className="flex items-baseline">

                      {plan.priceLabel ? (
                        <span className="text-[18px] font-[600] text-black">
                          Custom Quote
                        </span>
                      ) : (
                        <>
                          <span className="text-[22px] font-[600] text-black">
                            ${isYearly ? plan.price.yearly : plan.price.monthly}
                          </span>
                          <span className="text-[10px] text-black ml-1 font-[500]">/month</span>
                        </>
                      )}

                      {
                        (isYearly && plan?.id === "pro") &&
                        <div className="bg-[#E5E8F6] rounded-[6px] text-[#5D60FF] text-[10px] px-[4px] py-[2px] !font-[600] ml-[8px]">
                          -20%
                        </div>
                      }
                    </div>
                    {plan.description && (
                      <p className="text-[11px] font-[500] text-[#383838] mb-[8px]">{plan?.description}</p>
                    )}
                  </div>
                  <p className="text-[12px] font-[500] text-black mb-[4px]">{plan.creditLabel}</p>
                </div>


                <div className="px-[10px] mb-6 flex-grow mt-[8px]">
                  <p className={`text-[11px] text-[#5D60FF] mb-[10px] font-[700]`}>
                    {plan.includesLabel}
                  </p>
                  <ul className="space-y-[8px]">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-[6px]">
                        <div className="w-[16px] h-[14px] rounded-[4px] bg-[#E5E8F6] flex items-center justify-center">
                          <Image
                            src="/images/pages/check-icon.svg"
                            alt="check"
                            width={10}
                            height={8}
                          />
                        </div>
                        <span className="text-[10px] text-black font-[500]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {
                  ["basic", "pro"].includes(plan.id) ? (
                    <button
                      className={`!font-[600] w-full !py-[6px] px-4 rounded-lg !text-[12px] transition-colors mt-auto ${plan.buttonStyle === 'filled'
                        ? 'bg-[#5D60FF] text-white hover:bg-indigo-600'
                        : 'bg-white border !border-[#5D60FF] text-[#5D60FF] hover:bg-white !font-[700]'
                        }`}
                      onClick={() => handleStartTrial({
                        product_data: plan.product_data,
                        price: isYearly ? plan.price.yearly : plan.price.monthly,
                        plan: plan.id,
                      })}
                    >
                      {plan.buttonText}
                    </button>
                  ) : (
                    <Link
                      href={"https://calendar.app.google/vSvSknT9rf4nhzv28"}
                      className={`!font-[600] w-full !py-[6px] px-4 rounded-lg !text-[12px] flex items-center justify-center transition-colors mt-auto text-center ${plan.buttonStyle === 'filled'
                        ? 'bg-[#5D60FF] text-white hover:bg-indigo-600'
                        : 'bg-white border !border-[#5D60FF] text-[#5D60FF] hover:bg-white !font-[700]'
                        }`}
                      target="_blank"
                    >
                      {plan.buttonText} <ExternalLink className="inline-block w-[14px] h-[14px] ml-2" />
                    </Link>
                  )
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
};

export default StartOnboarding