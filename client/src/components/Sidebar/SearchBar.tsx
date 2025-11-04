import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/solid'

type SearchBarProps = {
    className?: string;
}

function SearchBar({ className }: SearchBarProps) {
    return (
        // bg-gradient-to-r from-blue-50 via-blue-100 to-gray-50
        <div className={`${className}`}>
            <button className="mr-1 py-1 px-3 rounded hover:bg-gray-200 focus:outline-none">
                <Bars3Icon className="h-6 w-6 text-gray-700" />
            </button>

            <div className="flex items-center bg-gray-100 rounded-full px-3 py-2">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-2" />
                <input
                    type="text"
                    className="bg-gray-100 outline-none w-full text-base"
                    placeholder="Search"

                />
            </div>

            
            
        </div>
    );
}

export default SearchBar;
