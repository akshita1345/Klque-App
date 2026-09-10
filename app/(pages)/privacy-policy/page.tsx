"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { montserrat, delaGothic } from "@/app/layout"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="lg:text-center text-right text-[#838383] md:text-base text-[12px] ">
            Last updated: {new Date().toLocaleDateString()}
          </p>

        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="lg:space-y-8 space-y-4 text-[#0C0829]">

            <section>
              <p className="lg:mb-8 mb-4 md:text-lg text-[14px] font-[500]">
                Your privacy is important to us. This Privacy Policy explains what data we collect, how we use it, and your rights.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">1. Information We Collect</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We collect the following types of data when you use Klque:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-2 md:text-[16px] text-[14px]">
                <li className="font-[500]">
                  <strong>Personal Info:</strong>  Name, email, business details
                </li>
                <li className="font-[500]"><strong>User Input:</strong> Content you provide for AI suggestions (e.g., brand messaging, target audience)</li>
                <li className="font-[500]"><strong>Usage Data:</strong> Interactions within the app, feature usage, and performance logs</li>
              </ul>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">2. How We Use Your Data</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">We use your information to:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li  className="md:text-[16px] text-[14px] font-[500]">Provide personalized content and recommendations using AI</li>
                <li  className="mb-4 md:text-[16px] text-[14px] font-[500]">Improve the Service based on usage patterns</li>
                <li  className="mb-4 md:text-[16px] text-[14px] font-[500]">Communicate with you about updates, features, or support</li>
                <li  className="mb-4 md:text-[16px] text-[14px] font-[500]">Ensure security and prevent misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">3. AI & Automated Processing</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Your data may be processed through AI systems to generate customized content suggestions. These outputs are generated automatically and are intended to assist you, not replace human judgment.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">4. Data Sharing</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We do not sell your data. We may share it with trusted service providers (e.g., cloud hosting, analytics tools) strictly to support the operation of Klque, and only under confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">5. Data Retention</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We keep your data as long as your account is active or as needed to provide services. You may request deletion at any time by contacting us.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">6. Your Rights</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">You can:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li className="md:text-[16px] text-[14px] font-[500]">Request access to the data we hold about you</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Ask for corrections or updates</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Delete your account and associated data</li>
                <li className="md:text-[16px] text-[14px] font-[500]">Withdraw consent for data processing</li>
              </ul>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                To exercise any of these rights, email us at <a href="mailto:contact@klque.ai" className="text-[#5D60FF] hover:underline">contact@klque.ai</a>
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">7. Security</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We use industry-standard encryption and security measures to protect your data.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">8. Children's Privacy</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                Klque is not intended for children under 18. We do not knowingly collect data from anyone under this age.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">9. Updates to This Policy</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                We may update this Privacy Policy. If changes are made, you'll be notified through the app or email.
              </p>
            </section>

            <section>
              <h2 className="md:text-[25px] text-[14px] font-[700] text-#5D60FF">10. Contact</h2>
              <p className="mb-4 md:text-[16px] text-[14px] font-[500]">
                For questions or concerns, contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium md:text-[16px] text-[14px]">
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
              By using Klque, you agree to this Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 