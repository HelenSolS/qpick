
import React, { useState, useEffect } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK } from './constants.ts';
import { CertificateType, City, OrderDetails } from './types.ts';

const App: React.FC = () => {
  const [city, setCity] = useState<City | null>(null);
  const [view, setView] = useState<'catalog' | 'details' | 'checkout' | 'success' | 'vault'>('catalog');
  const [selected, setSelected] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(false);
  const [vault, setVault] = useState<OrderDetails[]>([]);
  
  const [form, setForm] = useState({
    sender: '',
    recipient: '',
    message: ''
  });

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    // Загрузка локальных заказов
    const saved = localStorage.getItem('qpic_orders_v10');
    if (saved) setVault(JSON.parse(saved));
    
    // ГАРАНТИРОВАННОЕ скрытие лоадера только после полной отрисовки
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 400);
    }
  }, []);

  const haptic = (s: 'light' | 'medium' | 'heavy' = 'light') => tg?.HapticFeedback?.impactOccurred(s);

  const copyCode = (order: OrderDetails) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(order.orderId);
    }
    haptic('light');
    tg?.showAlert(`Код ${order.orderId} скопирован.`);
  };

  const completePurchase = () => {
    setLoading(true);
    haptic('heavy');
    setTimeout(() => {
      const order: OrderDetails = {
        orderId: `QP-${city}-${Math.floor(Math.random() * 900000 + 100000)}`,
        transactionId: `TX-${Math.random().toString(36).toUpperCase().slice(2, 9)}`,
        purchaseDate: new Date().toLocaleDateString('ru-RU'),
        certificateId: selected!.id,
        certName: selected!.name,
        city: city!,
        price: selected!.price,
        senderName: form.sender,
        recipientName: form.recipient,
        paymentMethod: 'Банковская карта',
        greetingMessage: form.message
      };
      const newVault = [order, ...vault];
      setVault(newVault);
      localStorage.setItem('qpic_orders_v10', JSON.stringify(newVault));
      setLoading(false);
      setView('success');
    }, 1500);
  };

  if (!city && view !== 'vault') {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-10 text-center bg-white">
        <div className="w-24 h-24 bg-black rounded-[2.2rem] mb-8 flex items-center justify-center shadow-2xl">
          <span className="text-white text-5xl font-serif italic font-black">Q</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3 uppercase">Q-PIC</h1>
        <p className="text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-14">Подарочные сертификаты</p>
        
        <div className="w-full space-y-4">
          <button onClick={() => { haptic(); setCity('MSK'); }} className="w-full py-5 border-[1.5px] border-black rounded-2xl font-bold text-lg hover:bg-black hover:text-white transition-all">МОСКВА</button>
          <button onClick={() => { haptic(); setCity('SPB'); }} className="w-full py-5 border-[1.5px] border-black rounded-2xl font-bold text-lg hover:bg-black hover:text-white transition-all">САНКТ-ПЕТЕРБУРГ</button>
          <button onClick={() => setView('vault')} className="pt-8 text-[11px] font-black text-gray-300 uppercase tracking-widest block mx-auto">Мои карты</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-3" onClick={() => { haptic(); setView('catalog'); }}>
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white font-serif italic font-black text-lg">Q</div>
          <span className="font-black tracking-tighter text-xl uppercase leading-none">Q-PIC</span>
        </div>
        {city && view !== 'vault' && (
          <button onClick={() => { haptic(); setCity(null); }} className="px-3 py-1 bg-gray-50 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {city} ✕
          </button>
        )}
      </header>

      <main className="flex-1 px-6 py-8 pb-32">
        {view === 'catalog' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-serif italic font-black tracking-tight mb-2 leading-none">Выбор</h2>
              <p className="text-gray-400 text-sm font-medium">Фотосессия в подарок</p>
            </div>
            
            <div className="space-y-6">
              {(city === 'MSK' ? CERTIFICATES_MSK : CERTIFICATES_SPB).map(c => (
                <div key={c.id} onClick={() => { haptic(); setSelected(c); setView('details'); }} className="border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm bg-white">
                   <div className="h-44 bg-gray-50 relative">
                      <img src={c.image} className="w-full h-full object-cover" alt={c.name} />
                      <div className="absolute top-4 right-4 bg-black text-white px-4 py-2 rounded-full font-black text-sm">
                        {c.price} ₽
                      </div>
                   </div>
                   <div className="p-6">
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{c.name}</h3>
                      <p className="text-gray-400 text-xs">{c.description}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'details' && selected && (
          <div className="space-y-8">
            <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl">
              <img src={selected.image} className="w-full h-full object-cover" alt={selected.name} />
            </div>
            <div className="space-y-6">
              <h2 className="text-5xl font-serif italic font-black tracking-tight">{selected.name}</h2>
              <div className="bg-gray-50 p-8 rounded-[2rem] space-y-4">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Что включено</p>
                {selected.includes.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 text-sm font-semibold">
                    <span className="text-black text-lg leading-none">―</span> 
                    <span className="flex-1">{item}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => { haptic('medium'); setView('checkout'); }} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em]">Оформить карту за {selected.price} ₽</button>
            </div>
          </div>
        )}

        {view === 'checkout' && selected && (
          <div className="space-y-10">
            <div className="text-center">
              <h2 className="text-3xl font-serif italic font-black mb-2 leading-none">Детали</h2>
              <p className="text-gray-400 text-sm">Персонализация подарка</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-5">От кого</label>
                <input value={form.sender} onChange={e => setForm({...form, sender: e.target.value})} className="w-full p-6 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-black/10 transition-all font-medium" placeholder="Ваше имя" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-5">Кому</label>
                <input value={form.recipient} onChange={e => setForm({...form, recipient: e.target.value})} className="w-full p-6 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-black/10 transition-all font-medium" placeholder="Имя получателя" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-5">Пожелание</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="w-full p-6 bg-gray-50 rounded-2xl outline-none border border-transparent focus:border-black/10 transition-all h-32 resize-none font-medium text-sm" placeholder="Напишите теплые слова вручную..." />
              </div>
            </div>
            <button disabled={!form.sender || !form.recipient || loading} onClick={completePurchase} className="w-full py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl disabled:opacity-20 transition-opacity">
              {loading ? 'ПРОВЕРКА...' : `ОПЛАТИТЬ ${selected.price} ₽`}
            </button>
          </div>
        )}

        {view === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-10">
            <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white shadow-2xl">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-serif italic font-black">Готово!</h2>
              <p className="text-gray-400 font-medium px-8">Электронная карта создана и сохранена в вашем кабинете.</p>
            </div>
            <div className="w-full p-10 bg-gray-50 rounded-[3rem] border-2 border-dashed border-black/10">
                <p className="text-4xl font-black tracking-[0.2em] font-mono mb-2 leading-none">{vault[0].orderId}</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Код сертификата</p>
            </div>
            <div className="w-full space-y-4">
              <button onClick={() => { haptic(); setView('vault'); }} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em]">Мои сертификаты</button>
              <button onClick={() => { haptic(); setCity(null); setView('catalog'); }} className="text-xs font-black text-gray-300 uppercase tracking-widest">На главную</button>
            </div>
          </div>
        )}

        {view === 'vault' && (
          <div className="space-y-10">
             <div className="flex justify-between items-end">
                <h2 className="text-4xl font-serif italic font-black leading-none">Карты</h2>
                <button onClick={() => { haptic(); if(!city) setCity('MSK'); setView('catalog'); }} className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Закрыть</button>
             </div>
             {vault.length === 0 ? (
               <div className="py-32 text-center italic text-gray-200 text-3xl font-serif">Пусто</div>
             ) : (
               <div className="space-y-8">
                  {vault.map(o => (
                    <div key={o.orderId} className="border border-gray-100 rounded-[2.5rem] p-8 space-y-6 shadow-sm bg-white relative">
                       <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{o.purchaseDate}</span>
                            <h3 className="font-black text-xl uppercase tracking-tighter">«{o.certName}»</h3>
                          </div>
                          <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full">{o.city}</span>
                       </div>
                       <div className="bg-gray-50 p-6 rounded-2xl text-center border-2 border-dashed border-gray-100">
                          <p className="font-mono font-black text-2xl tracking-[0.2em]">{o.orderId}</p>
                       </div>
                       <button onClick={() => copyCode(o)} className="w-full py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform active:scale-95">Копировать код</button>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}
      </main>

      {['catalog', 'details', 'vault'].includes(view) && (
        <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[220px] bg-black/90 backdrop-blur-2xl rounded-full px-4 py-3 flex justify-around items-center z-50 shadow-2xl border border-white/10">
          <button onClick={() => { haptic(); setView('catalog'); if(!city) setCity('MSK'); }} className={`p-3 rounded-full transition-all ${view === 'catalog' || view === 'details' ? 'bg-white text-black' : 'text-white/40'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button onClick={() => { haptic(); setView('vault'); }} className={`p-3 rounded-full transition-all ${view === 'vault' ? 'bg-white text-black' : 'text-white/40'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
