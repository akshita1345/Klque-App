"use client";

import { useEffect, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { tourSteps } from "./steps";
import { apiClient } from "@/client/client";

interface TourProps {
  user: any;
  setUser?: (user: any) => void;
}

export default function Tour({ user, setUser }: TourProps) {
  const driverObj = useRef<any>(null);
  const userRef = useRef(user);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const forceStart = searchParams.get('tour') === 'true';

  // Keep userRef up to date with the latest user object for callbacks
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const syncTour = async (isCompleted: boolean, currentStep: number) => {
    // Disable sync for manual re-runs (Take a Tour from settings)
    if (forceStart) return;

    try {
      // Immediately sync with local storage
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.onboarding) parsedUser.onboarding = {};
        parsedUser.onboarding.tour = {
          isCompleted,
          currentStep
        };
        localStorage.setItem("user", JSON.stringify(parsedUser));
        setUser?.(parsedUser);
      }

      const response = await apiClient("/api/update-user", {
        method: "PUT",
        body: JSON.stringify({
          onboarding: {
            ...userRef.current.onboarding,
            tour: {
              isCompleted,
              currentStep
            }
          }
        })
      });

      if (response?.success && response?.user) {
        localStorage.setItem("user", JSON.stringify(response.user));
        setUser?.(response.user);
      }
    } catch (error) {
      console.error("Failed to sync tour status:", error);
    }
  };

  useEffect(() => {
    if (!userRef.current) return;

    const isTourCompleted = userRef.current?.onboarding?.tour?.isCompleted;

    if (isTourCompleted && !forceStart) return;

    const initialStep = userRef.current?.onboarding?.tour?.currentStep || 0;

    driverObj.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: "Done",
      nextBtnText: "Next",
      prevBtnText: "Previous",
      progressText: "{{current}} of {{total}}",
      steps: tourSteps(driverObj),
      onHighlighted: (element, step, { state }) => {
        const currentIdx = driverObj.current.getActiveIndex();
        syncTour(false, currentIdx);
      },
      onNextClick: () => {
        const isLastStep = driverObj.current.getActiveIndex() === tourSteps(driverObj).length - 1;
        if (isLastStep) {
          syncTour(true, 0);
          driverObj.current.destroy();
        } else {
          driverObj.current.moveNext();
        }
      },
      onDestroyed: () => {
        const isLastStep = driverObj.current.getActiveIndex() === tourSteps(driverObj).length - 1;
        if (isLastStep) {
          syncTour(true, 0);
        }
        if (forceStart) {
          router.replace(pathname);
        }
      },
      onCloseClick: () => {
        driverObj.current.destroy();
      }
    });

    driverObj.current.drive(initialStep);

    return () => {
      if (driverObj.current) {
        driverObj.current.destroy();
      }
    };
  }, [user?._id, forceStart]);

  return null;
}
