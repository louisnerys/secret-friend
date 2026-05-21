export interface User {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export interface Event {
  id: string;
  name: string;
  description: string;
  status: "open" | "drawn" | "closed";
  reveal_date?: string;
  creator_id: string;
}

export interface WishlistItem {
  id: string;
  event_id: string;
  user_id: string;
  description: string;
  created_at?: string;
}

export interface Participant {
  user_id: string;
  event_id?: string;
  drawn_id?: string;
  wishlist?: string;
  wishlist_items?: WishlistItem[];
  users?:
    | {
        name: string;
      }
    | {
        name: string;
      }[];
}

export interface Message {
  id: string;
  event_id: string;
  sender_id: string;
  text: string;
  reactions: Record<string, string>;
  created_at: string;
  users?:
    | {
        name: string;
      }
    | {
        name: string;
      }[];
}

export interface PrivateMessage {
  id: string;
  event_id: string;
  sender_id?: string;
  recipient_id?: string;
  text: string;
  chat_type: "drawn" | "drawer";
  sender_display: string;
  is_mine?: boolean;
  created_at: string;
}

export interface AdminMetrics {
  mau: number;
  events: {
    open: number;
    drawn: number;
    finished: number;
  };
  engagement: {
    total_participants: number;
    with_wishlist: number;
    rate_percentage: number;
  };
  messages_24h: number;
}

export interface ExclusionGroup {
  id: string;
  event_id: string;
  name: string;
  created_at?: string;
  exclusion_group_members?: ExclusionGroupMember[];
}

export interface ExclusionGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at?: string;
}
