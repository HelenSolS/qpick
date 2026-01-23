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

  const WEBHOOK_URL = `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_INIT_USER_PATH}`;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#ffffff');
      tg.enableClosingConfirmation();
    }
    identifyClient();
    loadVaultFromStorage();
  }, []);

  const loadVaultFromStorage = () => {
    const saved = localStorage.getItem('qpic_storage_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      const now = new Date();
      const active = parsed.filter((o: any) => new Date(o.expiry) > now);
      setVault(active);
      localStorage.setItem('qpic_storage_v1', JSON.stringify(active));
    }
  };

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

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'identify_client',
          data: payload,
        }),
      });

      if (!res.ok) return;

      const json = await res.json();
      if (json.client_id) {
        setClientId(json.client_id);
      }

      if (json.certificates && json.certificates.length > 0) {
        setVault(json.certificates);
      }
    } catch (e) {
      console.error('identifyClient error', e);
    }
  };

  const handlePurchase = async () => {
    if (!selected || !city || !clientId) return;

    setLoading(true);
    setView('payment');

    try {
      const tgUser = tg?.initDataUnsafe?.user;

      const orderData = {
        telegram_id: tgUser?.id,
        certificate_id: selected.id,
        sender_name: form.sender,
        recipient_name: form.recipient,
        greeting_message: form.message,
        design_id: selectedDesign?.id || 1,
      };

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_certificate',
          data: orderData,
        }),
      });

      if (res.ok) {
        const json = await res.json();

        const now = new Date();
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 6);

        const newOrder = {
          id: json.certificate?.code || 'QP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          orderId: json.certificate?.id,
          transactionId: json.certificate?.code,
          name: selected.name,
          price: selected.price,
          city: city,
          expiry: expiry.toISOString(),
          date: now.toLocaleDateString('ru-RU'),
          status: 'active'
        };

        const updatedVault = [newOrder, ...vault];
        setVault(updatedVault);
        localStorage.setItem('qpic_storage_v1', JSON.stringify(updatedVault));

        setTimeout(() => {
          setView('success');
          setLoading(false);
        }, 1500);
      }
    } catch (e) {
      console.error('handlePurchase error', e);
      setLoading(false);
    }
  };

  const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (tg && tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  const certificates = city === 'MSK' ? CERTIFICATES_MSK : CERTIFICATES_SPB;

  if (!city && view !== 'vault') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-10 text-center animate-fade">
        <div className="w-24 h-24 bg-black rounded-[2rem] mb-8 flex items-center justify-center shadow-xl">
          <span className="text-white text-5xl font-serif italic font-black">Q</span>
        </div>
        <h1 className="text-3xl font-black mb-2 uppercase">Q-PIC</h1>
        <p className="text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-12">Сертификаты</p>
        <div className="w-full space-y-4">
          <button 
            onClick={() => { setCity('MSK'); haptic(); }} 
            className="w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-all"
          >
            МОСКВА
          </button>
          <button 
            onClick={() => { setCity('SPB'); haptic(); }} 
            className="w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-all"
          >
            ПЕТЕРБУРГ
          </button>
          <button 
            onClick={() => setView('vault')} 
            className="pt-6 text-[11px] font-black text-gray-300 uppercase tracking-widest block mx-auto"
          >
            Мои покупки
          </button>
        </div>
      </div>
    );
  }

  const header = (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2" onClick={() => setView('catalog')}>
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-serif italic font-black">Q</div>
        <span className="font-black text-lg">Q-PIC</span>
      </div>
      {city && view !== 'vault' && (
        <button 
          onClick={() => setCity(null)} 
          className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-full"
        >
          {city} ✕
        </button>
      )}
    </header>
  );

  const nav = (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[180px] bg-black/95 rounded-full p-2 flex justify-between items-center z-50 shadow-2xl">
      <button 
        onClick={() => { setView('catalog'); haptic(); }} 
        className={`p-3 rounded-full transition-all ${view !== 'vault' ? 'bg-white text-black' : 'text-white/30'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </button>
      <button 
        onClick={() => { setView('vault'); haptic(); }} 
        className={`p-3 rounded-full transition-all ${view === 'vault' ? 'bg-white text-black' : 'text-white/30'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white pb-32">
      {header}

      <main className="px-6 py-8">
        {view === 'catalog' && (
          <div className="animate-fade">
            <h2 className="text-4xl font-serif italic font-black mb-6">Каталог</h2>
            <div className="grid gap-6">
              {certificates.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => { setSelected(c); setView('details'); haptic(); }} 
                  className="rounded-[2rem] overflow-hidden border shadow-sm cursor-pointer"
                >
                  <img src={c.image} className="h-48 w-full object-cover" alt={c.name} />
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-xl font-black">{c.name}</h3>
                      <span className="font-black">{c.price} ₽</span>
                    </div>
                    <p className="text-xs text-gray-400">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'details' && selected && (
          <div className="animate-fade">
            <img src={selected.image} className="w-full aspect-[3/4] object-cover rounded-[2.5rem] mb-6 shadow-xl" alt={selected.name} />
            <h2 className="text-4xl font-serif italic font-black mb-4">{selected.name}</h2>
            <div className="bg-gray-50 p-6 rounded-3xl mb-6">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">В стоимость входит</p>
              {selected.includes.map((inc, i) => (
                <p key={i} className="text-sm font-bold flex gap-2 mb-2">
                  <span>—</span>
                  <span>{inc}</span>
                </p>
              ))}
            </div>
            <button 
              onClick={() => setView('checkout')} 
              className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Оформить за {selected.price} ₽
            </button>
          </div>
        )}

        {view === 'checkout' && (
          <div className="animate-fade max-w-sm mx-auto">
            <h2 className="text-3xl font-serif italic font-black text-center mb-8">Оформление</h2>

            <div className="mb-8">
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Выберите дизайн</p>
              <div className="grid grid-cols-3 gap-3">
                {DESIGNS.map(d => (
                  <div 
                    key={d.id}
                    onClick={() => { setSelectedDesign(d); haptic(); }}
                    className={`rounded-xl overflow-hidden border-2 cursor-pointer ${selectedDesign?.id === d.id ? 'border-black' : 'border-gray-200'}`}
                  >
                    <img src={d.img} className="w-full aspect-square object-cover" alt={d.name} />
                    <p className="text-[8px] font-bold text-center py-1">{d.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <input 
                placeholder="От кого" 
                value={form.sender}
                onChange={(e) => setForm({...form, sender: e.target.value})}
                className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" 
              />
              <input 
                placeholder="Кому" 
                value={form.recipient}
                onChange={(e) => setForm({...form, recipient: e.target.value})}
                className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold" 
              />
              <textarea 
                placeholder="Пожелание" 
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold h-32" 
              />
            </div>

            <button 
              onClick={handlePurchase} 
              className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Купить сертификат
            </button>
          </div>
        )}

        {view === 'payment' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade">
            <div className="spinner mb-6"></div>
            <h2 className="text-xl font-black uppercase">Обработка платежа</h2>
            <p className="text-gray-400 text-sm mt-2">Ожидайте ответа банка...</p>
          </div>
        )}

        {view === 'success' && vault.length > 0 && (
          <div className="text-center py-10 animate-fade">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-4xl font-serif italic font-black mb-4">Успешно!</h2>
            <p className="text-gray-400 mb-10">Сертификат добавлен в архив</p>
            <div className="bg-black text-white p-8 rounded-[2rem] font-mono text-3xl tracking-widest mb-10">
              {vault[0].id}
            </div>
            <button 
              onClick={() => setView('vault')} 
              className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Мои покупки
            </button>
          </div>
        )}

        {view === 'vault' && (
          <div className="animate-fade">
            <h2 className="text-4xl font-serif italic font-black mb-8">Архив</h2>
            {vault.length === 0 ? (
              <p className="text-gray-300 italic text-center py-20">У вас пока нет покупок</p>
            ) : (
              <div className="space-y-6">
                {vault.map(o => (
                  <div 
                    key={o.id} 
                    className={`p-8 border rounded-[2.5rem] ${o.status === 'used' ? 'opacity-30' : 'bg-white shadow-sm'}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{o.date}</p>
                        <h3 className="text-2xl font-black">«{o.name}»</h3>
                      </div>
                      <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-black">{o.city}</span>
                    </div>
                    <div className="p-5 border-2 border-dashed rounded-2xl text-center mb-4">
                      <p className="font-mono font-black text-xl tracking-widest">{o.id}</p>
                    </div>
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">
                      Действителен до {new Date(o.expiry).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {['catalog', 'details', 'vault'].includes(view) && nav}
    </div>
  );
};

export default App;
