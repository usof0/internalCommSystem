export interface LastMessage {
  messageid: string | number;
  firstFewLetters: string;
  time: string;
  delivered: boolean;
  read: boolean;
}

export interface User {
  userid: string | number;
  name: string;
  userType: "student" | "teacher" | "admin";
  avatarUrl?: string;
  numUnread: number;
  status: string;
  favorite: boolean;
  lastMessage: LastMessage;
  folders: string[];
}

export interface Folder {
  folderid: string | number;
  name: string;
  users: {
      userid: string | number;
  } [];
}