export type Message = {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  avatarUrl?: string;
  timestamp: string;
  isMine: boolean;
  status?: "sent" | "delivered" | "read";
  replyTo?: string;
  attachments?: { type: string; url: string }[];
  edited?: boolean;
  deleted?: boolean;
};

