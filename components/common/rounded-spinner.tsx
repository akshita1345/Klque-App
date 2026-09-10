const RoundedSpinner = ({ className }: { className?: string }) => {
  return (
    <div className="w-full h-full flex justify-center items-center my-3">
      <div className={`${className} w-7 h-7 rounded-full animate-spin border-[3px] border-solid border-primary border-t-transparent shadow-md`}></div>
    </div>
  )
}

export default RoundedSpinner