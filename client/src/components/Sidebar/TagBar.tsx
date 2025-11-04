

function TagBar() {
    return (
        <div>
            <ul className="flex flex-row rounded-full overflow-x-scroll scrollbar-hidden">
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>All</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Private</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Groups</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Folder1</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Folder2</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Folder3</a></li>
                <li className="px-3 bg-gray-100 cursor-pointer hover:bg-white hover:rounded-full hover:border-1"><a>Learn</a></li>
            </ul>
        </div>
    );
}

export default TagBar;
