
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// --- КОНСТАНТЫ ПРИЛОЖЕНИЯ ---
const STORAGE_KEY = 'qpic_storage_v1';

const DESIGNS = [
    { id: 'd1', name: 'Минимализм', img: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?q=80&w=800' },
    { id: 'd2', name: 'Праздник', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=800' },
    { id: 'd3', name: 'День Рождения', img: 'https://images.unsplash.com/photo-1530103862676-fa390d41246f?q=80&w=800' },
    { id: 'd4', name: 'Классика', img: 'https://images.unsplash.com/photo-1549463017-23c0979bb4c9?q=80&w=800' },
    { id: 'd5', name: 'Романтика', img: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=800' }
];

const CERTIFICATES = {
    MSK: [
        { id: 'msk-1', name: 'ЭКСПРЕСС', time: '10 МИН', price: 1350, includes: ['10 мин съемки', 'Все исходники', '10 фото в обработке'] },
        { id: 'msk-2', name: 'СТАНДАРТ', time: '20 МИН', price: 2450, includes: ['20 мин съемки', 'Все исходники', '20 фото в обработке'] },
        { id: 'msk-4', name: 'ОПТИМА', time: '30 МИН', price: 3500, includes: ['30 мин съемки', 'Все исходники', '30 фото в обработке'] },
        { id: 'msk-3', name: 'ПРЕМИУМ', time: '60 МИН', price: 6500, includes: ['60 мин съемки', 'Все исходники', '60 фото в обработке'] }
    ],
    SPB: [
        { id: 'spb-1', name: 'ЭКСПРЕСС', time: '10 МИН', price: 1200, includes: ['10 мин съемки', 'Все исходники', '10 фото в обработке'] },
        { id: 'spb-2', name: 'СТАНДАРТ', time: '20 МИН', price: 2100, includes: ['20 мин съемки', 'Все исходники', '20 фото в обработке'] },
        { id: 'spb-4', name: 'ОПТИМА', time: '30 МИН', price: 3100, includes: ['30 мин съемки', 'Все исходники', '30 фото в обработке'] },
        { id: 'spb-3', name: 'ПРЕМИУМ', time: '60 МИН', price: 6100, includes: ['60 мин съемки', 'Все исходники', '60 фото в обработке'] }
    ]
};

// --- ОСНОВНОЕ ПРИЛОЖЕНИЕ ---
function App() {
    const [city, setCity] = useState<'MSK' | 'SPB' | null>(null);
    const [view, setView] = useState('catalog'); // catalog, details, checkout, payment, success, vault, design
    const [selectedDesign, setSelectedDesign] = useState<any>(null);
    const [selectedTariff, setSelectedTariff] = useState<any>(null);
    const [vault, setVault] = useState<any[]>([]);
    const [form, setForm] = useState({ sender: '', recipient: '', message: '' });
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    const tg = (window as any).Telegram?.WebApp || null;

    useEffect(() => {
        if (tg) {
            tg.ready();
            tg.expand();
        }
        
        // Загрузка сохраненных покупок
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const now = new Date();
                // Оставляем только те, что не старше 6 месяцев
                const active = parsed.filter((o: any) => new Date(o.expiry) > now);
                setVault(active);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
            } catch (e) { console.error("Storage error", e); }
        }
    }, []);

    const haptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
        if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
    };

    const handleBuy = () => {
        haptic('medium');
        setView('payment');
        
        // Имитация процесса оплаты
        setTimeout(() => {
            const now = new Date();
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + 6);

            const newOrder = {
                id: 'QP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
                name: selectedTariff.name,
                time: selectedTariff.time,
                price: selectedTariff.price,
                city: city,
                designImg: selectedDesign?.img || DESIGNS[0].img,
                sender: form.sender,
                recipient: form.recipient,
                message: form.message,
                expiry: expiry.toISOString(),
                date: now.toLocaleDateString('ru-RU'),
            };

            const updatedVault = [newOrder, ...vault];
            setVault(updatedVault);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVault));
            setView('success');
            haptic('heavy');
        }, 2000);
    };

    const downloadPDF = async (order: any) => {
        setIsGeneratingPdf(true);
        haptic('medium');
        
        const container = document.getElementById('pdf-export-container');
        if (!container) return;

        // Создаем верстку для PDF
        container.innerHTML = `
            <div style="padding: 60px; background: white; border: 30px solid black; font-family: sans-serif; position: relative; min-height: 1050px; width: 800px; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px;">
                    <div style="background: black; color: white; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: 900; border-radius: 20px;">Q</div>
                    <div style="text-align: right;">
                        <h1 style="margin: 0; font-size: 36px; font-weight: 900;">Q-PIC СТУДИЯ</h1>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 5px;">Подарочный сертификат</p>
                    </div>
                </div>

                <div style="width: 100%; height: 450px; border-radius: 30px; overflow: hidden; margin-bottom: 50px;">
                    <img src="${order.designImg}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
                </div>

                <div style="text-align: center; margin-bottom: 60px;">
                    <h2 style="font-size: 64px; margin: 0; font-style: italic; font-weight: 900;">«${order.name}»</h2>
                    <p style="font-weight: 900; font-size: 18px; margin-top: 25px;">${order.time} / ${order.city === 'MSK' ? 'МОСКВА' : 'СПБ'}</p>
                </div>

                <div style="background: black; color: white; padding: 40px; border-radius: 30px; text-align: center; margin-bottom: 60px;">
                    <p style="font-size: 10px; opacity: 0.5; margin-bottom: 10px; letter-spacing: 3px;">КОД АКТИВАЦИИ</p>
                    <p style="font-size: 48px; font-weight: 900; font-family: monospace;">${order.id}</p>
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; font-weight: 700;">
                    <span>Действителен до: ${new Date(order.expiry).toLocaleDateString('ru-RU')}</span>
                    <span>Q-PIC.RU</span>
                </div>
            </div>
        `;

        try {
            await new Promise(r => setTimeout(r, 800));
            const canvas = await (window as any).html2canvas(container, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            const { jsPDF } = (window as any).jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Q-PIC_${order.id}.pdf`);
            haptic('heavy');
        } catch (e) {
            console.error(e);
            alert('Ошибка PDF. Попробуйте еще раз.');
        } finally {
            setIsGeneratingPdf(false);
            container.innerHTML = '';
        }
    };

    const notifyAdmin = (order: any) => {
        const text = encodeURIComponent(`🔔 НОВЫЙ СЕРТИФИКАТ\nКод: ${order.id}\nТариф: ${order.name}\nГород: ${order.city}\nКому: ${order.recipient}`);
        window.open(`https://t.me/HelenSolSol?text=${text}`, '_blank');
    };

    // Экран выбора города
    if (!city && view !== 'vault') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-10 text-center animate-fade">
                <div className="w-24 h-24 bg-black rounded-[2rem] mb-8 flex items-center justify-center shadow-xl">
                    <span className="text-white text-5xl font-serif italic font-black">Q</span>
                </div>
                <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Q-PIC</h1>
                <p className="text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-12">Сертификаты</p>
                <div className="w-full space-y-4">
                    <button onClick={() => { setCity('MSK'); setView('design'); haptic(); }} className="w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-colors">МОСКВА</button>
                    <button onClick={() => { setCity('SPB'); setView('design'); haptic(); }} className="w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-colors">ПЕТЕРБУРГ</button>
                    <button onClick={() => { setView('vault'); haptic(); }} className="pt-6 text-[11px] font-black text-gray-300 uppercase tracking-widest block mx-auto">Мои покупки</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-32">
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('catalog')}>
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-serif italic font-black">Q</div>
                    <span className="font-black text-lg">Q-PIC</span>
                </div>
                {city && (
                    <button onClick={() => { setCity(null); haptic(); }} className="text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-full">{city} ✕</button>
                )}
            </header>

            <main className="px-6 py-8">
                {view === 'design' && (
                    <div className="animate-fade">
                        <h2 className="text-4xl font-serif italic font-black mb-6">Дизайн</h2>
                        <div className="grid gap-4">
                            {DESIGNS.map(d => (
                                <div key={d.id} onClick={() => { setSelectedDesign(d); setView('catalog'); haptic(); }} className="relative rounded-3xl overflow-hidden aspect-video border shadow-sm active:scale-95 transition-transform">
                                    <img src={d.img} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-end p-5">
                                        <span className="text-white font-black uppercase text-xs tracking-widest">{d.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'catalog' && city && (
                    <div className="animate-fade">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-4xl font-serif italic font-black">Тарифы</h2>
                            <button onClick={() => setView('design')} className="text-[10px] font-black text-black/30 uppercase border-b">Сменить дизайн</button>
                        </div>
                        <div className="grid gap-4">
                            {CERTIFICATES[city].map((c: any) => (
                                <div key={c.id} onClick={() => { setSelectedTariff(c); setView('details'); haptic(); }} className="rounded-[2rem] border-2 border-gray-50 p-6 active:border-black transition-colors">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-2xl font-black">{c.name}</h3>
                                            <p className="text-[10px] font-black uppercase text-black/30">{c.time}</p>
                                        </div>
                                        <span className="font-black text-xl">{c.price} ₽</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'details' && selectedTariff && (
                    <div className="animate-fade">
                        <img src={selectedDesign?.img} className="w-full aspect-[3/4] object-cover rounded-[2.5rem] mb-6 shadow-xl" />
                        <h2 className="text-4xl font-serif italic font-black mb-4 leading-none">{selectedTariff.name}</h2>
                        <div className="bg-gray-50 p-6 rounded-3xl mb-6 border">
                            {selectedTariff.includes.map((inc: string, i: number) => (
                                <p key={i} className="text-sm font-bold flex gap-3 mb-2">
                                    <span className="text-black/20">•</span>
                                    <span>{inc}</span>
                                </p>
                            ))}
                        </div>
                        <button onClick={() => { setView('checkout'); haptic(); }} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-transform">Оформить за {selectedTariff.price} ₽</button>
                    </div>
                )}

                {view === 'checkout' && (
                    <div className="animate-fade max-w-sm mx-auto">
                        <h2 className="text-3xl font-serif italic font-black text-center mb-8">Оформление</h2>
                        <div className="space-y-4 mb-8">
                            <input value={form.sender} onChange={(e) => setForm({...form, sender: e.target.value})} placeholder="От кого" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-black/5" />
                            <input value={form.recipient} onChange={(e) => setForm({...form, recipient: e.target.value})} placeholder="Кому" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-black/5" />
                            <textarea value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Пожелание" className="w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold h-32 focus:ring-2 focus:ring-black/5 resize-none" />
                        </div>
                        <button onClick={handleBuy} className="w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Оплатить {selectedTariff.price} ₽</button>
                    </div>
                )}

                {view === 'payment' && (
                    <div className="flex flex-col items-center justify-center py-20 animate-fade text-center">
                        <div className="spinner mb-6" />
                        <h2 className="text-xl font-black uppercase">Переход к оплате</h2>
                        <p className="text-gray-400 text-sm mt-3 px-10">Открываем защищенный шлюз ЮKassa...</p>
                    </div>
                )}

                {view === 'success' && vault[0] && (
                    <div className="text-center py-6 animate-fade">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-2xl">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h2 className="text-4xl font-serif italic font-black mb-2">Готово!</h2>
                        <div className="bg-black text-white p-8 rounded-[2rem] font-mono text-3xl tracking-[0.3em] mb-8 shadow-2xl">{vault[0].id}</div>
                        <div className="space-y-4">
                            <button disabled={isGeneratingPdf} onClick={() => downloadPDF(vault[0])} className="w-full py-6 border-2 border-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                                {isGeneratingPdf ? <span className="spinner w-4 h-4 border-2" /> : 'Скачать PDF'}
                            </button>
                            <button onClick={() => notifyAdmin(vault[0])} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">Написать админу</button>
                        </div>
                    </div>
                )}

                {view === 'vault' && (
                    <div className="animate-fade">
                        <h2 className="text-5xl font-serif italic font-black mb-8">Архив</h2>
                        <div className="space-y-6">
                            {vault.map((o: any) => (
                                <div key={o.id} className="p-8 border-2 border-gray-50 rounded-[2.5rem] bg-white shadow-sm">
                                    <div className="flex justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">{o.date}</p>
                                            <h3 className="text-2xl font-black">«{o.name}»</h3>
                                            <p className="text-[10px] font-black uppercase text-black/30">{o.time} • {o.city}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-serif italic font-black text-xl">Q</div>
                                    </div>
                                    <div className="p-5 border-2 border-dashed border-gray-100 rounded-2xl text-center mb-6 bg-gray-50/50">
                                        <p className="font-mono font-black text-xl tracking-widest">{o.id}</p>
                                    </div>
                                    <button onClick={() => downloadPDF(o)} className="w-full py-4 border-2 border-black rounded-xl font-black uppercase text-[10px] tracking-widest active:bg-black active:text-white transition-colors">Скачать PDF</button>
                                </div>
                            ))}
                            {vault.length === 0 && <p className="text-center text-gray-300 py-20 font-black uppercase tracking-widest">Архив пуст</p>}
                        </div>
                    </div>
                )}
            </main>

            {/* Навигация */}
            {['catalog', 'details', 'vault', 'design'].includes(view) && (
                <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[180px] bg-black/95 rounded-full p-2 flex justify-between items-center z-50 shadow-2xl">
                    <button onClick={() => { setView(city ? 'design' : 'catalog'); haptic(); }} className={`p-3 rounded-full transition-all ${view !== 'vault' ? 'bg-white text-black' : 'text-white/30'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    </button>
                    <button onClick={() => { setView('vault'); haptic(); }} className={`p-3 rounded-full transition-all ${view === 'vault' ? 'bg-white text-black' : 'text-white/30'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </button>
                </nav>
            )}
        </div>
    );
}

// Рендеринг
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
