"use client"
import { Sidebar } from "@/components/sidebar";
import { ChatInterface } from "@/components/chat-interface";
import Cookies from "js-cookie";
import { apiClient } from "@/client/client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RoundedLargeSpinner from "@/components/common/round-large-spinner";
import { montserrat } from "@/app/layout"
import dynamic from "next/dynamic";

const Tour = dynamic(() => import("@/components/tour/tour"), {
  ssr: false,
});

async function fetchLastConversationHistoryId(userId: string): Promise<string | null> {
  try {
    const response = await apiClient(`/api/get-user?userId=${userId}`, { method: "GET" });
    return response?.user?.lastConversationHistoryId || "";
  } catch (error) {
    return null;
  }
}

export default function Ideate() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = useMemo(() => {
    const cookie = Cookies.get("userId");
    return cookie || "";
  }, []);

  const [loading, setLoading] = useState(true);
  const [localUser, setLocalUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setLocalUser(JSON.parse(storedUser));
      }
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!userId) {
        setLoading(false); // Unauthenticated, but let UI render
        return;
      }

      const chatParamExists = searchParams?.get("chat");
      const newParamExists = searchParams?.get("new");
      if (chatParamExists || newParamExists) {
        setLoading(false); // Already has chat ID, just render
        return;
      }

      const historyId = await fetchLastConversationHistoryId(userId);
      if (historyId) {
        const currentParams = new URLSearchParams(searchParams?.toString());
        currentParams.delete('chat');
        currentParams.append('chat', historyId);
        router.replace(`${window.location.pathname}?${currentParams.toString()}`);
      }

      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };

    init();
  }, [userId, router, searchParams]);

  return (
    <div className={`${montserrat.className}`}>
      <div className={`flex h-screen bg-gray-50`}>

        <Sidebar />
        <div className="flex-1 flex flex-col w-[calc(100vw-90px)]">
          {/* <div className="p-4 bg-white border-b"></div> */}
          {loading ? <div className="flex justify-center"><RoundedLargeSpinner /></div> : <ChatInterface />}
          {localUser && <Tour user={localUser} setUser={setLocalUser} />}
        </div>
      </div>
    </div>
  );
}