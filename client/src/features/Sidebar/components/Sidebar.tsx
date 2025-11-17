import { useState, useEffect  } from 'react';
// import ChatItem from "../common/ChatItem";

import ChatList from "./ChatList";
import SearchBar from "./SearchBar";
import TagBar from "./TagBar";

import type { User, Folder } from '../types/SidebarTypes';

type SidebarProps = {
    className?: string;
}

function Sidebar({ className }: SidebarProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            console.log("fetching users......");
            try {
                const response = await fetch('http://localhost:3030/users');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const usersData: User[] = await response.json();
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        console.log("fetching folders.......");
        const fetchFolders = async () => {
            try {
                const response = await fetch('http://localhost:3030/folders');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const foldersData : Folder[] = await response.json();
                setFolders(foldersData);
            } catch (error) {
                console.error('Error fetching folders:', error)
            }
        };
        fetchFolders();
    }, []);

    return (

        <div className={`${className}`}>
            <SearchBar className="flex flex-row"/>
            <TagBar
                className=''
                folders={folders}
            />

            <ChatList 
                className="overflow-y-scroll scrollbar-hidden"
                users={users}
            />
        </div>

    );
}

export default Sidebar;