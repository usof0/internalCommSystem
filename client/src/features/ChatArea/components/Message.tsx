import type { Message } from "../Types";

type MessageBodyProps = {
    className?: string;
    Message: Message;
}
function MessageBody({ className, Message }: MessageBodyProps) {
    return (
        <div className={className}>
            <div>

            </div>
            <div>
                <h3>{ Message.senderName }</h3>
                <p>{ Message.text }</p>
            </div>
            
        </div>
    );
}