
import React, { useState, useEffect } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK } from './constants';
import { CertificateType, City, OrderDetails } from './types';

const App: React.FC = () => {
  const [city, setCity] = useState<City | null>(null);
  const [currentView, setCurrentView] = useState<'catalog' | 'details' | 'checkout' | 'payment' | 'success' | 'history'>('catalog');
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState<OrderDetails | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'sbp'>('card');
  const [myPurchases, setMyPurchases] = useState<OrderDetails[]>([]);
  
  const [orderForm, setOrderForm] = useState({
    senderName: '',
    recipientName: '',
    greetingMessage: '',
  });

  const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

  // Загружаем историю покупок (локально в телефоне клиента)
  useEffect(() => {
    const saved = localStorage.getItem('qpic_vault_v5');
    if (saved) {
      try {
        setMyPurchases(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor?.('#ffffff');
    }
  }, [tg]);

  const haptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
    tg?.HapticFeedback?.impactOccurred(style as any);
  };

  const resetApp = () => {
    haptic('medium');
    setCity(null);
    setCurrentView('catalog');
    setSelectedCert(null);
    setOrderForm({ senderName: '', recipientName: '', greetingMessage: '' });
    window.scrollTo(0, 0);
  };

  const startPayment = () => {
    haptic('heavy');
    setLoading(true);
    
    // Имитация процесса оплаты
    setTimeout(() => {
      // Генерируем 9 цифр для кода (например: 123456789)
      const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
      const fullCode = `QP-${city}-${randomDigits}`;
      const transactionId = `TX-${Math.random().toString(36).toUpperCase().slice(2, 9)}`;
      
      const newOrder: OrderDetails = {
        orderId: fullCode, 
        transactionId,
        purchaseDate: new Date().toLocaleString('ru-RU'),
        certificateId: selectedCert!.id,
        certName: selectedCert!.name,
        city: city!,
        price: selectedCert!.price,
        senderName: orderForm.senderName,
        recipientName: orderForm.recipientName,
        paymentMethod: paymentMethod === 'card' ? 'Банковская карта' : 'СБП',
        greetingMessage: orderForm.greetingMessage
      };

      setLastOrder(newOrder);
      
      // Сохраняем ПОЛНЫЙ код в телефоне клиента
      const updatedHistory = [newOrder, ...myPurchases];
      setMyPurchases(updatedHistory);
      localStorage.setItem('qpic_vault_v5', JSON.stringify(updatedHistory));
      
      setLoading(false);
      setCurrentView('success');
      window.scrollTo(0, 0);
    }, 2000);
  };

  const copyForAdmin = (order: OrderDetails) => {
    // Маскируем код для админа: показываем только 3 первых и 3 последних цифры
    // Было: QP-MSK-123456789 -> Станет: QP-MSK-123***789
    const codeParts = order.orderId.split('-');
    const digitsPart = codeParts[codeParts.length - 1];
    const maskedDigits = digitsPart.slice(0, 3) + '***' + digitsPart.slice(-3);
    const maskedCode = [...codeParts.slice(0, -1), maskedDigits].join('-');

    const text = `ПОДТВЕРЖДЕНИЕ ПОКУПКИ Q-PIC
----------------------------
ID ТРАНЗАКЦИИ: ${order.transactionId}
КОД (ЧАСТИЧНЫЙ): ${maskedCode}
ТАРИФ: ${order.certName}
ГОРОД: ${order.city}
КЛИЕНТ: ${order.senderName}
СУММА: ${order.price} ₽
ДАТА: ${order.purchaseDate}
----------------------------
Клиент сохранил полный код в приложении. Для активации он покажет экран "Мои чеки".`;
    
    navigator.clipboard.writeText(text);
    if (tg?.showAlert) tg.showAlert('Данные для админа скопированы! Отправьте этот текст в чат фотостудии.');
    else alert('Данные для админа скопированы!');
    haptic('medium');
  };

  const filteredCerts = city === 'SPB' ? CERTIFICATES_SPB : CERTIFICATES_MSK;

  if (!city && currentView !== 'history') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in">
        <div className="w-24 h-24 bg-black rounded-[2.5rem] mb-8 flex items-center justify-center shadow-2xl">
          <span className="text-white text-5xl font-serif italic font-black">Q</span>
        </div>
        <h1 className="text-4xl font-serif font-black italic mb-2 tracking-tighter">Q-PIC</h1>
        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.4em] mb-14 italic">Сертификаты</p>
        
        <div className="w-full space-y-4">
          <button onClick={() => { haptic(); setCity('MSK'); }} className="w-full py-6 bg-white border-2 border-slate-100 hover:border-black rounded-3xl font-black text-lg transition-all active:scale-95 shadow-sm">Москва</button>
          <button onClick={() => { haptic(); setCity('SPB'); }} className="w-full py-6 bg-white border-2 border-slate-100 hover:border-black rounded-3xl font-black text-lg transition-all active:scale-95 shadow-sm">Санкт-Петербург</button>
          <button onClick={() => { haptic(); setCurrentView('history'); }} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">Мои чеки и коды</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col relative min-h-screen">
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-10 text-center animate-in">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-black rounded-full animate-spin mb-8"></div>
          <h2 className="text-2xl font-serif italic font-black mb-3 text-black">Оформление...</h2>
          <p className="text-sm text-slate-400 font-medium">Создаем ваш цифровой сертификат</p>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b px-6 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => { if(currentView !== 'success') { haptic(); setCurrentView('catalog'); } }}>
          <div className="w-8 h-8 bg-black rounded-xl flex items-center justify-center text-white font-serif italic font-black text-sm">Q</div>
          <span className="font-black tracking-tighter text-xl">Q-PIC</span>
        </div>
        {city && currentView !== 'success' && (
          <button onClick={() => { haptic(); setCity(null); }} className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
            {city} ✕
          </button>
        )}
      </header>

      <main className="flex-1 px-6 pt-6 overflow-y-auto pb-40">
        
        {currentView === 'history' && (
          <div className="space-y-8 animate-in pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-serif italic font-black">Мои коды</h2>
              <button onClick={() => { haptic(); setCurrentView('catalog'); if(!city) setCity('MSK'); }} className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Закрыть</button>
            </div>
            
            <p className="text-[11px] text-slate-400 font-bold leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              Покажите этот экран администратору в студии. <br/><b>Важно:</b> Полный код знаете только вы.
            </p>

            {myPurchases.length === 0 ? (
              <div className="py-20 text-center opacity-30">
                <p className="font-black uppercase text-[10px] tracking-widest">История пуста</p>
              </div>
            ) : (
              <div className="space-y-6">
                {myPurchases.map((order) => (
                  <div key={order.transactionId} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase mb-1">{order.purchaseDate}</p>
                        <h3 className="text-lg font-black leading-tight">«{order.certName}»</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{order.city}</p>
                      </div>
                      <p className="text-xs font-black">{order.price} ₽</p>
                    </div>
                    
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-3">
                       <div className="space-y-1">
                          <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest italic">Секретный код для активации:</p>
                          <p className="text-xl font-black tracking-[0.15em] text-black font-mono">{order.orderId}</p>
                       </div>
                       <div className="pt-2 border-t border-slate-200/50 flex justify-between items-center text-[8px] font-black uppercase">
                          <span className="text-slate-400">ID: {order.transactionId}</span>
                          <span className="text-black bg-white px-2 py-0.5 rounded shadow-sm">Оплачено</span>
                       </div>
                    </div>

                    <button onClick={() => copyForAdmin(order)} className="w-full py-4 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                       Скопировать чек для админа
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentView === 'catalog' && (
          <div className="space-y-8 animate-in">
            <h2 className="text-3xl font-serif italic font-black text-slate-900 leading-none">Тарифы</h2>
            <div className="grid gap-6">
              {filteredCerts.map(cert => (
                <div key={cert.id} onClick={() => { haptic(); setSelectedCert(cert); setCurrentView('details'); }} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
                  <div className="h-48 relative">
                    <img src={cert.image} className="w-full h-full object-cover" alt={cert.name} />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl font-black text-base shadow-sm">{cert.price} ₽</div>
                  </div>
                  <div className="p-7">
                    <h3 className="text-2xl font-serif italic font-black mb-1">{cert.name}</h3>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">{cert.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{cert.duration}</span>
                      <span className="text-xs font-black text-black font-serif italic">Выбрать →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCert && (
          <div className="space-y-6 animate-in">
            <button onClick={() => setCurrentView('catalog')} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 py-2">
              ← Назад
            </button>
            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
              <h2 className="text-4xl font-serif italic font-black mb-8 leading-tight">«{selectedCert.name}»</h2>
              <div className="space-y-4 mb-10">
                <p className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em]">Что включено:</p>
                {selectedCert.includes.map((item, i) => (
                  <div key={i} className="flex gap-4 text-base font-semibold text-slate-600">
                    <span className="text-black text-xl leading-none">✦</span> {item}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { haptic(); setCurrentView('checkout'); }} className="w-full py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-xl active:scale-95 transition-all">
               Оформить сертификат
            </button>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="space-y-8 animate-in">
            <h2 className="text-3xl font-serif italic font-black">Данные</h2>
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="space-y-3">
                    <label className="ml-3 text-[10px] uppercase font-black text-slate-300 tracking-widest">Имя покупателя</label>
                    <input className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-base" placeholder="Кто дарит?" value={orderForm.senderName} onChange={e => setOrderForm({...orderForm, senderName: e.target.value})} />
                </div>
                <div className="space-y-3">
                    <label className="ml-3 text-[10px] uppercase font-black text-slate-300 tracking-widest">Имя получателя</label>
                    <input className="w-full p-6 bg-slate-50 rounded-2xl outline-none font-bold text-base" placeholder="Кому подарок?" value={orderForm.recipientName} onChange={e => setOrderForm({...orderForm, recipientName: e.target.value})} />
                </div>
                <button 
                    disabled={!orderForm.senderName || !orderForm.recipientName}
                    onClick={() => { haptic('medium'); setCurrentView('payment'); }}
                    className="w-full py-7 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest disabled:opacity-20 shadow-lg active:scale-95 transition-all mt-4"
                >
                    Перейти к оплате
                </button>
            </div>
          </div>
        )}

        {currentView === 'payment' && (
          <div className="space-y-8 animate-in">
             <h2 className="text-3xl font-serif italic font-black">Оплата</h2>
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8 text-center">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">К оплате</p>
                   <p className="text-5xl font-black tracking-tighter">{selectedCert?.price} ₽</p>
                </div>
                
                <div className="space-y-4 text-left">
                   <button onClick={() => { haptic(); setPaymentMethod('card'); }} className={`w-full p-6 rounded-2xl flex items-center justify-between border-2 transition-all ${paymentMethod === 'card' ? 'border-black bg-black text-white' : 'border-slate-50 bg-slate-50'}`}>
                      <span className="font-black text-[10px] uppercase tracking-widest">Карта</span>
                      <span className="text-xl">💳</span>
                   </button>
                   <button onClick={() => { haptic(); setPaymentMethod('sbp'); }} className={`w-full p-6 rounded-2xl flex items-center justify-between border-2 transition-all ${paymentMethod === 'sbp' ? 'border-black bg-black text-white' : 'border-slate-50 bg-slate-50'}`}>
                      <span className="font-black text-[10px] uppercase tracking-widest">СБП</span>
                      <span className="text-xl">📲</span>
                   </button>
                </div>
             </div>
             <button onClick={startPayment} className="w-full py-7 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] active:scale-95 transition-all">
               Оплатить {selectedCert?.price} ₽
             </button>
          </div>
        )}

        {currentView === 'success' && lastOrder && (
          <div className="animate-in py-4 space-y-8 pb-20">
            <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
                <div className="success-bg p-12 text-center text-white space-y-6">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <span className="text-3xl font-serif italic font-black">Q</span>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-3 italic">Готово!</p>
                        <h3 className="text-2xl font-serif italic font-black">«{lastOrder.certName}»</h3>
                    </div>
                    
                    <div onClick={() => { navigator.clipboard.writeText(lastOrder.orderId); haptic(); }} className="bg-white/5 border border-dashed border-white/20 p-5 rounded-xl cursor-pointer active:scale-95 transition-all group">
                        <p className="text-2xl font-black tracking-[0.2em] font-mono">{lastOrder.orderId}</p>
                        <p className="text-[7px] font-black uppercase tracking-widest mt-2 opacity-50 underline decoration-white/20">НАЖМИТЕ, ЧТОБЫ СКОПИРОВАТЬ</p>
                    </div>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-100">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center mb-4">Данные транзакции</p>
                        <div className="space-y-2">
                           <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">ID:</span>
                              <span className="font-mono text-black">{lastOrder.transactionId}</span>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-400 uppercase">Дата:</span>
                              <span className="text-black">{lastOrder.purchaseDate}</span>
                           </div>
                        </div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold text-center leading-relaxed italic">
                        Код сохранен в разделе «Мои коды». <br/>Предъявите его в студии при визите.
                    </p>
                </div>
            </div>

            <div className="grid gap-3">
                <button onClick={() => copyForAdmin(lastOrder)} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3">
                  Скопировать чек для Админа
                </button>
                <button onClick={resetApp} className="w-full py-6 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">В начало</button>
            </div>
          </div>
        )}
      </main>

      {/* Footer Nav */}
      {['catalog', 'details', 'history'].includes(currentView) && (
         <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px] bg-white/80 backdrop-blur-xl border-t p-7 flex justify-around items-center z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <button 
                onClick={() => { haptic(); setCurrentView('catalog'); }} 
                className={`transition-all p-2 rounded-xl ${currentView === 'catalog' || currentView === 'details' ? 'text-black bg-slate-50 shadow-inner' : 'text-slate-200'}`}
            >
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </button>
            <div className="w-px h-6 bg-slate-100"></div>
            <button 
                onClick={() => { haptic(); setCurrentView('history'); }} 
                className={`transition-all p-2 rounded-xl ${currentView === 'history' ? 'text-black bg-slate-50 shadow-inner' : 'text-slate-200'}`}
            >
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </button>
         </nav>
      )}
    </div>
  );
};

export default App;
