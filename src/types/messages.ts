export interface MessageThread {
  otherUserId: string;
  otherName: string;
  otherUsername: string | null;
  otherImageUrl: string | null;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}