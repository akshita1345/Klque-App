

const TypingDotSpinner = () => {
    return (
        <div className='flex space-x-2'>
            <div className='h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]'></div>
            <div className='h-2 w-2 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]'></div>
            <div className='h-2 w-2 bg-rose-400 rounded-full animate-bounce'></div>
        </div>
    )
}

export default TypingDotSpinner;