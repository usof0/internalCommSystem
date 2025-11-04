import ChatHeader from "./ChatHeader";

type ChatAreaProps = {
    className?: string;
}

function ChatArea({ className }: ChatAreaProps) {
    return (
        <div className={`${className}`}>
            <ChatHeader avatarUrl="https://i.pravatar.cc/150?img=1" className="flex flex-row px-3 py-1"/>
            <div className="bg-gray-500 w-full h-full"></div>
        </div>
    );
}


export default ChatArea;