
type AvatarProps = {
    src: string;
    alt?: string;
    className?: string;
}

function Avatar({ src, alt = "User Avatar", className }: AvatarProps) {
    return (
        <div className={`w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center ${className}`}>
            {src ? (
                <img src={src} alt={alt} className="w-full h-full object-cover"/>
            ) : (
            <span className="text-xs text-gray-500"> No Image </span>
            )}
        </div>
    )
}

export default Avatar;