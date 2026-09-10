import { PlanDashboard } from "@/app/(pages)/plan/components/plan-dashboard"
import { Sidebar } from "@/components/sidebar"

export default function Plan() {
  return (
    <div className="flex shrink-0 bg-gray-50">


      <Sidebar />
      <div className="flex-1 flex flex-col ">
        {/* <div className="p-4 bg-white border-b"> */}
          {/* Remove the SearchBar import and component usage */}
        {/* </div> */}
        <div className="flex-1 overflow-auto bg-[#FCF7E4] ">
          <PlanDashboard />
        </div>
      </div>
    </div>
  )
}