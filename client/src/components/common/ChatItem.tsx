import Avatar from "./Avatar";
import ChatPreview from "./ChatPreview";

type ChatItemProps = {
    avatarUrl: string;
    className?: string;
}

function ChatItem({avatarUrl, className}: ChatItemProps) {
    return (
        <div className={`flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer ${className}`}>
            <Avatar src={avatarUrl} />
            <ChatPreview className={`bg-blue-200`}/>
        </div>
    )
}

export default ChatItem;