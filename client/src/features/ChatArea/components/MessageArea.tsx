import type { Message } from "../Types";

interface MessageAreaProps {
    className?: string;
    messages: Message[];
    
}

function MessageArea({ className, messages}: MessageAreaProps) {

    let messa : object[] = [
        // from: ""
    ];
    return (
        <div className = {className}>
            {messages.map((msg, i) => (
                <div
                    key={i}
                    className={`mb-2 flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
                >
                    <span
                        className={`px-3 py-2 rounded-lg text-sm max-w-xs break-words ${
                        msg.isMine
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                    >
                        {msg.text}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default MessageArea;
