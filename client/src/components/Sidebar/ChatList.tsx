import ChatItem from "./ChatItem";


type ChatListProps = {
    className?: string;
}

function ChatList({ className }: ChatListProps ) {
    return (
        <div className={`${className}`}>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
            <ChatItem avatarUrl="https://i.pravatar.cc/150?img=1"/>
        </div>
    );
}

export default ChatList;