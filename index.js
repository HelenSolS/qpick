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

function App() {
  const { useState, useEffect } = React;

  const [city, setCity] = useState(null);
  const [view, setView] = useState('catalog'); // catalog, details, checkout, payment, success, vault, design
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [vault, setVault] = useState([]);
  const [form, setForm] = useState({ sender: '', recipient: '', message: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  useEffect(function () {
    if (tg) {
      tg.ready();
      tg.expand();

          // Отправляем данные пользователя на вебхук при входе
    // Отправляем данные пользователя на вебхук при входе
    var userData = {
      source: 'web', // По умолчанию - обычный веб-сайт
      timestamp: new Date().toISOString(),
      session_id: Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };
    
    // Если есть данные Telegram пользователя - добавляем их
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      var user = tg.initDataUnsafe.user;
      userData.source = 'telegram';
      userData.telegram_id = user.id;
      userData.first_name = user.first_name || '';
      userData.last_name = user.last_name || '';
      userData.username = user.username || '';
      userData.language_code = user.language_code || 'ru';
    }
    
    fetch('https://n8n.neyronikol.ru/webhook/80385ffa-6c51-49ba-8e66-a17cf24189b5', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'init_user', user: userData })
    }).then(function(res) {
      if (res.ok) {
        console.log('[init] User registered/checked successfully', userData);
      } else {
        console.warn('[init] Webhook response status:', res.status);
      }
    }).catch(function(err) {
      console.error('[init] Webhook error:', err);
    });
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const now = new Date();
        const active = parsed.filter(function (o) {
          return new Date(o.expiry) > now;
        });
        setVault(active);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
      } catch (e) {
        console.error('Storage error', e);
      }
    }
  }, []);

  function haptic(type) {
    var t = type || 'light';
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(t);
  }

  function handleBuy() {
    haptic('medium');
    setView('success');

    setTimeout(function () {
      var now = new Date();
      var expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 6);

      var newOrder = {
        id: 'QP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        name: selectedTariff.name,
        time: selectedTariff.time,
        price: selectedTariff.price,
        city: city,
        designImg: (selectedDesign && selectedDesign.img) || DESIGNS[0].img,
        sender: form.sender,
        recipient: form.recipient,
        message: form.message,
        expiry: expiry.toISOString(),
        date: now.toLocaleDateString('ru-RU')
      };

      var updatedVault = [newOrder].concat(vault);
      setVault(updatedVault);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVault));
      setView('success');
      if (tg && tg.sendData) {
        tg.sendData(JSON.stringify({
          id: newOrder.id,
          name: newOrder.name,
          city: newOrder.city,
          sender: newOrder.sender,
          recipient: newOrder.recipient,
          message: newOrder.message,
          price: newOrder.price,
          expiry: newOrder.expiry
      }));
}

      haptic('heavy');
    }, 2000);
  }

  async function downloadPDF(order) {
    setIsGeneratingPdf(true);
    haptic('medium');

    var container = document.getElementById('pdf-export-container');
    if (!container) return;

    container.innerHTML =
      '<div style="padding: 60px; background: white; border: 30px solid black; font-family: sans-serif; position: relative; min-height: 1050px; width: 800px; box-sizing: border-box;">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px;">' +
      '<div style="background: black; color: white; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; font-size: 60px; font-weight: 900; border-radius: 20px;">Q</div>' +
      '<div style="text-align: right;">' +
      '<h1 style="margin: 0; font-size: 36px; font-weight: 900;">Q-PIC СТУДИЯ</h1>' +
      '<p style="margin: 5px 0 0 0; font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 5px;">Подарочный сертификат</p>' +
      '</div>' +
      '</div>' +
      '<div style="width: 100%; height: 450px; border-radius: 30px; overflow: hidden; margin-bottom: 50px;">' +
      '<img src="' + order.designImg + '" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />' +
      '</div>' +
      '<div style="text-align: center; margin-bottom: 60px;">' +
      '<h2 style="font-size: 64px; margin: 0; font-style: italic; font-weight: 900;">«' + order.name + '»</h2>' +
      '<p style="font-weight: 900; font-size: 18px; margin-top: 25px;">' +
      order.time +
      ' / ' +
      (order.city === 'MSK' ? 'МОСКВА' : 'СПБ') +
      '</p>' +
      '</div>' +
      '<div style="background: black; color: white; padding: 40px; border-radius: 30px; text-align: center; margin-bottom: 60px;">' +
      '<p style="font-size: 10px; opacity: 0.5; margin-bottom: 10px; letter-spacing: 3px;">КОД АКТИВАЦИИ</p>' +
      '<p style="font-size: 48px; font-weight: 900; font-family: monospace;">' + order.id + '</p>' +
      '</div>' +
      '<div style="display: flex; justify-content: space-between; font-size: 12px; color: #aaa; font-weight: 700;">' +
      '<span>Действителен до: ' + new Date(order.expiry).toLocaleDateString('ru-RU') + '</span>' +
      '<span>Q-PIC.RU</span>' +
      '</div>' +
      '</div>';

    try {
      await new Promise(function (r) { setTimeout(r, 800); });

      var canvas = await window.html2canvas(container, { scale: 2, useCORS: true });
      var imgData = canvas.toDataURL('image/jpeg', 0.95);

      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF('p', 'mm', 'a4');
      var pdfWidth = pdf.internal.pageSize.getWidth();
      var pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Q-PIC_' + order.id + '.pdf');
      haptic('heavy');
    } catch (e) {
      console.error(e);
      alert('Ошибка PDF. Попробуйте еще раз.');
    } finally {
      setIsGeneratingPdf(false);
      container.innerHTML = '';
    }
  }

  function notifyAdmin(order) {
    var text = encodeURIComponent(
      '🔔 НОВЫЙ СЕРТИФИКАТ\n' +
      'Код: ' + order.id + '\n' +
      'Тариф: ' + order.name + '\n' +
      'Город: ' + order.city + '\n' +
      'Кому: ' + order.recipient
    );
    window.open('https://t.me/HelenSolSol?text=' + text, '_blank');
  }

  if (!city && view !== 'vault') {
    return React.createElement(
      'div',
      { className: 'flex flex-col items-center justify-center min-h-screen px-10 text-center animate-fade' },
      React.createElement(
        'div',
        { className: 'w-24 h-24 bg-black rounded-[2rem] mb-8 flex items-center justify-center shadow-xl' },
        React.createElement('span', { className: 'text-white text-5xl font-serif italic font-black' }, 'Q')
      ),
      React.createElement('h1', { className: 'text-3xl font-black mb-2 uppercase tracking-tighter' }, 'Q-PIC'),
      React.createElement(
        'p',
        { className: 'text-gray-400 text-[10px] uppercase tracking-[0.4em] mb-12' },
        'Сертификаты'
      ),
      React.createElement(
        'div',
        { className: 'w-full space-y-4' },
        React.createElement(
          'button',
          {
            onClick: function () { setCity('MSK'); setView('design'); haptic(); },
            className: 'w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-colors'
          },
          'МОСКВА'
        ),
        React.createElement(
          'button',
          {
            onClick: function () { setCity('SPB'); setView('design'); haptic(); },
            className: 'w-full py-5 border-2 border-black rounded-2xl font-black text-lg active:bg-black active:text-white transition-colors'
          },
          'ПЕТЕРБУРГ'
        ),
        React.createElement(
          'button',
          {
            onClick: function () { setView('vault'); haptic(); },
            className: 'pt-6 text-[11px] font-black text-gray-300 uppercase tracking-widest block mx-auto'
          },
          'Мои покупки'
        )
      )
    );
  }

  return React.createElement(
    'div',
    { className: 'min-h-screen bg-white pb-32' },
    React.createElement(
      'header',
      { className: 'sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center' },
      React.createElement(
        'div',
        {
          className: 'flex items-center gap-2 cursor-pointer',
          onClick: function () { setView('catalog'); }
        },
        React.createElement(
          'div',
          { className: 'w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-serif italic font-black' },
          'Q'
        ),
        React.createElement('span', { className: 'font-black text-lg' }, 'Q-PIC')
      ),
      city &&
        React.createElement(
          'button',
          {
            onClick: function () { setCity(null); haptic(); },
            className: 'text-[10px] font-black text-gray-400 uppercase bg-gray-50 px-3 py-1 rounded-full'
          },
          city + ' ✕'
        )
    ),
    React.createElement(
      'main',
      { className: 'px-6 py-8' },
      view === 'design' &&
        React.createElement(
          'div',
          { className: 'animate-fade' },
          React.createElement('h2', { className: 'text-4xl font-serif italic font-black mb-6' }, 'Дизайн'),
          React.createElement(
            'div',
            { className: 'grid gap-4' },
            DESIGNS.map(function (d) {
              return React.createElement(
                'div',
                {
                  key: d.id,
                  onClick: function () { setSelectedDesign(d); setView('catalog'); haptic(); },
                  className: 'relative rounded-3xl overflow-hidden aspect-video border shadow-sm active:scale-95 transition-transform'
                },
                React.createElement('img', { src: d.img, className: 'w-full h-full object-cover' }),
                React.createElement(
                  'div',
                  { className: 'absolute inset-0 bg-black/20 flex items-end p-5' },
                  React.createElement(
                    'span',
                    { className: 'text-white font-black uppercase text-xs tracking-widest' },
                    d.name
                  )
                )
              );
            })
          )
        ),
      view === 'catalog' && city &&
        React.createElement(
          'div',
          { className: 'animate-fade' },
          React.createElement(
            'div',
            { className: 'flex justify-between items-center mb-6' },
            React.createElement('h2', { className: 'text-4xl font-serif italic font-black' }, 'Тарифы'),
            React.createElement(
              'button',
              {
                onClick: function () { setView('design'); },
                className: 'text-[10px] font-black text-black/30 uppercase border-b'
              },
              'Сменить дизайн'
            )
          ),
          React.createElement(
            'div',
            { className: 'grid gap-4' },
            CERTIFICATES[city].map(function (c) {
              return React.createElement(
                'div',
                {
                  key: c.id,
                  onClick: function () { setSelectedTariff(c); setView('details'); haptic(); },
                  className: 'rounded-[2rem] border-2 border-gray-50 p-6 active:border-black transition-colors'
                },
                React.createElement(
                  'div',
                  { className: 'flex justify-between items-center' },
                  React.createElement(
                    'div',
                    null,
                    React.createElement('h3', { className: 'text-2xl font-black' }, c.name),
                    React.createElement(
                      'p',
                      { className: 'text-[10px] font-black uppercase text-black/30' },
                      c.time
                    )
                  ),
                  React.createElement(
                    'span',
                    { className: 'font-black text-xl' },
                    c.price,
                    ' ₽'
                  )
                )
              );
            })
          )
        ),
      view === 'details' && selectedTariff &&
        React.createElement(
          'div',
          { className: 'animate-fade' },
          React.createElement('img', {
            src: selectedDesign ? selectedDesign.img : DESIGNS[0].img,
            className: 'w-full aspect-[3/4] object-cover rounded-[2.5rem] mb-6 shadow-xl'
          }),
          React.createElement(
            'h2',
            { className: 'text-4xl font-serif italic font-black mb-4 leading-none' },
            selectedTariff.name
          ),
          React.createElement(
            'div',
            { className: 'bg-gray-50 p-6 rounded-3xl mb-6 border' },
            selectedTariff.includes.map(function (inc, i) {
              return React.createElement(
                'p',
                { key: i, className: 'text-sm font-bold flex gap-3 mb-2' },
                React.createElement('span', { className: 'text-black/20' }, '•'),
                React.createElement('span', null, inc)
              );
            })
          ),
          React.createElement(
            'button',
            {
              onClick: function () { setView('checkout'); haptic(); },
              className: 'w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-transform'
            },
            'Оформить за ',
            selectedTariff.price,
            ' ₽'
          )
        ),
      view === 'checkout' &&
        React.createElement(
          'div',
          { className: 'animate-fade max-w-sm mx-auto' },
          React.createElement(
            'h2',
            { className: 'text-3xl font-serif italic font-black text-center mb-8' },
            'Оформление'
          ),
          React.createElement(
            'div',
            { className: 'space-y-4 mb-8' },
            React.createElement('input', {
              value: form.sender,
              onChange: function (e) { setForm(Object.assign({}, form, { sender: e.target.value })); },
              placeholder: 'От кого',
              className: 'w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-black/5'
            }),
            React.createElement('input', {
              value: form.recipient,
              onChange: function (e) { setForm(Object.assign({}, form, { recipient: e.target.value })); },
              placeholder: 'Кому',
              className: 'w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-black/5'
            }),
            React.createElement('textarea', {
              value: form.message,
              onChange: function (e) { setForm(Object.assign({}, form, { message: e.target.value })); },
              placeholder: 'Пожелание',
              className: 'w-full p-5 bg-gray-50 rounded-2xl outline-none font-bold h-32 focus:ring-2 focus:ring-black/5 resize-none'
            })
          ),
          React.createElement(
            'button',
            {
              onClick: handleBuy,
              className: 'w-full py-6 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl'
            },
            'Оплатить ',
            selectedTariff ? selectedTariff.price : '',
            ' ₽'
          )
        ),
      view === 'payment' &&
        React.createElement(
          'div',
          { className: 'flex flex-col items-center justify-center py-20 animate-fade text-center' },
          React.createElement('div', { className: 'spinner mb-6' }),
          React.createElement('h2', { className: 'text-xl font-black uppercase' }, 'Переход к оплате'),
          React.createElement(
            'p',
            { className: 'text-gray-400 text-sm mt-3 px-10' },
            'Открываем защищенный шлюз ЮKassa...'
          )
        ),
      view === 'success' && vault[0] &&
        React.createElement(
          'div',
          { className: 'text-center py-6 animate-fade' },
          React.createElement(
            'div',
            { className: 'w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-2xl' },
            React.createElement(
              'svg',
              { className: 'w-10 h-10', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 4,
                d: 'M5 13l4 4L19 7'
              })
            )
          ),
          React.createElement('h2', { className: 'text-4xl font-serif italic font-black mb-2' }, 'Готово!'),
          React.createElement(
            'div',
            { className: 'bg-black text-white p-8 rounded-[2rem] font-mono text-3xl tracking-[0.3em] mb-8 shadow-2xl' },
            vault[0].id
          ),
          React.createElement(
            'div',
            { className: 'space-y-4' },
            React.createElement(
              'button',
              {
                disabled: isGeneratingPdf,
                onClick: function () { downloadPDF(vault[0]); },
                className: 'w-full py-6 border-2 border-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2'
              },
              isGeneratingPdf
                ? React.createElement('span', { className: 'spinner w-4 h-4 border-2' })
                : 'Скачать PDF'
            ),
            React.createElement(
              'button',
              {
                onClick: function () { notifyAdmin(vault[0]); },
                className: 'w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest'
              },
              'Написать админу'
            )
          )
        ),
      view === 'vault' &&
        React.createElement(
          'div',
          { className: 'animate-fade' },
          React.createElement('h2', { className: 'text-5xl font-serif italic font-black mb-8' }, 'Архив'),
          React.createElement(
            'div',
            { className: 'space-y-6' },
            vault.map(function (o) {
              return React.createElement(
                'div',
                { key: o.id, className: 'p-8 border-2 border-gray-50 rounded-[2.5rem] bg-white shadow-sm' },
                React.createElement(
                  'div',
                  { className: 'flex justify-between mb-4' },
                  React.createElement(
                    'div',
                    null,
                    React.createElement(
                      'p',
                      { className: 'text-[10px] text-gray-400 font-bold uppercase mb-1' },
                      o.date
                    ),
                    React.createElement(
                      'h3',
                      { className: 'text-2xl font-black' },
                      '«',
                      o.name,
                      '»'
                    ),
                    React.createElement(
                      'p',
                      { className: 'text-[10px] font-black uppercase text-black/30' },
                      o.time,
                      ' • ',
                      o.city
                    )
                  ),
                  React.createElement(
                    'div',
                    { className: 'w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center font-serif italic font-black text-xl' },
                    'Q'
                  )
                ),
                React.createElement(
                  'div',
                  { className: 'p-5 border-2 border-dashed border-gray-100 rounded-2xl text-center mb-6 bg-gray-50/50' },
                  React.createElement(
                    'p',
                    { className: 'font-mono font-black text-xl tracking-widest' },
                    o.id
                  )
                ),
                React.createElement(
                  'button',
                  {
                    onClick: function () { downloadPDF(o); },
                    className: 'w-full py-4 border-2 border-black rounded-xl font-black uppercase text-[10px] tracking-widest active:bg-black active:text-white transition-colors'
                  },
                  'Скачать PDF'
                )
              );
            }),
            vault.length === 0 &&
              React.createElement(
                'p',
                { className: 'text-center text-gray-300 py-20 font-black uppercase tracking-widest' },
                'Архив пуст'
              )
          )
        )
    ),
    ['catalog', 'details', 'vault', 'design'].includes(view) &&
      React.createElement(
        'nav',
        { className: 'fixed bottom-8 left-1/2 -translate-x-1/2 w-[180px] bg-black/95 rounded-full p-2 flex justify-between items-center z-50 shadow-2xl' },
        React.createElement(
          'button',
          {
            onClick: function () { setView(city ? 'design' : 'catalog'); haptic(); },
            className: 'p-3 rounded-full transition-all ' + (view !== 'vault' ? 'bg-white text-black' : 'text-white/30')
          },
          React.createElement(
            'svg',
            { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 3,
              d: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
            })
          )
        ),
        React.createElement(
          'button',
          {
            onClick: function () { setView('vault'); haptic(); },
            className: 'p-3 rounded-full transition-all ' + (view === 'vault' ? 'bg-white text-black' : 'text-white/30')
          },
          React.createElement(
            'svg',
            { className: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 3,
              d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            })
          )
        )
      )
  );
}

var rootElement = document.getElementById('root');
if (rootElement) {
  var root = ReactDOM.createRoot(rootElement);
  root.render(React.createElement(App));
}
