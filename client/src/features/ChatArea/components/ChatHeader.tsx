import { Avatar } from "@/shared/components";

import { MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/react/24/solid';

type ChatHeaderProps = {
    avatarUrl: string;
    className?: string;
}

function ChatHeader({avatarUrl, className}: ChatHeaderProps) {
    return (
        <div className={`${className}`}>

            <Avatar src={avatarUrl} className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"/>
            
            <div className="flex grow justify-between items-center">
                <div className="flex flex-col mx-2 ">

                    <div className="">
                        <h3 className="text-lg font-semibold text-gray-900">temp name</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                        <p className="truncate max-w-[70%]">last seen 2h ego</p>
                    </div>

                </div>
                <div className="flex justify-between items-center">

                    <button className="mr-1 p-2 rounded-full hover:bg-gray-200 focus:outline-none">
                        <MagnifyingGlassIcon className="h-6 w-6 text-gray-700" />
                    </button>
                    <button className="mr-1 p-2 rounded-full hover:bg-gray-200 focus:outline-none">
                        <EllipsisVerticalIcon className="h-6 w-6 text-gray-700" />
                    </button>

                </div>
            </div>
            
        </div>
        
    );
}

export default ChatHeader;