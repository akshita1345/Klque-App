import { Sidebar } from "@/components/sidebar"
import { HomeDashboard } from "@/components/home-dashboard"
import { Bell } from 'lucide-react'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* <div className="p-4 bg-white border-b"> */}
          {/* Remove the SearchBar import line and component usage */}
        {/* </div> */}
        <div className="flex-1 overflow-auto">
          <HomeDashboard />
        </div>
      </div>
    </div>
  )
}