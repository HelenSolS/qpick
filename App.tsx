import React, { useState, useEffect } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK, DESIGNS } from './constants.ts';
import { CertificateType, City, OrderDetails } from './types.ts';

const App: React.FC = () => {
  const [city, setCity] = useState<City | null>(null);
  const [view, setView] = useState<'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'vault'>('catalog');
  const [selected, setSelected] = useState<CertificateType | null>(null);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
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
      };

      const res = await fetch(
        `\${import.meta.env.VITE_API_BASE}\${import.meta.env.VITE_INIT_USER_PATH}`,
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
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.enableClosingConfirmation();
    }
    identifyClient();
  }, []);

  const loadVault = async () => {
    if (!clientId) return;
    try {
      const res = await fetch(
        `\${import.meta.env.VITE_API_BASE}\${import.meta.env.VITE_INIT_USER_PATH}`,
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
        `\${import.meta.env.VITE_API_BASE}\${import.meta.env.VITE_INIT_USER_PATH}`,
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

  const certificates = city === 'MSK' ? CERTIFICATES_MSK : CERTIFICATES_SPB;

  if (!city) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Выберите город</h1>
        <button onClick={() => setCity('MSK')} style={{ margin: '10px', padding: '15px 30px', fontSize: '16px' }}>
          Москва
        </button>
        <button onClick={() => setCity('SPB')} style={{ margin: '10px', padding: '15px 30px', fontSize: '16px' }}>
          Санкт-Петербург
        </button>
      </div>
    );
  }

  if (view === 'catalog') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1>Сертификаты Q-PIC - {city === 'MSK' ? 'Москва' : 'Санкт-Петербург'}</h1>
        <button onClick={() => setCity(null)} style={{ marginBottom: '20px' }}>
          Сменить город
        </button>
        <button onClick={() => { loadVault(); setView('vault'); }} style={{ marginLeft: '10px', marginBottom: '20px' }}>
          Мои покупки
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {certificates.map((cert) => (
            <div key={cert.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px' }}>
              <img src={cert.image} alt={cert.name} style={{ width: '100%', borderRadius: '8px' }} />
              <h3>{cert.name}</h3>
              <p>{cert.description}</p>
              <p><strong>{cert.price} ₽</strong></p>
              <button onClick={() => { setSelected(cert); setView('details'); }}>
                Подробнее
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'details' && selected) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setView('catalog')}>← Назад</button>
        <h1>{selected.name}</h1>
        <img src={selected.image} alt={selected.name} style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }} />
        <p>{selected.description}</p>
        <p><strong>Цена: {selected.price} ₽</strong></p>
        <p>Длительность: {selected.duration}</p>
        <h3>Включено:</h3>
        <ul>
          {selected.includes.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <button onClick={() => setView('checkout')} style={{ padding: '15px 30px', fontSize: '16px' }}>
          Купить
        </button>
      </div>
    );
  }

  if (view === 'checkout' && selected) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setView('details')}>← Назад</button>
        <h1>Оформление заказа</h1>
        <p><strong>{selected.name}</strong> - {selected.price} ₽</p>
        <div style={{ marginTop: '20px' }}>
          <label>
            От кого:
            <input
              type="text"
              value={form.sender}
              onChange={(e) => setForm({ ...form, sender: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </label>
          <label style={{ marginTop: '15px', display: 'block' }}>
            Кому:
            <input
              type="text"
              value={form.recipient}
              onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px' }}
            />
          </label>
          <label style={{ marginTop: '15px', display: 'block' }}>
            Поздравление:
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              style={{ display: 'block', width: '100%', padding: '10px', marginTop: '5px', minHeight: '100px' }}
            />
          </label>
        </div>
        <button
          onClick={handlePurchase}
          disabled={loading}
          style={{ marginTop: '20px', padding: '15px 30px', fontSize: '16px' }}
        >
          {loading ? 'Обработка...' : 'Оплатить'}
        </button>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h1>✅ Спасибо за покупку!</h1>
        <p>Сертификат отправлен на вашу почту</p>
        <button onClick={() => { setView('catalog'); setSelected(null); }} style={{ marginTop: '20px' }}>
          Вернуться в каталог
        </button>
      </div>
    );
  }

  if (view === 'vault') {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <button onClick={() => setView('catalog')}>← Назад</button>
        <h1>Мои покупки</h1>
        {vault.length === 0 ? (
          <p>У вас пока нет покупок</p>
        ) : (
          <div>
            {vault.map((order, i) => (
              <div key={i} style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                <p><strong>Заказ #{order.orderId}</strong></p>
                <p>Сертификат: {order.transactionId}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div>Загрузка...</div>;
};

export default App;
