"use client";
import { Sidebar } from "@/components/sidebar";
import { Montserrat } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { apiClient } from "@/client/client";
import Cookies from "js-cookie";
import { useToast } from "@/components/ui/use-toast";

const montserrat = Montserrat({ subsets: ["latin"] });

export default function DeleteAccount() {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    try {
      setIsDeleting(true);

      // Call the delete account API
      await apiClient("/api/delete-account", {
        method: "DELETE",
      });

      // Clear cookies
      Cookies.remove("userId");
      localStorage.clear();
      Cookies.remove("token");

      // Redirect to success page
      router.push("/account-deleted");

    } catch (error: any) {
      console.error("Account deletion failed:", error);
      toast({
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleContactUs = () => {
    // Open email client or redirect to contact page
    window.location.href = "mailto:contact@klque.com";
  };

  return (
    <div className={`flex h-screen ${montserrat.className}`} style={{ backgroundColor: '#FCF7E4' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto md:p-8 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg md:p-8 p-4 shadow-sm border">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-8 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
              </button>

              {/* Content */}
              <div>
                <h1 className="text-2xl font-medium text-gray-900 mb-6">are you sure?</h1>

                <p className="text-black text-base leading-relaxed mb-8 max-w-md">
                  this will permanently delete your account, ideas, and saved content. you won't be able to recover them later.
                </p>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleContinue}
                    disabled={isDeleting}
                    className="disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-md transition-colors"
                    style={{ backgroundColor: '#5D60FF' }}
                    onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = '#4A4DCC')}
                    onMouseLeave={(e) => !isDeleting && (e.currentTarget.style.backgroundColor = '#5D60FF')}
                  >
                    {isDeleting ? "deleting..." : "continue"}
                  </button>

                  <button
                    onClick={handleContactUs}
                    className="text-gray-500 hover:text-gray-700 text-sm underline transition-colors"
                  >
                    contact us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 