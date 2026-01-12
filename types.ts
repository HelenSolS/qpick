
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
  certificateId: string;
  city: City;
  senderName: string;
  recipientName: string;
  deliveryMethod: 'email' | 'telegram';
  deliveryEmail?: string;
  deliveryTgHandle?: string;
  greetingMessage: string;
}

export interface GreetingTone {
  id: string;
  label: string;
}

/**
 * Detailed Telegram WebApp interface based on properties used in the app.
 */
export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  headerColor: string;
  enableClosingConfirmation: () => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback?: () => void) => void;
    setText: (text: string) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
  };
}

// Define the Telegram WebApp interface to extend the global Window object
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
