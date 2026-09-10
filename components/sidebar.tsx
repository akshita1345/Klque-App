"use client";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Calendar, Settings, LogOut, Zap } from "lucide-react";
import Cookies from "js-cookie";
import { useToast } from "./ui/use-toast";
import Avatar1 from "@/public/images/avatars/1.png";
import { apiClient } from "@/client/client";

const montserrat = Montserrat({ subsets: ["latin"] });

export function Sidebar() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [loginUser, setLoginUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") as string) : null;
    setLoginUser(user);
  }, []);

  const navItems = [
    {
      label: "Ideate", icon: Zap, path: "/ideate", image: <Image
        src="/images/pages/ideate_black.svg"
        alt="Logo"
        width={20}
        height={20}
        className="object-contain"
      />
    },

    {
      label: "Plan", icon: FileText, path: "/plan", image: <Image
        src="/images/pages/plan.svg"
        alt="Logo"
        width={16}
        height={20}
        className="object-contain"
      />
    },
    {
      label: "Calendar", icon: Calendar, path: "/calender", image: <Image
        src="/images/pages/calender-1.svg"
        alt="Logo"
        width={18}
        height={20}
        className="object-contain"
      />
    },
  ];

  const handleLogout = () => {
    Cookies.remove("userId");
    Cookies.remove("token");
    localStorage.clear();
    router.push("/login");
    toast({ description: "You are logged out successfully!" });
  };

  return (
    <div className={`w-[70px] border-r flex flex-col items-center bg-[#FFFDF8] border-[#E5E8F6] relative z-10 rounded-0 pb-[30px] ${montserrat.className}`}>
      {/* Header */}
      <div className="pt-[30px] px-[14px] w-full flex justify-center">
        <Image
          src="/images/logos/Logo.PNG"
          alt="Logo"
          width={31.79}
          height={33.56}
          className="object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="pt-[80px] flex-1 flex flex-col items-center w-full">
        {navItems.map(({ label, icon: Icon, path, image }) => {

          const isActive = pathname === path;
          return (
            <Link
              key={label}
              href={path}
              className={`py-[10px] w-[70px] h-[57px] rounded-[10px] transition-colors
                ${isActive ? "bg-[#E5E8F6]" : "hover:bg-transparent"}
              `}
              title={label}
              id={label === "Plan" ? "tour-sidebar-plan" : label === "Calendar" ? "tour-sidebar-calendar" : undefined}
            >
              <div className={`flex justify-center items-center transition-colors ${isActive ? "[filter:brightness(0)_saturate(100%)_invert(28%)_sepia(85%)_saturate(3942%)_hue-rotate(233deg)_brightness(94%)_contrast(98%)]" : "text-black"}`}>
                {image}
              </div>
              <p className={`text-[10px] text-[#000000] mt-[5px] text-center font-medium ${isActive ? "text-[#5D60FF] font-[600]" : "text-black"}`}>{label}</p>
            </Link>
          );
        })}
      </nav>

      {/* Settings & Logout */}
      <div className={`py-[10px] w-full rounded-[10px] transition-colors
            ${pathname === "/settings" ? "bg-[#E5E8F6]" : "hover:bg-transparent"}`}>
        <Link
          href="/settings"
          className={`w-[70px] h-[57px] rounded-[10px] transition-colors
            ${pathname === "/settings" ? "bg-[#E5E8F6]" : "hover:bg-transparent"}
          `}
          title="Settings"
          id="tour-sidebar-settings"
        >
          <div className={`flex justify-center items-center transition-colors ${pathname === "/settings" ? "[filter:brightness(0)_saturate(100%)_invert(28%)_sepia(85%)_saturate(3942%)_hue-rotate(233deg)_brightness(94%)_contrast(98%)]" : "text-black"}`}>
            <Image src="/images/pages/setting.svg" alt="Logo" width={20} height={20} className={`w-5 h-5 transition-colors ${pathname === "/settings" ? "text-white" : "text-black"}`} />
            {/* <Settings className={`w-5 h-5 transition-colors ${pathname === "/settings" ? "text-white" : "text-black"}`} /> */}
          </div>
          <p className={`text-[10px] text-[#000000] mt-[5px] text-center font-medium ${pathname === "/settings" ? "text-[#5D60FF] font-[600]" : "text-black"}`}>Setting</p>
        </Link>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="w-[60px] h-[57px] rounded-[10px] py-[10px]"

          title="Logout"
        >
          <div className="flex justify-center items-center">
            <Image src="/images/pages/log-out.svg" alt="Logo" width={20} height={20} className="object-contain" />
          </div>
          <p className="text-[10px] text-[#000000] mt-[5px] text-center font-medium">Log Out</p>
        </button>
      </div>
    </div>
  );
}