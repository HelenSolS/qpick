
export type City = 'MSK' | 'SPB';

export interface CertificateType {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  includes: string[];
  image: string;
  category: 'solo' | 'couple' | 'premium';
}

export interface OrderDetails {
  orderId: string;
  transactionId: string;
  purchaseDate: string;
  expiryDate: string; // ISO format date string
  certificateId: string;
  certName: string;
  city: City;
  price: number;
  senderName: string;
  recipientName: string;
  paymentMethod: string;
  greetingMessage: string;
  status: 'active' | 'used';
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  headerColor: string;
  setHeaderColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  showAlert: (message: string, callback?: () => void) => void;
  MainButton: {
    text: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback?: () => void) => void;
    setText: (text: string) => void;
    setParams: (params: {
      text?: string;
      is_visible?: boolean;
      color?: string;
      text_color?: string;
      is_active?: boolean;
    }) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
