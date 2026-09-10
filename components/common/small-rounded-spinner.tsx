const SmallRoundedSpinner = ({ className }: { className?: string }) => {
  return (
    <div className={`${className} w-4 h-4 rounded-full animate-spin border-[2px] border-solid border-primary border-t-transparent shadow-md`}></div>
  )
}

export default SmallRoundedSpinner