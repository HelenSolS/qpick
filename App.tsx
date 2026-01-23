
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
      'https://n8n.neyronikol.ru/webhook/80385ffa-6c51-49ba-8e66-a17cf24189b5',
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
    // 1. Загрузка данных и жесткая фильтрация просроченных (6 месяцев)
    const saved = localStorage.getItem('qpic_vault_v4');
    if (saved) {
      try {
        const parsedVault: OrderDetails[] = JSON.parse(saved);
        const now = new Date();
        // Оставляем только те, срок которых еще не наступил
        const validVault = parsedVault.filter(order => {
            const expiry = new Date(order.expiryDate);
            return expiry > now;
        });
        setVault(validVault);
        // Синхронизируем хранилище
        localStorage.setItem('qpic_vault_v4', JSON.stringify(validVault));
      } catch (e) {
        console.error("Vault processing error", e);
      }
    }
    
    // 2. Скрытие лоадера. Если React дошел до этой точки - приложение работает.
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 400);
    }
    
    // 3. Идентификация клиента через n8n
  identifyClient();
  }, []);

  const haptic = (s: 'light' | 'medium' | 'heavy' = 'light') => {
    try { tg?.HapticFeedback?.impactOccurred(s); } catch(e) {}
  };

  const saveVault = (newVault: OrderDetails[]) => {
    setVault(newVault);
    localStorage.setItem('qpic_vault_v4', JSON.stringify(newVault));
  };

  const copyCode = (order: OrderDetails) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(order.orderId);
    }
    haptic('light');
    tg?.showAlert(`Код ${order.orderId} скопирован в буфер обмена.`);
  };

  const toggleStatus = (id: string) => {
    haptic('medium');
    const newVault = vault.map(o => 
      o.orderId === id ? { ...o, status: o.status === 'active' ? 'used' : 'active' as any } : o
    );
    saveVault(newVault);
  };

  const completePurchase = () => {
    if (!selected || !city) return;
    if (!clientId) {
      tg?.showAlert('Подождите пару секунд, загружаем ваш профиль...');
      return;
    }
    if (!selected || !city) return;
    setLoading(true);
    haptic('heavy');
    
    // Симуляция продажи (в реальном приложении здесь был бы переход на платежный шлюз)
    setTimeout(() => {
      const now = new Date();
      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + 6); // Ровно 6 месяцев

      const order: OrderDetails = {
        orderId: `QP-${city}-${Math.floor(Math.random() * 900000 + 100000)}`,
        transactionId: `TX-${Math.random().toString(36).toUpperCase().slice(2, 9)}`,
        purchaseDate: now.toLocaleDateString('ru-RU'),
        expiryDate: expiry.toISOString(),
        certificateId: selected.id,
        certName: selected.name,
        city: city,
        price: selected.price,
        senderName: form.sender,
        recipientName: form.recipient,
        paymentMethod: 'Оплачено картой',
        greetingMessage: form.message,
        status: 'active'
      };
      
      const newVault = [order, ...vault];
      saveVault(newVault);
      setLoading(false);
      setView('success');
    }, 1500);
  };

  if (!city && view !== 'vault') {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-10 text-center bg-white animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-black rounded-[2.2rem] mb-8 flex items-center justify-center shadow-2xl">
          <span className="text-white text-5xl font-serif italic font-black">Q</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3 uppercase">Q-PIC</h1>
        <p className="text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-14">Магазин сертификатов</p>
        <div className="w-full space-y-4">
          <button onClick={() => { haptic(); setCity('MSK'); }} className="w-full py-5 border-[1.5px] border-black rounded-2xl font-bold text-lg active:scale-95 transition-all">МОСКВА</button>
          <button onClick={() => { haptic(); setCity('SPB'); }} className="w-full py-5 border-[1.5px] border-black rounded-2xl font-bold text-lg active:scale-95 transition-all">САНКТ-ПЕТЕРБУРГ</button>
          <button onClick={() => setView('vault')} className="pt-8 text-[11px] font-black text-gray-300 uppercase tracking-widest block mx-auto hover:text-black transition-colors">Мои покупки</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3" onClick={() => { haptic(); setView('catalog'); }}>
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-serif italic font-black text-lg">Q</div>
          <span className="font-black tracking-tighter text-xl uppercase leading-none">Q-PIC</span>
        </div>
        {city && view !== 'vault' && (
          <button onClick={() => { haptic(); setCity(null); }} className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">{city} ✕</button>
        )}
      </header>

      <main className="flex-1 px-6 py-8 pb-32">
        {view === 'catalog' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
              <h2 className="text-4xl font-serif italic font-black leading-none tracking-tight">Сертификаты</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">Выберите формат подарка в г. {city === 'MSK' ? 'Москва' : 'Санкт-Петербург'}</p>
            </div>
            <div className="grid gap-6">
              {(city === 'MSK' ? CERTIFICATES_MSK : CERTIFICATES_SPB).map(c => (
                <div key={c.id} onClick={() => { haptic(); setSelected(c); setView('details'); }} className="group border border-gray-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all active:scale-[0.98]">
                   <div className="h-48 bg-gray-100 relative overflow-hidden">
                      <img src={c.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={c.name} />
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl font-black text-xs shadow-lg">{c.price} ₽</div>
                   </div>
                   <div className="p-7">
                      <h3 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{c.name}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed">{c.description}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'details' && selected && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl relative">
              <img src={selected.image} className="w-full h-full object-cover" alt={selected.name} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <button onClick={() => setView('catalog')} className="absolute top-6 left-6 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white">✕</button>
            </div>
            <div className="space-y-6">
              <h2 className="text-5xl font-serif italic font-black leading-none tracking-tighter">{selected.name}</h2>
              <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-5 border border-gray-100">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">Что входит в стоимость</p>
                {selected.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm font-bold leading-snug">
                    <span className="text-black text-lg leading-none shrink-0">―</span><span className="flex-1 opacity-80">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-black text-white p-6 rounded-3xl flex justify-between items-center">
                <div>
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Срок действия</p>
                   <p className="text-sm font-black uppercase">6 месяцев</p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-1">Стоимость</p>
                   <p className="text-xl font-black">{selected.price} ₽</p>
                </div>
              </div>
              <button onClick={() => { haptic('medium'); setView('checkout'); }} className="w-full py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Купить сейчас</button>
            </div>
          </div>
        )}

        {view === 'checkout' && selected && (
          <div className="space-y-10 animate-in fade-in duration-500 max-w-sm mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif italic font-black">Персонализация</h2>
              <p className="text-gray-400 text-sm">Укажите данные для сертификата</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Отправитель</label>
                <input value={form.sender} onChange={e => setForm({...form, sender: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[1.8rem] outline-none font-bold border border-transparent focus:border-black/5" placeholder="Ваше имя" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Получатель</label>
                <input value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[1.8rem] outline-none font-bold border border-transparent focus:border-black/5" placeholder="Имя счастливчика" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Пожелание</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-6 bg-gray-50 rounded-[1.8rem] outline-none h-32 resize-none font-bold text-sm border border-transparent focus:border-black/5" placeholder="Напишите пару добрых слов..." />
              </div>
            </div>
            <div className="pt-4">
               <button disabled={!form.sender || !form.recipient || loading} onClick={completePurchase} className="w-full py-7 bg-black text-white rounded-[2.2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-20 active:scale-95 transition-all">
                {loading ? 'ПОДОЖДИТЕ...' : `ОПЛАТИТЬ ${selected.price} ₽`}
               </button>
               <p className="text-[9px] text-gray-300 text-center mt-6 font-bold uppercase tracking-widest px-8">Нажимая кнопку, вы соглашаетесь с правилами использования сервиса Q-PIC</p>
            </div>
          </div>
        )}

        {view === 'success' && (
          <div className="flex flex-col items-center py-12 text-center space-y-12 animate-in zoom-in duration-500">
            <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center text-white shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-5xl font-serif italic font-black leading-none tracking-tight">Поздравляем!</h2>
              <p className="text-gray-400 font-bold px-10 text-sm leading-relaxed">Покупка успешно завершена. Сертификат активен и готов к использованию.</p>
            </div>
            <div className="w-full p-12 bg-gray-50 rounded-[3.5rem] border-2 border-dashed border-black/10 shadow-inner">
                <p className="text-4xl font-black tracking-[0.3em] font-mono mb-3 leading-none">{vault[0].orderId}</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">Код активации</p>
            </div>
            <div className="w-full space-y-4 pt-4">
              <button onClick={() => { haptic(); setView('vault'); }} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] active:scale-95 transition-all shadow-xl">Мои покупки</button>
              <button onClick={() => { haptic(); setCity(null); setView('catalog'); }} className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-black transition-colors">На главную</button>
            </div>
          </div>
        )}

        {view === 'vault' && (
          <div className="space-y-10 animate-in fade-in duration-500 pb-20">
             <div className="flex justify-between items-end border-b border-gray-100 pb-6">
                <h2 className="text-4xl font-serif italic font-black leading-none">Коллекция</h2>
                <button onClick={() => { haptic(); if(!city) setCity('MSK'); setView('catalog'); }} className="text-[10px] font-black text-gray-300 uppercase tracking-widest active:text-black">Назад</button>
             </div>
             {vault.length === 0 ? (
               <div className="py-40 text-center space-y-4 opacity-20">
                 <p className="italic text-5xl font-serif font-black">Q</p>
                 <p className="text-xs text-gray-400 uppercase font-black tracking-[0.3em]">Здесь пока пусто</p>
               </div>
             ) : (
               <div className="space-y-8">
                  {vault.map(o => (
                    <div key={o.orderId} className={`border rounded-[3rem] p-8 space-y-7 shadow-sm transition-all relative overflow-hidden ${o.status === 'used' ? 'opacity-40 grayscale border-gray-100 bg-gray-50' : 'bg-white border-gray-100 hover:shadow-xl'}`}>
                       <div className="flex justify-between items-start relative z-10">
                          <div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest block mb-1">ID: {o.transactionId}</span>
                            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none mb-1">«{o.certName}»</h3>
                            <div className="flex items-center gap-2 mt-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">До: {new Date(o.expiryDate).toLocaleDateString('ru-RU')}</span>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${o.status === 'used' ? 'bg-gray-200 text-gray-500' : 'bg-black text-white'}`}>
                            {o.status === 'used' ? 'ПОГАШЕНО' : o.city}
                          </span>
                       </div>
                       <div className={`p-7 rounded-[2rem] text-center border-2 border-dashed transition-colors ${o.status === 'used' ? 'border-gray-300' : 'border-black/5 bg-gray-50 shadow-inner'}`}>
                          <p className="font-mono font-black text-3xl tracking-widest">{o.orderId}</p>
                       </div>
                       <div className="flex gap-3">
                        <button onClick={() => copyCode(o)} className="flex-1 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform shadow-lg">Скопировать</button>
                        <button onClick={() => toggleStatus(o.orderId)} className={`px-6 py-5 rounded-2xl text-[10px] font-black uppercase border transition-all ${o.status === 'used' ? 'bg-white border-gray-200 text-gray-400' : 'border-black hover:bg-black hover:text-white'}`}>
                          {o.status === 'used' ? 'АКТИВИРОВАТЬ' : 'ПОГАСИТЬ'}
                        </button>
                       </div>
                    </div>
                  ))}
                  <div className="bg-gray-50 rounded-3xl p-6 text-center">
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] leading-relaxed">Внимание: сертификат действителен 6 месяцев. <br/> Просроченные карты удаляются из архива автоматически.</p>
                  </div>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Компактная навигация в стиле Dynamic Island */}
      {['catalog', 'details', 'vault'].includes(view) && (
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[180px] bg-black/90 backdrop-blur-3xl rounded-[2.5rem] px-2 py-2 flex justify-between items-center z-50 shadow-[0_15px_40px_rgba(0,0,0,0.3)] border border-white/10">
          <button onClick={() => { haptic(); setView('catalog'); if(!city) setCity('MSK'); }} className={`flex-1 p-3 rounded-full flex items-center justify-center transition-all ${view !== 'vault' ? 'bg-white text-black scale-105' : 'text-white/30 hover:text-white/60'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </button>
          <button onClick={() => { haptic(); setView('vault'); }} className={`flex-1 p-3 rounded-full flex items-center justify-center transition-all ${view === 'vault' ? 'bg-white text-black scale-105' : 'text-white/30 hover:text-white/60'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
