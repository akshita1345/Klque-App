
const DotsSpinner = ({ w, h }: any) => {
    return (
        <div className="flex space-x-2 animate-pulse">
            <div className={`w-${w} h-${h} bg-rose-400 rounded-full`}></div>
            <div className={`w-${w} h-${h} bg-rose-400 rounded-full`}></div>
            <div className={`w-${w} h-${h} bg-rose-400 rounded-full`}></div>
        </div>
    )
}

export default DotsSpinner