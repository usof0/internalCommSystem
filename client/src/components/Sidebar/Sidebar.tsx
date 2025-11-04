
// import ChatItem from "../common/ChatItem";

import ChatList from "./ChatList";
import SearchBar from "./SearchBar";
import TagBar from "./TagBar";

type SidebarProps = {
    className?: string;
}

function Sidebar({ className }: SidebarProps) {
    return (

        <div className={`${className}`}>
            <SearchBar className="flex flex-row "/>
            <TagBar/>
            <ChatList className="overflow-y-scroll scrollbar-hidden"/>
        </div>

    );
}

export default Sidebar;