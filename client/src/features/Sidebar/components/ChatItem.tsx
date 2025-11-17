import { Avatar } from "@/shared/components";

import type { User } from "../types/SidebarTypes";

type ChatItemProps = {
    className?: string;
    user: User;
}

function ChatItem({ className, user }: ChatItemProps) {
    return (
        <div className={`flex items-center gap-3 p-3 hover:bg-gray-100 cursor-pointer ${className}`}>
            <Avatar src={`${user.avatarUrl}`} className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center" />
            {/* <ChatPreview className={``}/> */}
            <div className={`flex flex-col justify-center flex-1 ${className}`}>
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{user.numUnread}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <p className="truncate max-w-[70%]">hello</p>
                    <span>21:30</span>
                </div>
                
            </div>
        </div>
    )
}

export default ChatItem;