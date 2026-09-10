import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PropsType {
  isOpen: boolean,
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
  handleCancelSubscription: () => Promise<void>
}
const CancelSubscriptionWarningDialog: React.FC<PropsType> = ({ isOpen, setIsOpen, handleCancelSubscription }) => {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <div className="pt-[1.25rem] flex items-center flex-col">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-[90px] h-[90px] text-orange-400 lucide lucide-circle-alert"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
          <p className="text-lg font-medium my-[1.5rem]">Are you sure to cancel your subscription?</p>
          <div className="flex justify-center">
            <Button onClick={handleCancelSubscription}>Yes</Button>
            <Button onClick={() => setIsOpen(!isOpen)} variant="secondary" className="ml-3">Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CancelSubscriptionWarningDialog