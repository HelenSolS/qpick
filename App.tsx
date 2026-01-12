
import React, { useState, useEffect, useMemo } from 'react';
import { CERTIFICATES_SPB, CERTIFICATES_MSK } from './constants';
import { CertificateType, City, OrderDetails } from './types';

// Removed redundant local Window declaration to avoid conflict with types.ts definition.

const LoadingOverlay: React.FC<{ message: string }> = ({ message }) => (
  <div className="fixed inset-0 bg-white/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-slate-900 p-6 text-center animate-in fade-in">
    <div className="w-16 h-16 relative mb-6">
      <div className="absolute inset-0 border-4 border-[#8B3535]/10 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-[#8B3535] rounded-full animate-spin"></div>
    </div>
    <p className="text-lg font-bold tracking-tight text-[#8B3535] font-serif">{message}</p>
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
  
  const [order, setOrder] = useState<Partial<OrderDetails>>({
    deliveryMethod: 'telegram',
    greetingMessage: '',
  });

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();
    }
  }, [tg]);

  // Управление кнопкой Telegram MainButton
  useEffect(() => {
    if (!tg) return;

    const mainBtn = tg.MainButton;

    if (currentView === 'details') {
      mainBtn.setText(`ОФОРМИТЬ ЗА ${selectedCert?.price} ₽`);
      mainBtn.show();
      mainBtn.onClick(handleStartCheckout);
    } else if (currentView === 'checkout') {
      if (step === 1) {
        if (order.senderName && order.recipientName) {
          mainBtn.setText('ДАЛЕЕ');
          mainBtn.show();
        } else {
          mainBtn.hide();
        }
        mainBtn.onClick(() => setStep(2));
      } else if (step === 2) {
        mainBtn.setText('ПЕРЕЙТИ К ОПЛАТЕ');
        mainBtn.show();
        mainBtn.onClick(() => setStep(3));
      } else if (step === 3) {
        mainBtn.setText(`ОПЛАТИТЬ ${selectedCert?.price} ₽`);
        mainBtn.show();
        mainBtn.onClick(handlePayment);
      }
    } else {
      mainBtn.hide();
    }

    return () => {
      mainBtn.offClick();
    };
  }, [currentView, step, order, selectedCert, tg]);

  const haptic = () => tg?.HapticFeedback?.impactOccurred('light');

  const handleSelectCity = (chosenCity: City) => {
    haptic();
    setCity(chosenCity);
    setIsCitySelected(true);
  };

  const handleSelectCert = (cert: CertificateType) => {
    haptic();
    setSelectedCert(cert);
    setCurrentView('details');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCheckout = () => {
    haptic();
    setCurrentView('checkout');
    setStep(1);
  };

  const handlePayment = () => {
    haptic();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCurrentView('success');
      // Added optional chaining for safety when using the TG API in async callbacks
      tg?.MainButton.hide();
    }, 1500);
  };

  const filteredCerts = useMemo(() => {
    return city === 'SPB' ? CERTIFICATES_SPB : CERTIFICATES_MSK;
  }, [city]);

  if (!isCitySelected) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center px-8 py-16 max-w-md mx-auto">
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="mb-10 text-center">
            <div className="inline-block p-4 bg-[#8B3535] rounded-3xl shadow-2xl mb-6 transform -rotate-3">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight font-serif italic">Где дарим?</h1>
            <p className="text-slate-500 text-sm font-medium px-4 leading-relaxed">Выберите город:</p>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={() => handleSelectCity('MSK')}
              className="w-full p-6 bg-slate-50 border-2 border-transparent active:border-[#8B3535] rounded-[2rem] transition-all flex items-center gap-5 shadow-sm"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl">🏙️</div>
              <div className="text-left flex-1">
                <p className="font-black text-lg text-slate-800 leading-tight">Москва</p>
              </div>
              <span className="text-[#8B3535] font-bold text-lg">→</span>
            </button>

            <button 
              onClick={() => handleSelectCity('SPB')}
              className="w-full p-6 bg-slate-50 border-2 border-transparent active:border-[#8B3535] rounded-[2rem] transition-all flex items-center gap-5 shadow-sm"
            >
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl">🏛️</div>
              <div className="text-left flex-1">
                <p className="font-black text-lg text-slate-800 leading-tight">Санкт-Петербург</p>
              </div>
              <span className="text-[#8B3535] font-bold text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 max-w-md mx-auto relative bg-[#fcfcfc] antialiased">
      {loading && <LoadingOverlay message="Связываемся с банком..." />}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3" onClick={() => { haptic(); setCurrentView('catalog'); }}>
          <div className="w-9 h-9 bg-[#8B3535] rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
             </svg>
          </div>
          <h1 className="text-base font-black tracking-tighter text-[#8B3535] leading-none uppercase">QuickPic</h1>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-black text-slate-800">{city === 'MSK' ? 'МОСКВА' : 'ПЕТЕРБУРГ'}</span>
        </div>
      </header>

      <main className="px-6 pt-6">
        {currentView === 'catalog' && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 font-serif mb-6">Каталог прогулок</h2>
            <div className="grid grid-cols-1 gap-6">
              {filteredCerts.map((cert) => (
                <div 
                  key={cert.id} 
                  onClick={() => handleSelectCert(cert)}
                  className="bg-white rounded-[2rem] overflow-hidden shadow-sm active:scale-[0.98] transition-all border border-slate-100"
                >
                  <div className="h-44 relative">
                    <img src={cert.image} alt={cert.name} className="w-full h-full object-cover" />
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white font-black text-[10px]">
                      {cert.duration}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-xl font-black text-slate-800 font-serif">{cert.name}</h3>
                      <span className="text-lg font-black text-[#8B3535]">{cert.price} ₽</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-4 line-clamp-2">{cert.description}</p>
                    <div className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center">
                      Смотреть детали
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCert && (
          <div className="animate-in slide-in-from-bottom-8">
            <button onClick={() => setCurrentView('catalog')} className="mb-6 text-slate-400 font-black text-[9px] uppercase tracking-widest">
              ← К каталогу
            </button>
            <div className="rounded-[2.5rem] overflow-hidden shadow-xl mb-8 aspect-[4/5] border-4 border-white">
              <img src={selectedCert.image} alt={selectedCert.name} className="w-full h-full object-cover" />
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 mb-10">
              <h2 className="text-2xl font-black mb-4 font-serif italic text-slate-900">«{selectedCert.name}»</h2>
              <div className="space-y-3">
                {selectedCert.includes.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#8B3535] rounded-full"></div>
                    <span className="text-[12px] font-bold text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentView === 'checkout' && (
          <div className="animate-in fade-in duration-500">
            <StepIndicator currentStep={step} />

            {step === 1 && (
              <div className="bg-white p-6 rounded-[2.5rem] space-y-6 shadow-sm border border-slate-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">От кого</label>
                  <input 
                    type="text" placeholder="Ваше имя" 
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none"
                    value={order.senderName || ''}
                    onChange={(e) => setOrder({...order, senderName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Кому</label>
                  <input 
                    type="text" placeholder="Имя получателя" 
                    className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none"
                    value={order.recipientName || ''}
                    onChange={(e) => setOrder({...order, recipientName: e.target.value})}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-6 rounded-[2.5rem] space-y-4 shadow-sm border border-slate-50">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Поздравление</label>
                <textarea 
                  rows={6} placeholder="Напишите теплые слова..." 
                  className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none resize-none leading-relaxed"
                  value={order.greetingMessage || ''}
                  onChange={(e) => setOrder({...order, greetingMessage: e.target.value})}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-10 text-center">Фото-Сертификат</p>
                   <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase mb-1">Получатель</p>
                        <p className="text-xl font-black font-serif italic">{order.recipientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase mb-1">Тариф</p>
                        <p className="text-sm font-black uppercase tracking-widest">{selectedCert?.name}</p>
                      </div>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setOrder({...order, deliveryMethod: 'telegram'})}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                      order.deliveryMethod === 'telegram' ? 'border-[#8B3535] bg-[#8B3535]/5' : 'border-slate-50'
                    }`}
                  >
                    <span className="text-2xl">📱</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Telegram</span>
                  </button>
                  <button 
                    onClick={() => setOrder({...order, deliveryMethod: 'email'})}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                      order.deliveryMethod === 'email' ? 'border-[#8B3535] bg-[#8B3535]/5' : 'border-slate-50'
                    }`}
                  >
                    <span className="text-2xl">📧</span>
                    <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentView === 'success' && (
          <div className="text-center py-20 animate-in zoom-in-95">
            <div className="w-24 h-24 bg-[#8B3535]/10 text-[#8B3535] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner border border-[#8B3535]/20">
              ✓
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 font-serif italic">Готово!</h2>
            <p className="text-slate-500 mb-10 px-8 text-sm font-medium">
              Оплата прошла успешно. Сертификат будет доставлен в течение 5 минут.
            </p>
            <button 
              onClick={() => { haptic(); window.location.reload(); }}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest"
            >
              Вернуться в начало
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur-2xl border-t px-20 py-6 flex justify-between items-center z-[60] rounded-t-[2.5rem]">
        <button onClick={() => { haptic(); setCurrentView('catalog'); }} className={currentView === 'catalog' ? 'text-[#8B3535]' : 'text-slate-300'}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
        </button>
        <button onClick={() => { haptic(); setCurrentView('help'); }} className={currentView === 'help' ? 'text-[#8B3535]' : 'text-slate-300'}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </button>
      </nav>
    </div>
  );
};

export default App;
