"use client";
import { Sidebar } from "@/components/sidebar";
import { Montserrat } from "next/font/google";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { apiClient } from "@/client/client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import { Button, LoadingButton } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"

const montserrat = Montserrat({ subsets: ["latin"] });
import { Plus_Jakarta_Sans } from 'next/font/google'
import Link from "next/link";
import moment from "moment-timezone";
import CancelSubscriptionWarningDialog from "./_helper_/cancel-subscription-dialog";
import { toast } from "sonner";
import { checkCurrentPlan } from "@/config";
import RoundedLargeSpinner from "@/components/common/round-large-spinner";
import { OnboardingData } from "./_helper_/onboarding-data";
import { Switch } from "@/components/ui/switch";
import { OnboardingDataSection } from "@/app/components/onboarding/onboarding-data-section";
import { OnboardingModal } from "@/app/components/onboarding/onboarding-modal";
import ProfileSummaryModal from "@/app/components/onboarding/profile-summary-modal";
import { OnboardingModal as ConformationModal } from "@/components/onboarding/onboarding-modal";
import { ExternalLink } from "lucide-react";

export const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
interface UserData {
  _id: string;
  name: string;
  email: string;
  profession: string;
  onboarding: {
    contentType?: string[];
    goal?: string;
    vibe?: string[];
    platform?: string[];
    niche?: string[];
    subContent?: string[];
  };
  plan: string;
  expiryDate: string;
  isSubscriptionCancel: boolean;
  planTime: string;
  planInvites?: boolean;
  taskInvites?: boolean;
}

interface BusinessInfo {
  name: string;
  industry: string;
  website: string;
  sites: string[];
}

interface ToneVoice {
  tone: string[];
  voice: string[];
  cta: string[];
}

interface ProfileSummary {
  cta?: string[];
  coreValues: string[];
  niche: string[];
  audience: string[];
  audienceObjectives: string[];
  audiencePainPoints: string[];
}

interface OnboardingData {
  describe: string[];
  mainGoal: string;
  newVibe: string[];
  businessInfo: BusinessInfo;
  toneVoice: ToneVoice;
  profileSummary: ProfileSummary
}

const initialOnboardingData: OnboardingData = {
  describe: [] as string[],
  mainGoal: "",
  newVibe: [] as string[],
  businessInfo: {
    name: "",
    industry: "",
    website: "",
    sites: [] as string[],
  },
  profileSummary: {
    coreValues: [] as string[],
    niche: [] as string[],
    audience: [] as string[],
    audienceObjectives: [] as string[],
    audiencePainPoints: [] as string[],
  },
  toneVoice: {
    tone: [] as string[],
    voice: [] as string[],
    cta: [] as string[],
  },
};

interface OnboardingResponse {
  title: string;
  field: keyof OnboardingData;
  data: string[];
}

export default function Settings() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialOnboardingData);
  const [editingField, setEditingField] = useState<keyof OnboardingData | 'profileSummary' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileSummaryModalOpen, setIsProfileSummaryModalOpen] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<any>(false);
  const [newChatWarning, setNewChatWarning] = useState<any>(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const activeTab: string = useMemo(() => {
    const tab = searchParams.get('tab');
    return tab === 'account' ? 'account' : tab === 'subscription' ? 'subscription' : 'account';
  }, [searchParams]);

  const setActiveTab = useCallback((tab: 'account' | 'subscription') => {
    const params = new URLSearchParams(searchParams);
    if (tab === 'account') {
      params.set('tab', 'account');
    } else if (tab === 'subscription') {
      params.set('tab', 'subscription');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  useEffect(() => {
    if (userData) {
      setIsYearly(userData?.planTime === "year")
    }
  }, [userData])

  const setCustomOnboardingData = useCallback((onboarding: any) => {
    const {
      describe = [],
      mainGoal = "",
      newVibe = [],
      businessInfo = {},
      profileSummary = {},
      toneVoice = {},
    } = onboarding || {};

    setOnboardingData({
      describe,
      mainGoal,
      newVibe,
      businessInfo: {
        name: businessInfo?.name || "",
        industry: businessInfo?.industry || "",
        website: businessInfo?.website || "",
        sites: businessInfo?.sites || [],
      },
      profileSummary: {
        coreValues: profileSummary?.coreValues || [],
        niche: profileSummary?.niche || [],
        audience: profileSummary?.audience || [],
        audienceObjectives: profileSummary?.audienceObjectives || [],
        audiencePainPoints: profileSummary?.audiencePainPoints || [],
      },
      toneVoice: {
        tone: toneVoice?.tone || [],
        voice: toneVoice?.voice || [],
        cta: toneVoice?.cta || [],
      },
    });
  }, []);

  const fetchUserData = useCallback(async () => {
    try {
      const userCookie = localStorage.getItem("user");
      if (!userCookie) {
        setError("User not found in session");
        return;
      }

      const user = JSON.parse(userCookie);
      if (!user._id) {
        setError("User ID not found");
        return;
      }

      const response = await apiClient(`/api/get-user?userId=${user._id}&timezone=${moment.tz.guess()}`);
      setUserData({ ...response.user, plan: response.user?.plan || "basic" });
      if (response.user.onboarding) {
        setCustomOnboardingData(response.user.onboarding);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPaymentHistory = useCallback(async () => {
    const token: string | undefined = Cookies.get("token");

    const myHeaders = new Headers();
    myHeaders.append("Authorization", token || "");

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch("/api/get-all-subscription-history", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        setPaymentHistory(result?.data?.data || []);
      })
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchPaymentHistory();
  }, [fetchPaymentHistory, fetchUserData]);

  const handleSave = async (data: any) => {
    try {
      // Step 1: Retrieve and validate user from localStorage
      const userCookie = localStorage.getItem("user");
      if (!userCookie) {
        setError("User not found in session");
        return;
      }
      const user = JSON.parse(userCookie);
      if (!user._id) {
        setError("User ID not found");
        return;
      }

      // Step 2: Split incoming data into onboarding updates vs top-level user updates
      const onboardingKeys: Array<keyof OnboardingData> = ['describe', 'mainGoal', 'newVibe', 'businessInfo', 'profileSummary', 'toneVoice'];
      const onboardingUpdates: any = Object.fromEntries(Object.entries(data).filter(([key]) => (onboardingKeys as string[]).includes(key)));
      const otherUpdates: any = Object.fromEntries(Object.entries(data).filter(([key]) => !(onboardingKeys as string[]).includes(key)));

      const updatedOnboardingData = { ...onboardingData };
      if (Object.keys(onboardingUpdates).length) {
        for (const key in onboardingUpdates) {
          if (onboardingUpdates.hasOwnProperty(key)) {
            updatedOnboardingData[key as keyof OnboardingData] = onboardingUpdates[key];
          }
        }
        setCustomOnboardingData(updatedOnboardingData);
      }

      // Step 3: Conditionally regenerate CTA list if business info changed
      let cta: string[] = updatedOnboardingData?.profileSummary?.cta || updatedOnboardingData?.toneVoice?.cta, profileSummary: any;
      if (editingField === 'businessInfo' && Object.keys(onboardingUpdates).length) {
        toast.info("Regenerating CTA list...");
        const { CTA, tone, voices, sources, ...profileSummaryData } = await fetchData({ _id: user._id, onboarding: updatedOnboardingData }, () => { }, () => { });
        profileSummary = profileSummaryData || {};
        cta = CTA || [];
        setNewChatWarning(true);
      }

      // Step 4: Persist merged onboarding data and other updates to backend
      const res = await apiClient(`/api/update-user`, {
        method: "PUT",
        body: JSON.stringify({
          ...(Object.keys(otherUpdates).length ? otherUpdates : {}),
          ...(Object.keys(onboardingUpdates).length ? {
            onboarding: {
              ...updatedOnboardingData,
              ...(profileSummary ? {
                profileSummary: {
                  coreValues: profileSummary?.core_values || [],
                  niche: profileSummary?.niche || [],
                  audience: profileSummary?.target_audience || [],
                  audienceObjectives: profileSummary?.audience_objectives || [],
                  audiencePainPoints: profileSummary?.audience_pain_points || []
                }
              } : {}),
              toneVoice: { ...updatedOnboardingData?.toneVoice, cta }
            }
          } : {})
        }),
      });

      // Step 5: Handle response and UI feedback
      setEditingField(null);
      setIsModalOpen(false);
      if (res.success) {
        if (res?.user?.onboarding) setCustomOnboardingData(res.user.onboarding);
        setUserData(res?.user)
        toast.success("Updated successfully");
      } else {
        toast.error("Error while updating onboarding data");
      }
    } catch (err: any) {
      console.error("Error while updating onboarding data", err);
      toast.error("Error while updating onboarding data");
    }
  };

  // const handleRegenerateProfileSummary = async () => {
  //   // Implement the logic to regenerate the profile summary
  //   toast.info("Regenerating profile summary...");
  // };

  // const onboardingResponses: OnboardingResponse[] = [
  //   {
  //     title: "Which of these best describes you?",
  //     field: "describe",
  //     data: onboardingData.describe,
  //   },
  //   {
  //     title: "What’s the main goal you want to focus on right now?",
  //     field: "mainGoal",
  //     data: [onboardingData.mainGoal],
  //   },
  //   {
  //     title: "When people see your content, what’s the lasting feeling you’d like them to walk away with?",
  //     field: "newVibe",
  //     data: onboardingData.newVibe,
  //   },
  // ];

  // const handleManageSubscription = () => {
  //   // Implement subscription management logic
  //   toast.info("Subscription management coming soon...");
  // };

  // const handleCheckout = (plan: any, yearly: boolean) => {
  //   // Implement checkout logic
  //   toast.info(`Checkout for ${plan.plan} ${yearly ? 'yearly' : 'monthly'} plan coming soon...`);
  // };

  const direction = sortConfig.direction;

  const sortedPaymentHistory = useMemo(() => {
    const sorted = [...paymentHistory].sort((a, b) => {
      if (!sortConfig.key) return 0;

      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [paymentHistory, sortConfig]);

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
      buttonText: checkCurrentPlan('basic', userData, isYearly) ? 'Current plan' : 'Start Free',
      buttonStyle: checkCurrentPlan('basic', userData, isYearly) ? 'filled' : 'outline',
      isDisabled: userData?.isSubscriptionCancel,
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
      buttonText: checkCurrentPlan('pro', userData, isYearly) ? 'Current plan' : 'Upgrade to Builder',
      buttonStyle: checkCurrentPlan('pro', userData, isYearly) ? 'filled' : 'outline',
      isDisabled: userData?.isSubscriptionCancel,
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
      buttonText: checkCurrentPlan('premium', userData, isYearly) ? 'Current plan' : <span>Book a Call <ExternalLink className="inline-block w-[14px] h-[14px] ml-2" /></span>,
      buttonStyle: checkCurrentPlan('premium', userData, isYearly) ? 'filled' : 'outline',
      isDisabled: userData?.isSubscriptionCancel,
      isPopular: false,
      product_data: {
        name: 'Klque Authority',
        description: 'Klque Authority subscription - For founders building Influence',
      },
    },
  ], [userData, isYearly]);

  const redirectToCustomerPortal = useCallback(() => {

    const token: string | undefined = Cookies.get("token");

    const myHeaders = new Headers();
    myHeaders.append("Authorization", token || "");

    const requestOptions: RequestInit = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    fetch("/api/get-customer-portal", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        window.open(result?.data?.url || "", '_blank');
      })
      .catch((error) => console.error(error));

  }, []);

  const fetchData = useCallback(async (userData: any, setIsFetchProfileLoading: any, setProfileData: any) => {
    setIsFetchProfileLoading(true);
    try {

      const response = await fetch('/api/ai-profile-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData?._id,
          describe: userData?.onboarding?.describe,
          mainGoal: userData?.onboarding?.mainGoal,
          newVibe: userData?.onboarding?.newVibe,
          businessInfo: userData?.onboarding?.businessInfo,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile summary');
      }

      const result = await response.json();
      const profileSummary = result.data;

      setProfileData({
        coreValues: profileSummary?.core_values || [],
        niche: profileSummary?.niche || [],
        audience: profileSummary?.target_audience || [],
        audienceObjectives: profileSummary?.audience_objectives || [],
        audiencePainPoints: profileSummary?.audience_pain_points || [],
        cta: profileSummary?.CTA || []
      });
      return profileSummary;
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsFetchProfileLoading(false);
    }
  }, [])

  if (error) {
    return (
      <div className={`flex h-screen ${montserrat.className}`} style={{ backgroundColor: '#FCF7E4' }}>
        <Sidebar />
        <div className="md:flex-1 md:flex md:flex-col">
          <div className="md:flex-1 overflow-y-auto md:p-8 p-4">
            <div className="bg-white rounded-lg md:p-8 p-4 shadow-sm border">
              <div className="text-red-600 text-center">
                <p>Error loading profile data</p>
                <p className="text-sm mt-2">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    try {
      const token: string | undefined = Cookies.get("token");

      const myHeaders = new Headers();
      myHeaders.append("Authorization", token || "");

      const requestOptions: RequestInit = {
        method: "POST",
        headers: myHeaders,
        redirect: "follow"
      };

      fetch("/api/cancel-subscription", requestOptions)
        .then(() => { fetchUserData(); })
        .catch((error) => console.error(error));

      setIsOpen(!isOpen);
      toast.success("Subscription canceled successfully");
    } catch (err: any) {
      console.error("Error while canceling subscription", err);
      toast.error("Error while canceling subscription");
    }
  };

  const handleUpdateCurrentSubscription = async (input: any) => {
    try {
      setLoading(true);
      const token: string | undefined = Cookies.get("token");

      const response = await fetch('/api/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": token || ""
        },
        body: JSON.stringify({
          amount: isYearly ? input?.price * 12 * 100 : input?.price * 100,
          interval: isYearly ? "year" : "month",
          product_data: {
            name: input?.product_data?.name
          },
          metadata: {
            email: userData?.email,
            userId: userData?._id,
            plan: input?.plan,
          }
        }),
      });

      await response.json();

      toast.success("Subscription plan updated successfully");
      fetchUserData();
      fetchPaymentHistory();
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error?.message);
    }
    finally {
      setUpgradePlan(false);
      setLoading(false);
    }
  }

  const handleStartTrial = async (input: any) => {
    try {
      setLoading(true);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'AUTH-SECRET-KEY': process.env.AUTH_SECRET_KEY as string,
        },
        body: JSON.stringify({
          userId: userData?._id,
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
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error?.message);
    }
    finally {
      setUpgradePlan(false);
      setLoading(false);
    }
  }

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key,
        direction: 'asc'
      };
    });
  };

  if (loading) {
    return (
      <div className={`flex h-screen ${montserrat.className}`} style={{ backgroundColor: '#FCF7E4' }}>
        <Sidebar />
        <div className="flex-1 flex justify-center items-center">
          <RoundedLargeSpinner />
        </div>
      </div>
    );
  }

  const handlePlanUpgradation = () => {
    if (userData?.plan === "basic") {
      handleStartTrial({
        product_data: upgradePlan?.product_data,
        price: isYearly ? upgradePlan?.price.yearly : upgradePlan?.price.monthly,
        plan: upgradePlan?.id,
      });
    } else {
      handleUpdateCurrentSubscription({
        product_data: upgradePlan?.product_data,
        price: isYearly ? upgradePlan?.price.yearly : upgradePlan?.price.monthly,
        plan: upgradePlan?.id,
      });
    }
  }

  const handleNewChat = () => {
    setNewChatWarning(false);
    router.push('/ideate?new=1');
  }

  return (
    <div className={`flex h-screen ${montserrat.className}`} style={{ backgroundColor: '#FCF7E4' }}>
      <Sidebar />
      <div className="md:flex-1 md:flex md:flex-col sm:w-full w-[calc(100%-60px)] h-screen">
        <div className="md:flex-1 overflow-y-auto md:p-8 p-4 h-screen">

          <div className="mt-[8px]">
            <h1 className="text-[22px] font-[600] text-gray-900">Settings</h1>

            {/* Tabs */}
            <div className="flex mt-[18px] gap-6">
              {/* All About It */}
              <div
                onClick={() => setActiveTab('account')}
                className="flex flex-col items-center cursor-pointer"
              >
                <span
                  className="text-black  text-[14px] font-medium px-[10px]"
                >
                  Account Details & Content Preference
                </span>
                {activeTab === 'account' && (
                  <span className="mt-[2px] h-[1px] w-full bg-[#5D60FF] rounded-full"></span>
                )}
              </div>

              {/* To-Do's */}
              <div
                onClick={() => setActiveTab('subscription')}
                className="flex flex-col items-center cursor-pointer"
              >
                <span
                  className="text-black  text-[14px] font-medium px-[10px]"
                >
                  Subscription
                </span>
                {activeTab === 'subscription' && (
                  <span className="mt-[2px] h-[1px] w-full bg-[#5D60FF] rounded-full"></span>
                )}
              </div>
            </div>

            {/* Content */}
            {activeTab === 'account' && (
              <div className="py-[10px] rounded-[10px]">
                <div className="bg-[#FFFDF8] rounded-lg md:py-[20px] px-[10px] p-4 h-full">
                  <div className="flex justify-between items-center mb-[6px]">
                    <h1 className="text-[14px] font-[600] text-[#2A2A2A]">My profile</h1>
                    <Button
                      onClick={() => router.push('/ideate?tour=true')}
                      variant="outline"
                      className="text-[12px] h-8 border-[#5D60FF] text-[#5D60FF] hover:bg-[#5D60FF20]"
                    >
                      Take a tour
                    </Button>
                  </div>
                  <div className="space-y-6 grid lg:grid-cols-2 grid-cols-1 items-start border-b border-[#E5E8F6] pb-[20px]">
                    <div className="grid grid-cols-1">
                      <div className="grid lg:grid-cols-2 grid-cols-1 mb-[6px]">
                        <label className="block text-sm font-medium text-[#475569]">Name</label>
                        <input
                          type="text"
                          defaultValue={userData?.name || ""}
                          className="w-full px-4 py-3 border border-[#C9C9C9] rounded-[5px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ransparent text-[#475569] md:text-[16px] text-[14px]"
                          readOnly
                          placeholder="Example name"
                        />
                      </div>

                      <div className="grid lg:grid-cols-2 grid-cols-1 mb-[6px]">
                        <label className="block text-sm font-medium text-[#475569]">Email Address</label>
                        <input
                          type="email"
                          defaultValue={userData?.email || ""}
                          className="w-full px-4 py-3 border border-[#C9C9C9] rounded-[5px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ransparent text-[#475569] md:text-[16px] text-[14px]"
                          readOnly
                          placeholder="Example@gmail.com"

                        />
                      </div>
                    </div>
                    <div className="space-y-6 grid grid-cols-1 items-start"></div>
                  </div>
                  <div className="py-[20px]">
                    <h1 className="text-[14px] font-[600] text-[#2A2A2A] mb-[6px]">Onboarding Data</h1>

                    {/* Describe Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">Which of these best describes you?</h3>
                        <button
                          onClick={() => { setEditingField('describe'); setIsModalOpen(true); }}
                          className="text-[12px] text-[#5D60FF] underline font-[500]"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {onboardingData.describe.map((item) => (
                          <div key={item} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main Goal Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">What&apos;s the main goal you want to focus on right now?</h3>
                        <button
                          onClick={() => { setEditingField('mainGoal'); setIsModalOpen(true); }}
                          className="text-[12px] text-[#5D60FF] underline font-[500]"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {onboardingData.mainGoal && (
                          <div className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                            {onboardingData.mainGoal}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* New Vibe Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">When people see your content, what&apos;s the lasting feeling you&apos;d like them to walk away with?</h3>
                        <button
                          onClick={() => { setEditingField('newVibe'); setIsModalOpen(true); }}
                          className="text-[12px] text-[#5D60FF] underline font-[500]"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {onboardingData.newVibe.map((item) => (
                          <div key={item} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Business Info Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">Business Info</h3>
                        <button
                          onClick={() => { setEditingField('businessInfo'); setIsModalOpen(true); }}
                          className="text-[12px] text-[#5D60FF] underline font-[500]"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-sm">
                          <p className="font-semibold">Business Name: </p>
                          <p>{onboardingData.businessInfo?.name}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <p className="font-semibold">Industry: </p>
                          <p>{onboardingData.businessInfo?.industry}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <p className="font-semibold">Business Website: </p>
                          <p>{onboardingData.businessInfo?.website}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <p className="font-semibold">Social Handles: </p>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.businessInfo?.sites.map((site) => (
                              <div key={site} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                {site}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tone Voice Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">Tone & Voice</h3>
                        <button
                          onClick={() => { setEditingField('toneVoice'); setIsModalOpen(true); }}
                          className="text-[12px] text-[#5D60FF] underline font-[500]"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-semibold">Tone</p>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.toneVoice?.tone.map((t) => (
                              <div key={t} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold">Voice</p>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.toneVoice?.voice.map((v) => (
                              <div key={v} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                {v}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="font-semibold">CTAs</p>
                          <ul className="list-disc space-y-1 pl-5">
                            {onboardingData.toneVoice?.cta.map((c) => (
                              <li key={c}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Profile Summary Section */}
                    <div className="border bg-white p-4 rounded-md shadow-md mt-4">
                      <div className="flex items-center justify-between pb-4 pt-0">
                        <h3 className="text-[16px] font-semibold">Profile Summary</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingField('profileSummary'); setIsModalOpen(true); }}
                            className="text-[12px] text-[#5D60FF] underline font-[500]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setIsProfileSummaryModalOpen(true)}
                            className="text-[12px] text-[#5D60FF] underline font-[500]"
                          >
                            Regenerate
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-semibold">Core Values</p>
                          <div className="flex flex-wrap gap-2">
                            {onboardingData.profileSummary?.coreValues.map((value) => (
                              <div key={value} className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                                {value}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold">Niche</p>
                          {onboardingData.profileSummary?.niche.map((n) => (
                            <p key={n}>{n}</p>
                          ))}
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold">Audience</p>
                          {onboardingData.profileSummary?.audience.map((a) => (
                            <p key={a}>{a}</p>
                          ))}
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold">Audience Objectives</p>
                          <ul className="list-disc space-y-1 pl-5">
                            {onboardingData.profileSummary?.audienceObjectives.map((obj) => (
                              <li key={obj}>{obj}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold">Audience Pain Points</p>
                          <ul className="list-disc space-y-1 pl-5">
                            {onboardingData.profileSummary?.audiencePainPoints.map((painPoint) => (
                              <li key={painPoint}>{painPoint}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="py-[20px]  border-b border-[#E5E8F6] ">
                    <h1 className="text-[14px] font-[600] text-[#2A2A2A] mb-[6px]">Calendar</h1>
                    <div className="space-y-6 grid grid-cols-2 items-start">
                      <div className="grid grid-cols-1">
                        <div className="grid lg:grid-cols-2 grid-cols-1 mb-[6px]">
                          <label className="col-span-1 block text-sm font-medium text-[#475569]">Sync Calendar</label>
                          <div className="col-span-1 lg:mt-0 mt-[10px]">
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!userData?.planInvites}
                                  onChange={(e) => handleSave({ planInvites: e.target.checked })}
                                />
                                <div className="w-10 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-500 transition-all"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                              </label>

                              <span className="text-[12px] font-medium text-black cursor-pointer">
                                Plan Invites
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-[10px]">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={!!userData?.taskInvites}
                                  onChange={(e) => handleSave({ taskInvites: e.target.checked })}
                                />
                                <div className="w-10 h-6 bg-gray-300 rounded-full peer peer-checked:bg-indigo-500 transition-all"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                              </label>

                              <span className="text-[12px] font-medium text-black cursor-pointer">
                                Task Invites
                              </span>
                            </div>

                          </div>
                        </div>
                      </div>
                    </div>


                  </div>

                  {/* <div className="py-[20px]">
                    <h1 className="text-[14px] font-[600] text-[#2A2A2A] mb-[6px]">Content Preference</h1>
                    <div className="space-y-6 grid grid-cols-2 items-start">
                      <div className="grid grid-cols-1">
                        <div className="grid lg:grid-cols-2 grid-cols-1 mb-[6px]">
                          <label className="col-span-1 block text-sm font-medium text-[#475569]">Content Pillar</label>
                          <div className="col-span-1 lg:mt-0 mt-[10px]">
                            <div className="flex items-center gap-3">
                          
                              <Switch
                                checked={isContentPillar}
                                onCheckedChange={setIsContentPillar}
                                className="group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50"
                              >
                                <span className="sr-only">Use setting</span>
                                <span
                                  aria-hidden="true"
                                  className="pointer-events-none absolute h-full w-full rounded-md bg-white"
                                />
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out ${isContentPillar ? 'bg-indigo-600' : 'bg-gray-200'
                                    }`}
                                />
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${isContentPillar ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                />
                              </Switch>
                              <span className="text-sm font-medium text-gray-700">{isContentPillar ? 'ON' : 'OFF'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="mt-[20px] bg-[#FFFDF8] px-[10px] py-[20px] rounded-[10px] ">
                <div className="pb-[20px]">
                  <div className="xl:flex block gap-[20px] border-b border-[#E5E8F6] pb-[20px]">
                    <div className="xl:w-[20%] w-full">
                      <h2 className="text-[14px] font-[600] text-[#2A2A2A] mb-4 flex items-center">Your Current Plan
                        <Image
                          src="/images/pages/question-mark.svg"
                          alt="KLQUE Logo"
                          width={14.62}
                          height={14.62}
                          className="mr-[4px] ml-[5.29px]" />

                      </h2>
                      <p className="text-[12px] text-[#475569] font-[500] max-w-[230px]">Explore other Klque subscription plans and upgrade or downgrade your account</p>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center justify-center mb-[20px]">
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
                      <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-[30px]">
                        {pricingPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="bg-white rounded-[10px] px-[20px] py-[10px]  flex flex-col h-full border border-[#E5E8F6]"
                          >
                            <div>
                              <h3 className="text-[16px] font-[600] text-black mb-[4px]">{plan.name}</h3>
                              <p className="text-[11px] font-[500] text-[#383838] mb-[4px]">{plan.planDescription}</p>
                              <div className="h-[49px] xl:h-[79px]">
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
                                  <p className="text-[11px] font-[500] text-[#383838] mb-[8px]">{plan.description}</p>
                                )}
                              </div>
                              <p className="text-[12px] font-[500] text-black mb-[4px]">{plan.creditLabel}</p>
                            </div>

                            <div className="mb-6 flex-grow mt-[8px]">
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
                                    <span className="text-[11px] text-black font-[500]">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {
                              ["basic", "pro"].includes(plan.id) ? (
                                <button
                                  className={`!font-[700] w-full !py-[6px] px-4 rounded-lg !text-[12px] transition-colors mt-auto ${plan.buttonStyle === 'filled'
                                    ? 'bg-[#5D60FF] text-white'
                                    : `bg-white border !border-[#5D60FF] text-[#5D60FF] ${plan.buttonText === "Current plan" || (userData?.isSubscriptionCancel && ["pro", "premium"].includes(plan.id)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5D60FF] hover:text-white'} !font-[700]`
                                    }`}
                                  onClick={() => setUpgradePlan(plan)}
                                  disabled={plan.buttonText === "Current plan" || (userData?.isSubscriptionCancel && ["pro", "premium"].includes(plan.id))}
                                >
                                  {plan.buttonText}
                                </button>
                              ) : (
                                <Link
                                  href={plan.buttonText === "Current plan" ? '#' : "https://calendar.app.google/vSvSknT9rf4nhzv28"}
                                  className={`!font-[700] w-full !py-[6px] px-4 rounded-lg !text-[12px] flex items-center justify-center transition-colors mt-auto ${plan.buttonStyle === 'filled'
                                    ? 'bg-[#5D60FF] text-white'
                                    : `bg-white border !border-[#5D60FF] text-[#5D60FF] ${plan.buttonText === "Current plan" || (userData?.isSubscriptionCancel && ["pro", "premium"].includes(plan.id)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5D60FF] hover:text-white'} !font-[700]`
                                    }`}
                                  target={plan.buttonText === "Current plan" ? '_self' : "_blank"}
                                  aria-disabled={plan.buttonText === "Current plan"}
                                >
                                  {plan.buttonText}
                                </Link>
                              )
                            }
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

                {(userData && userData?.plan !== 'basic') &&
                  <>
                    <div className="md:flex block gap-[20px] border-b border-[#E5E8F6] pb-[20px]">
                      <div className="xl:w-[20%] lg:w-[50%] w-full">
                        <h2 className="text-[14px] font-[600] text-[#2A2A2A] mb-4 flex items-center">Billing Cycle
                          <Image
                            src="/images/pages/question-mark.svg"
                            alt="KLQUE Logo"
                            width={14.62}
                            height={14.62}
                            className="mr-[4px] ml-[5.29px]" />

                        </h2>
                        <p className="text-[12px] text-[#475569] font-[500]">You can change  your payment <br /> credentials here.</p>
                      </div>
                      <div className="xl:w-[80%] lg:w-[50%] w-full">
                        <div className="lg:w-[50%] w-full mb-[20px]">
                          <p className="text-[12px] text-[#000000] font-[600] mb-[7.2px]"> Next Billing Date</p>

                          <Button type="button" variant="outline" className="!gap-[10px] !md:text-[12px] !text-[#A7A3B8] w-full !h-[38px] !rounded-[5px] justify-start text-left font-normal !p-[11.5px]">

                            <Image
                              src="/images/pages/calender-setting.svg"
                              alt="KLQUE Logo"
                              width={15}
                              height={15}
                              priority
                            />
                            <p className={`text-[12px] ${plusJakartaSans.className}`}>{userData?.expiryDate ? moment(userData?.expiryDate).format('MM-DD-YYYY') : ''}</p>

                          </Button>
                          <Dialog >
                            <DialogContent className="w-auto p-6 max-w-fit">
                              <Calendar />
                            </DialogContent>
                          </Dialog>

                        </div>

                        <Button
                          variant="outline"
                          className={`rounded border-[#E5E8F6] ${userData?.isSubscriptionCancel ? 'text-red-500 hover:bg-red-50 hover:text-red-500' : 'text-[#5D60FF] hover:bg-[#5D60FF20] hover:text-[#5D60FF]'} text-[12px] !px-[12px] !py-[6px] !bg-transparent !h-[27px]`}
                          onClick={() => setIsOpen(true)}
                          disabled={userData?.isSubscriptionCancel}
                        >
                          {userData?.isSubscriptionCancel ? 'Subscription Cancelled' : 'Cancel Subscription'}
                        </Button>
                      </div>


                    </div>

                    <div className="md:flex block gap-[20px] border-b border-[#E5E8F6] py-[20px]">
                      <div className="xl:w-[20%] lg:w-[50%] w-full">
                        <h2 className="text-[14px] font-[600] text-[#2A2A2A] mb-4 flex items-center">Payment Method
                          <Image
                            src="/images/pages/question-mark.svg"
                            alt="KLQUE Logo"
                            width={14.62}
                            height={14.62}
                            className="mr-[4px] ml-[5.29px]" />

                        </h2>
                        <p className="text-[12px] text-[#475569] font-[500]">You can change  your payment <br /> credentials here.</p>
                      </div>
                      <div className="xl:w-[80%] lg:w-[50%] w-full">
                        <div className="w-[50%] mb-[20px]">
                          <p className="text-[12px] text-[#000000] font-[600] mb-[7.2px] flex items-center"> Customer Portal
                            <Image
                              src="/images/pages/question-mark.svg"
                              alt="KLQUE Logo"
                              width={14.62}
                              height={14.62}
                              className="mr-[4px] ml-[5.29px]" />

                          </p>
                          <p className="text-[12px] text-[#5D60FF] mt-[15px] decoration-solid underline font-[600] cursor-pointer" onClick={redirectToCustomerPortal}>View Portal</p>

                        </div>
                      </div>


                    </div>

                    <div className="xl:flex block  gap-[20px] border-b border-[#E5E8F6] pt-[20px] pb-[50px]">
                      <div className="xl:w-[20%] w-full">
                        <h2 className="text-[14px] font-[600] text-[#2A2A2A] mb-4 flex items-center">Billing History
                          <Image
                            src="/images/pages/question-mark.svg"
                            alt="KLQUE Logo"
                            width={14.62}
                            height={14.62}
                            className="mr-[4px] ml-[5.29px]" />

                        </h2>
                        <p className="text-[12px] text-[#475569] font-[500]">You can download your billing  <br /> content.</p>
                      </div>
                      <div className="xl:w-[80%]  w-full">

                        <div className={`overflow-x-auto lg:w-[70%] w-full ${plusJakartaSans.className}`}>
                          <table className="min-w-full border-collapse">
                            <thead>
                              <tr className="text-left text-sm font-semibold text-gray-600">
                                <th
                                  className="pr-4 pb-3 text-[14px] text-[#000000] font-[600] cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => handleSort('date')}
                                >
                                  <div className="flex items-center gap-1">
                                    Date
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                      className={`w-4 h-4 transition-transform duration-200 ${sortConfig.key === 'date' ? 'text-[#5D60FF]' : 'text-gray-500'
                                        } ${sortConfig.key === 'date' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                        }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </th>

                                <th
                                  className="px-4 pb-3 text-[14px] text-[#000000] font-[600] cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => handleSort('plan')}
                                >
                                  <div className="flex items-center gap-1">
                                    Plan
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                      className={`w-4 h-4 transition-transform duration-200 ${sortConfig.key === 'plan' ? 'text-[#5D60FF]' : 'text-gray-500'
                                        } ${sortConfig.key === 'plan' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                        }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </th>

                                <th
                                  className="px-4 pb-3 text-[14px] text-[#000000] font-[600] cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => handleSort('amount')}
                                >
                                  <div className="flex items-center gap-1">
                                    Amount
                                    <svg xmlns="http://www.w3.org/2000/svg"
                                      className={`w-4 h-4 transition-transform duration-200 ${sortConfig.key === 'amount' ? 'text-[#5D60FF]' : 'text-gray-500'
                                        } ${sortConfig.key === 'amount' && sortConfig.direction === 'desc' ? 'rotate-180' : ''
                                        }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </th>

                                <th className="px-4 pb-3 text-[14px] text-[#000000] font-[600]">
                                  <div className="flex items-center gap-1">
                                    Download Content
                                  </div>
                                </th>
                              </tr>

                            </thead>
                            <tbody className="text-sm text-gray-800">
                              {
                                sortedPaymentHistory?.map((item: any) => {
                                  return (
                                    <tr key={item?.id}>
                                      <td className="pr-4 py-2">{moment(item?.planDate).format('DD MMM YYYY')}</td>
                                      <td className="px-4 py-2">{item?.planName}</td>
                                      <td className="px-4 py-2">${item?.planPrice}</td>
                                      <td className="px-4 py-2">
                                        <Link href={item?.invoiceUrl} target="_blank"
                                          className="bg-[#E4FFD7]  text-[#319F43] px-6 py-1 rounded-full text-xs font-medium">
                                          Download in pdf
                                        </Link>
                                      </td>
                                    </tr>
                                  )
                                })
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>


                    </div>
                  </>
                }
              </div>
            )}

          </div>

          <CancelSubscriptionWarningDialog
            handleCancelSubscription={handleCancelSubscription}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />

          <OnboardingModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            initialData={onboardingData}
            currentField={editingField}
            handleSave={handleSave}
          />

          <ProfileSummaryModal
            open={isProfileSummaryModalOpen}
            onOpenChange={setIsProfileSummaryModalOpen}
            userData={userData}
            handleSave={handleSave}
            fetchData={fetchData}
          />

          <ConformationModal
            isOpen={upgradePlan}
            onClose={() => setUpgradePlan(false)}
            title="Upgrade Plan"
            description="Are you sure you want to upgrade your plan? This will upgrade your plan to the selected plan."
            // iconType="warning"
            primaryButton={{
              text: "Continue",
              onClick: () => handlePlanUpgradation(),
              disabled: loading,
              loading: loading
            }}
            onBackdropClick={() => setUpgradePlan(false)}
            showCloseButton={false}
          />

          <ConformationModal
            isOpen={newChatWarning}
            onClose={() => setNewChatWarning(false)}
            title="New Chat Needed"
            description={
              <div className="flex flex-col items-center gap-[8px]">
                <span className="text-gray-600">To use the updated data in the chat, a new chat is required.</span>
                <span className="text-yellow-500">Note: The old chats contains the previous data. So it is recommended to start a new chat.</span>
              </div>
            }
            // iconType="warning"
            primaryButton={{
              text: "Go to new chat",
              onClick: () => handleNewChat(),
              disabled: loading,
              loading: loading
            }}
            onBackdropClick={() => setNewChatWarning(false)}
            showCloseButton={false}
          />
        </div>
      </div>
    </div>
  );
}
