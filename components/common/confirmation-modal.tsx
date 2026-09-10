"use client";
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { Button, LoadingButton } from "../ui/button";

interface PropsType {
    isOpen: boolean,
    loading: boolean,
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
    handleYesFunction: any,
}
const ConfirmationModal: React.FC<PropsType> = ({ isOpen, setIsOpen, loading, handleYesFunction }) => {

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <div className="pt-[1.25rem] flex items-center flex-col">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-[90px] h-[90px] text-orange-400 lucide lucide-circle-alert"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                    <div className="my-[1.5rem] text-center">
                        <p className="text-2xl font-bold mb-[0.5rem]">Are you sure?</p>
                        <p className="text-md">You won`t be able to revert this!</p>
                    </div>
                    <div className="flex justify-center">
                        {loading ?
                            <LoadingButton className="font-[600]" /> :
                            <Button onClick={handleYesFunction}>Yes</Button>
                        }
                        <Button disabled={loading} onClick={() => setIsOpen(false)} variant="secondary" className="ml-3">Cancel</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ConfirmationModal