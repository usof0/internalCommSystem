import { NavLink, useNavigate } from "react-router-dom";

import { ChatBubbleOvalLeftIcon } from '@heroicons/react/24/solid';

import Avatar from "@/shared/components/Avatar";




function ControlBar() {
    // const navigate = useNavigate();

    return (
        <div className="max-w-20 min-w-20 min-w-15">
            <div className="temp grow"></div>
            <NavLink to="/chat">
                <ChatBubbleOvalLeftIcon className="h-5 w-5 text-gray-400 mr-2" />
            </NavLink>
            <NavLink to='/profile'>
                <Avatar src="https://i.pravatar.cc/150?img=1" className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"/>
            </NavLink>
        </div>
    );
}

export default ControlBar;