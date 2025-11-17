import type { User } from '../types/SidebarTypes';
import ChatItem from "./ChatItem";


type ChatListProps = {
    className?: string;
    users: User[]
}

function ChatList({ className, users }: ChatListProps ) {
    return (
        <div className={`${className}`}>
            {users.map(user => (
                <ChatItem
                    key={user.userid}
                    className=''
                    user={user}
                />
            ))}
            
        </div>
    );
}

export default ChatList;