import Avatar from "../common/Avatar";
import ChatPreview from "./ChatPreview";

type ChatItemProps = {
    avatarUrl: string;
    className?: string;
}

function ChatItem({avatarUrl, className}: ChatItemProps) {
    return (
        <div className={`flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer ${className}`}>
            <Avatar src={avatarUrl} className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center" />
            <ChatPreview className={``}/>
        </div>
    )
}

export default ChatItem;