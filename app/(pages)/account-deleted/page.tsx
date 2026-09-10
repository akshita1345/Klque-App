"use client";
import { Sidebar } from "@/components/sidebar";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function AccountDeleted() {
  const router = useRouter();

  const handleRejoinKlque = () => {
    // Clear any remaining cookies and redirect to homepage
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });

    // Redirect to homepage/landing page
    router.push("/");
  };

  return (
    <div className={`flex h-screen ${montserrat.className}`} style={{ backgroundColor: '#FCF7E4' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto md:p-8 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg md:p-8 p-4 shadow-sm border">
              {/* Content */}
              <div className="text-center">
                <h1 className="text-2xl font-medium text-gray-900 mb-6">you're signed off</h1>

                <div className="space-y-4 mb-8 max-w-lg mx-auto">
                  <p className="text-gray-700 text-base leading-relaxed">
                    we've successfully closed your Klque account. we're grateful you gave us a shot, and we hope to see you again someday.
                  </p>

                  <p className="text-gray-700 text-base leading-relaxed">
                    if you ever want to return, we'll be right here with fresh ideas waiting for you.
                  </p>
                </div>

                {/* Rejoin Button */}
                <button
                  onClick={handleRejoinKlque}
                  className="bg-[#5D60FF] hover:bg-[#5D60FF] text-white font-medium py-3 px-8 rounded-md transition-colors"
                >
                  rejoin Klque
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 