import { Outlet } from 'react-router-dom';

export default function MainLayout() {
    return (
        <div>
            <div className="MainLayout">
                this is main layout
            </div>
            <Outlet/>
        </div>
        
    );
}

