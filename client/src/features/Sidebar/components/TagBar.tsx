import type { Folder } from '../types/SidebarTypes';

type TagBarProps = {
    className?: string;
    folders: Folder[];
}


function TagBar( { className, folders }: TagBarProps ) {


    return (
        <div className={ className }>
            <div className="flex flex-row rounded-full overflow-x-scroll scrollbar-hidden">
                {
                    folders.map(folder => (
                    <div
                        key={folder.folderid}
                        className='px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1'
                    > {folder.name} </div>
                ))};
            </div>
        </div>
    );
}

export default TagBar;
