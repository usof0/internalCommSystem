import Avatar from "../common/Avatar";


function ControlBar() {
    return (
        <div className="max-w-20 min-w-20 min-w-15">
            <div className="temp min-h-220"></div>
            <Avatar src="https://i.pravatar.cc/150?img=1" className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center"/>
        </div>
    );
}

export default ControlBar;