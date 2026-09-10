import { Button } from "@/components/ui/button"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import { Montserrat } from "next/font/google"
import Image from "next/image"
export const montserrat = Montserrat({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
})
const OnboardingSidebar = ({ description }: { description: string }) => {

    const router = useRouter();

    const handleLogout = () => {
        Cookies.remove("userId");
        Cookies.remove("token");
        localStorage.clear();
        router.push("/login");
    };

    return (
        <div className={`w-full 2xl:max-w-[460px] lg:max-w-[400px] max-w-full bg-[#FFFDF8] flex flex-col 2xl:h-screen justify-between lg:py-0 py-4 -pt-[42px] ${montserrat.className}`}>
            {/* Logo in top corner */}
            <div className="mt-[42px]">
                <Image
                    src="/images/logos/klque-logo.PNG"
                    alt="KLQUE Logo"
                    width={170}
                    height={41}
                    priority
                    className="max-w-full pl-[41px] h-auto" />
            </div>

            {/* Main content centered */}
            <div className="md:px-0 px-6 lg:py-0 py-8 flex flex-col justify-center items-center">
                <h2 className={`text-[30px] font-[700] ${montserrat.className}`}>hey, it&apos;s Ina!</h2>

                <div className="relative w-full max-w-xs my-[55px]">
                    <Image
                        src="/images/pages/onboarding-1.svg"
                        alt="Ina"
                        width={341}
                        height={272}
                        priority
                        className="mx-auto"
                    />
                </div>

                <div className="w-full max-w-xs mb-8">
                    <p className="md:text-[18px] text-[14px] font-[500] text-[#000] text-center">
                        {description}
                    </p>
                </div>
            </div>
            <div className="max-w-xs mx-auto mb-[59px]">
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="bg-transparent text-[#172B85] !text-[13px] font-[600] hover:text-[#172B85] flex items-center gap-2 w-full border-[#172B85] !py-[8px] !h-full !rounded-[3px] !px-[15px]"
                >
                    Log in with a different account ?
                </Button>
            </div>

        </div>
    )
}

export default OnboardingSidebar;