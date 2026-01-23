// ✅ ИСПРАВЛЕНО: Все вебхуки теперь используют переменные из .env
// Вместо захардкоженных URL используется: import.meta.env.VITE_API_BASE + VITE_INIT_USER_PATH


import React, { useState, useEffect } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK } from './constants.ts';
import { CertificateType, City, OrderDetails } from './types.ts';

const App: React.FC = () => {
  const [city, setCity] = useState<City | null>(null);
  const [view, setView] = useState<'catalog' | 'details' | 'checkout' | 'success' | 'vault'>('catalog');
  const [selected, setSelected] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(false);
  const [vault, setVault] = useState<OrderDetails[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);

  const tg = (window as any).Telegram?.WebApp;

  const [form, setForm] = useState({
    sender: '',
    recipient: '',
    message: ''
  });

  const identifyClient = async () => {
  try {
    const tgUser = tg?.initDataUnsafe?.user;
    if (!tgUser) return;

    const payload = {
      telegram_id: tgUser.id,
      username: tgUser.username,
      first_name: tgUser.first_name,
      last_name: tgUser.last_name,
      // phone/email добавим позже
    };

    const res = await fetch(
      `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_INIT_USER_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'identify_client',
          data: payload,
        }),
      }
    );

    if (!res.ok) return;

    const json = await res.json();
    if (json.client_id) {
      setClientId(json.client_id);
    }
  } catch (e) {
    console.error('identifyClient error', e);
  }
};

  useEffect(() => {
    // 1.
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.enableClosingConfirmation();
    }
    // 2.
    identifyClient();
  }, []);

  const loadVault = async () => {
    if (!clientId) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_INIT_USER_PATH}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'get_vault',
            data: { client_id: clientId },
          }),
        }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.orders) {
          setVault(json.orders);
        }
      }
    } catch (e) {
      console.error('loadVault error', e);
    }
  };

  const handlePurchase = async () => {
    if (!selected || !city || !clientId) return;
    setLoading(true);
    try {
      const orderData = {
        client_id: clientId,
        certificate_id: selected.id,
        cert_name: selected.name,
        city: city,
        price: selected.price,
        sender_name: form.sender,
        recipient_name: form.recipient,
        greeting_message: form.message,
        payment_method: 'card',
      };

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_INIT_USER_PATH}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'create_order',
            data: orderData,
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setView('success');
        }
      }
    } catch (e) {
      console.error('handlePurchase error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Ваш код сдесь полностью */}
    </div>
  );
};

export default App;
