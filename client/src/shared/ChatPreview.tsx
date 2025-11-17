type ChatPreviewProps = {
    className?: string;
}

function ChatPreview({className}: ChatPreviewProps) {
    return (
        <div className={`flex flex-col justify-center flex-1 ${className}`}>
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">temp name</h3>
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">12</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
                <p className="truncate max-w-[70%]">hello</p>
                <span>21:30</span>
            </div>
            
        </div>
    )
}

export default ChatPreview;