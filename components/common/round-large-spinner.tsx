const RoundedLargeSpinner = ({ className }: { className?: string }) => {
    return (
        <div className={`${className} absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center flex-col z-[99999]`}>
            <div className={`w-10 h-10 rounded-full animate-spin border-4 border-solid border-primary border-t-transparent shadow-md mt-2`}></div>
        </div>
    )
}

export default RoundedLargeSpinner