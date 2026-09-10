"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { usePathname } from "next/navigation";
import SubscriptionOverModal from "@/components/common/subscription-over-modal";

interface SubscriptionContextType {
    subscriptionStatus: "active" | "inactive" | "loading";
}

const SubscriptionContext = createContext<SubscriptionContextType>({
    subscriptionStatus: "loading",
});

export const useSubscription = () => useContext(SubscriptionContext);

export default function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [subscriptionStatus, setSubscriptionStatus] =
        useState<"active" | "inactive" | "loading">("loading");

    /**
     * 🔹 Fetch user subscription status
     */
    const fetchUser = async () => {
        try {
            const user = localStorage.getItem("user")
                ? JSON.parse(localStorage.getItem("user") as string)
                : null;

            if (!user?._id) {
                setSubscriptionStatus("loading");
                return;
            }

            const res = await fetch(`/api/get-user?userId=${user?._id}`);
            const data = await res.json();

            if (!data?.user?._id) {
                setSubscriptionStatus("loading");
                return;
            } else {
                setSubscriptionStatus(data?.user?.isSubscribed ? "active" : data?.user?.onboardingStep === 0 ? "loading" : "inactive");
            }
            // ✅ Use isSubscribed directly
        } catch (err) {
            console.error("Error fetching subscription:", err);
            setSubscriptionStatus("loading");
        }
    };

    // 🔄 Refresh on first load
    useEffect(() => {
        fetchUser();
    }, []);

    // 🔄 Refresh on every route change
    useEffect(() => {
        if (pathname) {
            fetchUser();
        }
    }, [pathname]);

    // ✅ Only block scrolling, not pointer events on modal
    useEffect(() => {
        if (subscriptionStatus === "inactive") {
            document.body.style.overflow = "hidden"; // stop scroll
        } else {
            document.body.style.overflow = "auto";
        }
    }, [subscriptionStatus]);

    return (
        <SubscriptionContext.Provider value={{ subscriptionStatus }}>
            {/* Background app (disable interactions when inactive) */}
            <div
                className={
                    subscriptionStatus === "inactive"
                        ? "pointer-events-none"
                        : "pointer-events-auto"
                }
            >
                {children}
            </div>

            {/* Modal (only show if inactive, but NOT on payment success page) */}
            {subscriptionStatus === "inactive" && pathname !== "/payment/success" && (
                <div className="pointer-events-auto fixed inset-0 z-50">
                    <SubscriptionOverModal />
                </div>
            )}
        </SubscriptionContext.Provider>
    );
}