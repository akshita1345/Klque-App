"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { montserrat, delaGothic } from "@/app/layout"
import { ArrowLeft } from "lucide-react"

export default function TermsOfUse() {
  return (
    <div className={`min-h-screen ${montserrat.className}`} style={{ backgroundColor: '#FFFDF8' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="lg:mb-[92px] mb-[20px]">
          <Link href="/welcome" className="inline-flex items-center text-[#5D60FF] hover:underline mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <h1 className={`text-center md:text-4xl text-[18px] font-bold text-[#0C0829] mb-4 ${montserrat.className}`}>
            Terms of Use
          </h1>
          <p className="lg:text-center text-right text-gray-600 lg:text-[16px] text-[12px]">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="lg:space-y-8 space-y-4 text-[#0C0829]">

            <section>
              <p className="lg:mb-8 mb-4 md:text-lg text-[14px] font-[500]">
                Welcome to Klque! These Terms of Service ("Terms") outline the rules and guidelines for using our app and related services ("Service"). By accessing or using Klque, you agree to these Terms.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">1. Who Can Use Klque</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                You must be at least 18 years old to use Klque. By using the Service, you confirm that you meet this requirement and that all information you provide is accurate and up to date.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">2. Your Account</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                You may need to create an account to access certain features. You are responsible for keeping your login credentials secure and for all activity under your account.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">3. Using Klque Responsibly</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">You agree not to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li className="md:text-[16px] text-[14px] font-[500]">Use the Service for any illegal or harmful purposes</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Share misleading, offensive, or copyrighted content you don't own</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Attempt to hack, disrupt, or misuse any part of the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">4. Our AI and Your Data</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                To offer personalized experiences, Klque uses artificial intelligence (AI). When you provide input, such as your business details, preferences, or social media content, we process that data to generate customized suggestions and insights.
              </p>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Your data is securely stored and used only to improve your experience. We never sell your personal information to third parties. For more details, see our <Link href="/privacy-policy" className="text-[#5D60FF] hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">5. Content Ownership</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                You retain ownership of any original content you upload. By using Klque, you grant us a license to use your content solely to provide and improve the Service.
              </p>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                All software, branding, and technology within Klque belong to us or our licensors.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">6. Pricing</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Klque offers paid access to its tools and features. The current pricing is:
              </p>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                <strong>Standard Plan:</strong> $50 (one-time or monthly, depending on offering).
              </p>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                All prices are in USD and exclusive of applicable taxes unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">7. Payment Processing</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                All payments are processed securely via our third-party payment provider (e.g., Stripe). Klque does not store your credit card details on its servers.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">8. Refund Policy</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                All payments made to Klque are non-refundable, including in cases of early access offers, unless otherwise required by law. Please review product features before purchasing.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">9. Coupons and Discounts</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                From time to time, Klque may offer promotional discounts or coupon codes (e.g., KLQUEFIRST25). These are:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li className="md:text-[16px] text-[14px] font-[500]">Only valid for the time period and conditions stated.</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Non-transferable and not redeemable for cash.</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Subject to cancellation or change without notice.</li>
              </ul>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">10. Failed Payments & Access Suspension</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                If a payment fails or is disputed, Klque reserves the right to suspend or terminate your access until the issue is resolved.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">11. Subscription (If Applicable in Future)</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                If Klque introduces subscription plans:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li className="md:text-[16px] text-[14px] font-[500]">You'll be billed in advance on a recurring basis (monthly or annually).</li>
                <li className="md:text-[16px] text-[14px] font-[500]">You can cancel anytime from your account settings.</li>
                <li className="md:text-[16px] text-[14px] font-[500]">No refunds are issued for partial billing periods.</li>
              </ul>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">12. Changes to Pricing</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Klque may change pricing at any time. For existing users, any changes will be communicated in advance and take effect at the start of the next billing cycle (if applicable).
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">13. Termination</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We may suspend or terminate your account if you violate these Terms or misuse the Service. You may delete your account anytime by contacting us.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">14. Disclaimers</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Klque is provided "as is." We do not guarantee it will always be available or error-free. You're responsible for how you use any content or recommendations generated by the app.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">15. Limitation of Liability</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                To the fullest extent allowed by law, Klque and its team are not liable for any indirect, incidental, or consequential damages resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">16. Changes to These Terms</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We may update these Terms occasionally. If we do, we'll notify you in the app or by email. Continued use of Klque means you accept the revised Terms.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] lg:mb-4 mb-0">17. Contact</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Questions? Contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium lg:text-[16px] text-[14px]">
                  Email: <a href="mailto:contact@klque.ai" className="text-[#5D60FF] hover:underline">contact@klque.ai</a>
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
            <Link href="/welcome">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Welcome
              </Button>
            </Link>
            <p className="text-sm text-gray-500 text-center sm:text-right">
              By using Klque, you agree to these Terms of Use
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 