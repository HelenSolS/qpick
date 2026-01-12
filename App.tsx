
import React, { useState, useEffect, useMemo } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK } from './constants';
import { CertificateType, City, OrderDetails } from './types';

// --- UI Components ---

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-slate-900 p-6 text-center animate-in fade-in">
    <div className="w-16 h-16 relative mb-6">
      <div className="absolute inset-0 border-4 border-[#8B3535]/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-[#8B3535] rounded-full animate-spin"></div>
    </div>
    <p className="text-lg font-bold tracking-tight text-[#8B3535] font-serif">{message}</p>
  </div>
);

const AdminNotification: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in">
    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
    <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#8B3535]"></div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#8B3535]/10 rounded-xl flex items-center justify-center text-xl">📲</div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Уведомление админа</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Это сообщение придет в чат</p>
        </div>
      </div>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
        <pre className="text-[11px] font-bold text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
          {message}
        </pre>
      </div>
      <button 
        onClick={onClose}
        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest active:scale-95 transition-all"
      >
        Понятно
      </button>
    </div>
  </div>
);

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex justify-between items-center mb-8 px-8 relative">
    <div className="absolute top-1/2 left-8 right-8 h-px bg-slate-100 -translate-y-1/2 z-0"></div>
    {[1, 2, 3].map((step) => (
      <div key={step} className="relative z-10 flex flex-col items-center gap-2">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-black transition-all shadow-sm ${
          currentStep >= step ? 'bg-[#8B3535] text-white ring-4 ring-white' : 'bg-slate-200 text-slate-400'
        }`}>
          {step}
        </div>
        <span className={`text-[7px] font-black uppercase tracking-[0.2em] ${currentStep >= step ? 'text-[#8B3535]' : 'text-slate-300'}`}>
          {step === 1 ? 'Кому' : step === 2 ? 'Текст' : 'Оплата'}
        </span>
      </div>
    ))}
  </div>
);

const App: React.FC = () => {
  const [isCitySelected, setIsCitySelected] = useState(false);
  const [city, setCity] = useState<City | null>(null);
  const [currentView, setCurrentView] = useState<'catalog' | 'details' | 'checkout' | 'success' | 'help'>('catalog');
  const [selectedCert, setSelectedCert] = useState<CertificateType | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAdminMsg, setShowAdminMsg] = useState(false);
  const [adminMsgContent, setAdminMsgContent] = useState('');
  
  const [order, setOrder] = useState<Partial<OrderDetails>>({
    deliveryMethod: 'telegram',
    greetingMessage: '',
  });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.headerColor = '#fcfcfc';
    }
  }, []);

  const handleSelectCity = (chosenCity: City) => {
    setCity(chosenCity);
    setIsCitySelected(true);
    setCurrentView('catalog');
  };

  const handleSelectCert = (cert: CertificateType) => {
    setSelectedCert(cert);
    setCurrentView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCheckout = () => {
    setCurrentView('checkout');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePayment = () => {
    setLoading(true);
    
    // Формируем сообщение для администраторов
    const msg = `🛒 НОВЫЙ ЗАКАЗ: ${selectedCert?.name}\n` +
                `📍 Город: ${city === 'MSK' ? 'Москва' : 'Петербург'}\n` +
                `👤 Отправитель: ${order.senderName}\n` +
                `🎁 Получатель: ${order.recipientName}\n` +
                `💰 Цена: ${selectedCert?.price} руб.\n` +
                `📬 Доставка: ${order.deliveryMethod === 'email' ? order.deliveryEmail : 'Telegram'}\n` +
                `✉️ Поздравление: ${order.greetingMessage || 'Без текста'}`;
    
    setAdminMsgContent(msg);

    setTimeout(() => {
      setLoading(false);
      setCurrentView('success');
      setShowAdminMsg(true);
    }, 1500);
  };

  const filteredCerts = useMemo(() => {
    return city === 'SPB' ? CERTIFICATES_SPB : CERTIFICATES_MSK;
  }, [city]);

  const isCheckoutInProgress = currentView === 'checkout' || currentView === 'details';

  // Initial City Selection Screen
  if (!isCitySelected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center px-8 py-16 max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="mb-10 text-center animate-in zoom-in-95 duration-700">
            <div className="inline-block p-4 bg-[#8B3535] rounded-3xl shadow-2xl mb-6 transform -rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight font-serif italic">Где дарим?</h1>
            <p className="text-slate-500 text-sm font-medium px-4 leading-relaxed">Выберите город для покупки <span className="text-[#8B3535] font-bold">сертификата</span>:</p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => handleSelectCity('MSK')}
              className="w-full group p-6 bg-slate-50 border-2 border-transparent active:border-[#8B3535] rounded-[2rem] transition-all flex items-center gap-5 shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">🏙️</div>
              <div className="text-left flex-1">
                <p className="font-black text-lg text-slate-800 leading-tight">Москва</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Столица</p>
              </div>
              <span className="text-[#8B3535] font-bold text-lg">→</span>
            </button>

            <button 
              onClick={() => handleSelectCity('SPB')}
              className="w-full group p-6 bg-slate-50 border-2 border-transparent active:border-[#8B3535] rounded-[2rem] transition-all flex items-center gap-5 shadow-sm active:scale-95"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-slate-100">🏛️</div>
              <div className="text-left flex-1">
                <p className="font-black text-lg text-slate-800 leading-tight">Санкт-Петербург</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Питер</p>
              </div>
              <span className="text-[#8B3535] font-bold text-lg">→</span>
            </button>
          </div>
        </div>
        <footer className="mt-auto pt-6 text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] text-center">
          QuickPic • Premium Gifts
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative bg-[#fcfcfc] overflow-x-hidden antialiased">
      {loading && <LoadingOverlay message="Минутку..." />}
      {showAdminMsg && <AdminNotification message={adminMsgContent} onClose={() => setShowAdminMsg(false)} />}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#8B3535] rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
             </svg>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-[#8B3535] leading-none uppercase">QuickPic</h1>
            <p className="text-[7px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Сертификаты</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">Регион:</span>
          <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 leading-none">
            {city === 'MSK' ? 'МОСКВА' : 'ПЕТЕРБУРГ'}
            <span className="w-1.5 h-1.5 bg-[#8B3535] rounded-full"></span>
          </span>
        </div>
      </header>

      <main className="px-6 pt-6">
        {currentView === 'catalog' && (
          <div className="animate-in fade-in duration-500">
            <section className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8B3535]">Подарочные карты</span>
                <span className="flex-1 h-px bg-[#8B3535]/10"></span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-serif leading-none tracking-tight">Выберите сертификат</h2>
            </section>

            <div className="grid grid-cols-1 gap-6">
              {filteredCerts.map((cert) => (
                <div 
                  key={cert.id} 
                  onClick={() => handleSelectCert(cert)}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm active:scale-[0.98] transition-all border border-slate-100 group hover:shadow-lg"
                >
                  <div className="h-40 relative overflow-hidden">
                    <img 
                      src={cert.image} 
                      alt={cert.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg text-[9px] font-black text-[#8B3535] shadow-md">
                      {cert.duration}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-xl font-black text-slate-800 font-serif">{cert.name}</h3>
                      <span className="text-lg font-black text-[#8B3535]">{cert.price} <small className="text-[9px] font-bold">₽</small></span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-4 line-clamp-2">{cert.description}</p>
                    <button className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.3em] group-hover:bg-[#8B3535] transition-all">
                      Выбрать подарок
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCert && (
          <div className="animate-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setCurrentView('catalog')}
              className="mb-6 text-slate-400 font-black text-[8px] uppercase tracking-[0.3em] flex items-center gap-2 active:text-[#8B3535]"
            >
              ← Назад к выбору
            </button>
            
            <div className="rounded-[2.5rem] overflow-hidden shadow-xl mb-6 aspect-[4/5] relative border-4 border-white">
              <img 
                src={selectedCert.image} 
                alt={selectedCert.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8 text-white">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-2">г. {city === 'MSK' ? 'Москва' : 'Петербург'}</p>
                <h2 className="text-3xl font-black mb-4 font-serif italic leading-none">«{selectedCert.name}»</h2>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black text-[#8B3535] bg-white px-4 py-1.5 rounded-xl">{selectedCert.price} ₽</span>
                  <span className="text-white/80 font-bold uppercase text-[10px] tracking-widest">{selectedCert.duration} прогулки</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 pb-10">
              <section className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-sm">
                <h4 className="font-black text-slate-900 uppercase tracking-[0.2em] text-[10px] mb-6 flex items-center gap-4">
                   Включено
                   <span className="flex-1 h-px bg-slate-50"></span>
                </h4>
                <div className="space-y-4">
                  {selectedCert.includes.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-1.5 h-1.5 bg-[#8B3535] rounded-full shadow-sm"></div>
                      <span className="text-[12px] font-bold text-slate-600 leading-tight">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button 
                onClick={handleStartCheckout}
                className="w-full bg-[#8B3535] text-white py-6 rounded-[2rem] font-black text-base shadow-[0_15px_40px_rgba(139,53,53,0.3)] active:scale-95 transition-all uppercase tracking-[0.15em]"
              >
                Оформить за {selectedCert.price} ₽
              </button>
            </div>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="animate-in fade-in duration-500">
            <header className="mb-8 text-center">
              <h2 className="text-2xl font-black text-slate-900 font-serif leading-tight italic">Оформление</h2>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-1">Сертификат на прогулку</p>
            </header>

            <StepIndicator currentStep={step} />

            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                <div className="bg-white p-6 rounded-[2rem] space-y-5 border border-slate-50 shadow-sm">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">От кого</label>
                    <input 
                      type="text" 
                      placeholder="Ваше имя" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-[#8B3535]/20 rounded-2xl transition-all outline-none font-bold text-slate-800 text-sm"
                      value={order.senderName || ''}
                      onChange={(e) => setOrder({...order, senderName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Кому дарим</label>
                    <input 
                      type="text" 
                      placeholder="Имя получателя" 
                      className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-[#8B3535]/20 rounded-2xl transition-all outline-none font-bold text-slate-800 text-sm"
                      value={order.recipientName || ''}
                      onChange={(e) => setOrder({...order, recipientName: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)}
                  disabled={!order.senderName || !order.recipientName}
                  className="w-full bg-[#8B3535] disabled:opacity-20 text-white py-5 rounded-[1.5rem] font-black text-sm shadow-lg uppercase tracking-widest"
                >
                  Далее
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8">
                <div className="bg-white p-6 rounded-[2rem] space-y-3 border border-slate-50 shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Текст на сертификате</label>
                  <textarea 
                    rows={5} 
                    placeholder="Напишите теплые слова..." 
                    className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-[#8B3535]/20 rounded-2xl transition-all outline-none resize-none font-bold text-slate-800 text-sm leading-relaxed"
                    value={order.greetingMessage || ''}
                    onChange={(e) => setOrder({...order, greetingMessage: e.target.value})}
                  />
                </div>
                <button 
                  onClick={() => setStep(3)}
                  className="w-full bg-[#8B3535] text-white py-5 rounded-[1.5rem] font-black text-sm shadow-lg uppercase tracking-widest"
                >
                  К оплате
                </button>
                <button onClick={() => setStep(1)} className="w-full text-slate-300 text-[8px] font-black uppercase tracking-widest">Назад</button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-8">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden border-4 border-slate-800">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-10">
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30">Gift Card</span>
                       <div className="w-6 h-6 bg-[#8B3535] rounded-lg rotate-6"></div>
                    </div>
                    <div className="mb-10">
                      <p className="text-[8px] font-black text-white/40 uppercase mb-2 tracking-widest">«{selectedCert?.name}»</p>
                      <h4 className="text-3xl font-black font-serif italic leading-none">{selectedCert?.price} ₽</h4>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                      <span className="text-xs font-bold text-white tracking-tight">{order.recipientName}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-white/30">г. {city}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setOrder({...order, deliveryMethod: 'telegram'})}
                      className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
                        order.deliveryMethod === 'telegram' ? 'border-[#8B3535] bg-[#8B3535]/5' : 'border-slate-50 bg-white'
                      }`}
                    >
                      <span className="text-2xl">📱</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">Telegram</span>
                    </button>
                    <button 
                      onClick={() => setOrder({...order, deliveryMethod: 'email'})}
                      className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col items-center gap-3 ${
                        order.deliveryMethod === 'email' ? 'border-[#8B3535] bg-[#8B3535]/5' : 'border-slate-50 bg-white'
                      }`}
                    >
                      <span className="text-2xl">📧</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">Email</span>
                    </button>
                  </div>
                  {order.deliveryMethod === 'email' && (
                    <input 
                      type="email" 
                      placeholder="vashapochta@mail.ru" 
                      className="w-full p-5 bg-white border-2 border-slate-50 rounded-2xl outline-none font-bold text-slate-800 text-sm animate-in slide-in-from-top-3 focus:border-[#8B3535]/20 transition-all"
                      onChange={(e) => setOrder({...order, deliveryEmail: e.target.value})}
                    />
                  )}
                </div>

                <button 
                  onClick={handlePayment}
                  className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black text-base shadow-2xl active:scale-95 transition-all uppercase tracking-widest"
                >
                  Оплатить и подарить
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'success' && (
          <div className="text-center py-16 animate-in zoom-in-95 duration-800">
            <div className="w-20 h-20 bg-[#8B3535]/5 text-[#8B3535] rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-3xl shadow-inner border border-[#8B3535]/10 rotate-3">
              ❤
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter font-serif italic">Сертификат Ваш!</h2>
            <p className="text-slate-500 mb-10 px-6 font-bold leading-relaxed text-xs">
              Оплата прошла успешно. <span className="text-[#8B3535]">{order.recipientName}</span> скоро получит свой подарок!
            </p>
            
            <button 
              onClick={() => {
                setCurrentView('catalog');
                setOrder({ deliveryMethod: 'telegram', greetingMessage: '' });
                setStep(1);
              }}
              className="w-full bg-slate-900 text-white py-6 rounded-[1.5rem] font-black shadow-2xl uppercase tracking-[0.2em] text-sm"
            >
              Купить еще один
            </button>
          </div>
        )}

        {currentView === 'help' && (
          <div className="animate-in fade-in duration-600 space-y-10 pb-10">
            <header className="text-center">
               <h2 className="text-2xl font-black text-slate-900 font-serif leading-tight italic">Помощь</h2>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Клиентский сервис</p>
            </header>

            <section className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
              <h3 className="font-black text-[9px] uppercase tracking-[0.3em] text-[#8B3535] mb-4">Регион покупки</h3>
              <p className="text-[10px] font-bold text-white/50 mb-8 leading-relaxed">
                Вы находитесь в разделе <span className="text-white">"{city === 'MSK' ? 'Москва' : 'Петербург'}"</span>.
              </p>
              
              {!isCheckoutInProgress ? (
                <button 
                  onClick={() => setIsCitySelected(false)}
                  className="w-full bg-[#8B3535] text-white py-4 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                >
                  Выбрать другой город
                </button>
              ) : (
                <div className="w-full bg-white/5 border border-white/10 text-white/30 py-4 rounded-xl font-black text-[9px] uppercase tracking-widest text-center">
                  Смена города недоступна при оформлении
                </div>
              )}
            </section>

            <div className="space-y-4">
               <button 
                 onClick={() => {
                   setAdminMsgContent("Начало чата с техподдержкой...");
                   setShowAdminMsg(true);
                 }}
                 className="w-full p-6 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm active:scale-95 transition-all"
               >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">💬</span>
                    <div className="text-left">
                       <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Чат с поддержкой</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">Ответим за 5 минут</p>
                    </div>
                  </div>
                  <span className="text-slate-300 font-black">→</span>
               </button>

               {[
                 {q: 'Как активировать подарок?', a: 'Получатель пишет в Telegram администратору QuickPic и выбирает дату прогулки.'},
                 {q: 'Срок действия?', a: 'Ровно 1 год. Успеете выбрать лучшую погоду!'}
               ].map((item, i) => (
                 <details key={i} className="group bg-white rounded-[2rem] p-6 border border-slate-50 shadow-sm transition-all">
                    <summary className="font-black text-[10px] text-slate-800 cursor-pointer list-none flex justify-between items-center uppercase tracking-tight">
                      {item.q}
                      <span className="text-[#8B3535] group-open:rotate-180 transition-all font-light text-lg">↓</span>
                    </summary>
                    <p className="mt-4 text-[10px] text-slate-400 leading-relaxed font-bold">
                      {item.a}
                    </p>
                 </details>
               ))}
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border-t px-16 py-6 flex justify-between items-center z-[60] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => { setCurrentView('catalog'); setStep(1); }}
          className={`flex flex-col items-center gap-1.5 transition-all ${currentView !== 'help' ? 'nav-active' : 'nav-inactive'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
          <span className="text-[8px] font-black uppercase tracking-tighter">Сертификаты</span>
        </button>
        
        <button 
          onClick={() => setCurrentView('help')}
          className={`flex flex-col items-center gap-1.5 transition-all ${currentView === 'help' ? 'nav-active' : 'nav-inactive'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span className="text-[8px] font-black uppercase tracking-tighter">Помощь</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
