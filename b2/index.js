const h = React.createElement;
const { useState, useEffect } = React;

// Ключ для локального хранилища
const STORAGE_KEY = 'qpic_storage_v1';

// Бэкенд (n8n)
const API_BASE = 'https://n8n.neyronikol.ru';
// Вебхук n8n — подставь сюда актуальный ID из env, если он другой
const WEBHOOK_URL = API_BASE + '/webhook/80385ffa-6c51-49ba-8e66-a17cf24189b5';

const DESIGNS = [
  { id: 'd1', name: 'Минимализм', img: 'https://images.unsplash.com/photo-1520106212299-d99c443e4568?w=400' },
  { id: 'd2', name: 'Праздник', img: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400' },
  { id: 'd3', name: 'День Рождения', img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400' },
  { id: 'd4', name: 'Классика', img: 'https://images.unsplash.com/photo-1549494756-4099a6a9d5e7?w=400' },
  { id: 'd5', name: 'Романтика', img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400' },
];

const CERTIFICATES = {
  MSK: [
    { id: 'msk-1', name: 'ЭКССПРЕСС', time: '10 МИН', price: 1350, includes: ['10 мин съемки', 'Все основные фото', 'Базовая обработка'] },
    { id: 'msk-2', name: 'СТАНДАРТ', time: '20 МИН', price: 2450, includes: ['20 мин съемки', 'Все фото без ограничений', 'Profesional editing', '50% скидка на второго'] },
    { id: 'msk-4', name: 'ОПТИМА', time: '30 МИН', price: 3500, includes: ['30 мин съемки', 'Все фото + видео', 'Full day access', 'Бонус реквизит'] },
    { id: 'msk-3', name: 'ПРЕМИУМ', time: '60 МИН', price: 6500, includes: ['60 мин съемки', 'Все фото + видео 4K', 'Private location', 'Stylist included'] },
  ],
  SPB: [
    { id: 'spb-1', name: 'ЭКССПРЕСС', time: '10 МИН', price: 1200, includes: ['10 мин съемки', 'Все основные фото', 'Базовая обработка'] },
    { id: 'spb-2', name: 'СТАНДАРТ', time: '20 МИН', price: 2100, includes: ['20 мин съемки', 'Все фото без ограничений', 'Profesional editing', '50% скидка на второго'] },
    { id: 'spb-4', name: 'ОПТИМА', time: '30 МИН', price: 3100, includes: ['30 мин съемки', 'Все фото + видео', 'Full day access', 'Бонус реквизит'] },
    { id: 'spb-3', name: 'ПРЕМИУМ', time: '60 МИН', price: 6100, includes: ['60 мин съемки', 'Все фото + видео 4K', 'Private location', 'Stylist included'] },
  ],
};

function App() {
  const [city, setCity] = useState(null);
  const [view, setView] = useState('catalog'); // catalog, details, checkout, payment, success, vault
  const [selected, setSelected] = useState(null);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [vault, setVault] = useState([]);
  const [form, setForm] = useState({ sender: '', recipient: '', message: '' });
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const tg = window.Telegram ? window.Telegram.WebApp : null;

  // Fallback: загрузка архива из localStorage
  const loadVaultFromStorage = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const now = new Date();
      const active = parsed.filter(o => new Date(o.expiry) > now);
      setVault(active);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
    } catch (e) {
      console.error('Failed to parse local storage', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Идентификация клиента + загрузка истории сертификатов
  const identifyClient = async () => {
    const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;

    // Если открыли не в Telegram — работаем только с localStorage
    if (!tgUser) {
      console.log('[identify_client] Not in Telegram, using localStorage only');
      loadVaultFromStorage();
      return;
    }

    try {
      const payload = {
        telegram_id: tgUser.id,
        username: tgUser.username,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name,
        language_code: tgUser.language_code,
      };

      console.log('[identify_client] Sending webhook:', { type: 'identify_client', data: payload });

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'identify_client',
          data: payload,
        }),
      });

      if (!res.ok) {
        console.warn('[identify_client] Failed, status:', res.status);
        loadVaultFromStorage();
        return;
      }

      const json = await res.json();
      console.log('[identify_client] Response:', json);

      if (json.client_id) {
        setClientId(json.client_id);
      }

      if (Array.isArray(json.certificates)) {
        // Здесь будет история покупок, которую вернёт n8n
        setVault(json.certificates);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json.certificates));
      } else {
        loadVaultFromStorage();
      }
    } catch (e) {
      console.error('[identify_client] Error:', e);
      loadVaultFromStorage();
    }
  };

  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#ffffff');
      if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
    }

    // Хук на вход в миниапп
    identifyClient();
  }, []);

  const haptic = (type = 'light') => {
    if (tg && tg.HapticFeedback && tg.HapticFeedback.impactOccurred) {
      tg.HapticFeedback.impactOccurred(type);
    }
  };

  // Покупка сертификата: хук в n8n
  const handleBuy = async () => {
    if (!selected || !city) return;

    haptic('medium');
    setView('payment');
    setLoading(true);

    try {
      const tgUser = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;

      const orderData = {
        telegram_id: tgUser && tgUser.id,
        certificate_id: selected.id, // 'msk-1', 'spb-2' и т.п.
        sender_name: form.sender,
        recipient_name: form.recipient,
        greeting_message: form.message,
      };

      console.log('[create_certificate] Sending webhook:', { type: 'create_certificate', data: orderData });

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'create_certificate',
          data: orderData,
        }),
      });

      if (!res.ok) {
        console.warn('[create_certificate] Failed, status:', res.status);
        setLoading(false);
        setView('checkout');
        return;
      }

      const json = await res.json();
      console.log('[create_certificate] Response:', json);

      const now = new Date();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 6);

      const newOrder = {
        id:
          json.certificate && json.certificate.code
            ? json.certificate.code
            : 'QP-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        orderId: json.certificate && json.certificate.id,
        name: selected.name,
        price: selected.price,
        city: city,
        expiry: (json.certificate && json.certificate.expires_at) || expiry.toISOString(),
        date: now.toLocaleDateString('ru-RU'),
        status: 'active',
      };

      const updatedVault = [newOrder, ...vault];
      setVault(updatedVault);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVault));

      setLoading(false);
      setView('success');
      haptic('heavy');
    } catch (e) {
      console.error('[create_certificate] Error:', e);
      setLoading(false);
      setView('checkout');
    }
  };

  async function downloadPDF(order) {
    setIsGeneratingPdf(true);
    haptic('medium');
    
    var container = document.getElementById('pdf-export-container');
    if (!container) return;

    container.innerHTML =
      '<div style="padding: 60px; background: white; border: 30px solid black; font-family: sans-serif; position: relative; min-height: 1050px; width: 800px; box-sizing: border-box;">' +
      '<div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px;">' +
      '<div>' +
      '<h1 style="margin: 0; font-size: 48px; color: #1a1a1a;">QPICK</h1>' +
      '<p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Photography Gift Certificate</p>' +
      '</div>' +
      '<div style="text-align: right;">' +
      '<p style="margin: 0; font-size: 12px; color: #999;">ID: ' + order.id + '</p>' +
      '<p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">Date: ' + order.date + '</p>' +
      '</div>' +
      '</div>' +
      '<div style="border: 2px dashed #ddd; padding: 30px; margin-bottom: 60px;">' +
      '<p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">Dear ' + order.recipient + ',</p>' +
      '<p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #1a1a1a;">' + order.message + '</p>' +
      '<p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">From: ' + order.sender + '</p>' +
      '</div>' +
      '<div style="background: #f5f5f5; padding: 20px; margin-bottom: 60px; border-radius: 4px;">' +
      '<p style="margin: 0; font-size: 12px; font-weight: bold; color: #1a1a1a;">PACKAGE: ' + order.name.toUpperCase() + '</p>' +
      '<p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">Price: ₽' + order.price + '</p>' +
      '<p style="margin: 8px 0 0 0; font-size: 12px; color: #999;">Valid until: ' + new Date(order.expiry).toLocaleDateString('ru-RU') + '</p>' +
      '</div>' +
      '<div style="text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">' +
      '<p style="margin: 0; font-size: 10px; color: #999;">This certificate is valid for a single photography session.</p>' +
      '<p style="margin: 4px 0 0 0; font-size: 10px; color: #999;">To book your session, contact us via Telegram Bot.</p>' +
      '</div>' +
      '</div>';

    setTimeout(async function () {
      try {
        const canvas = await html2canvas(container, { useCORS: true, scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new window.jsPDF({ orientation: 'portrait', unit: 'px', format: [800, 1050] });
        pdf.addImage(imgData, 'PNG', 0, 0, 800, 1050);
        pdf.save('qpick_certificate_' + order.id + '.pdf');
        haptic('heavy');
      } catch (e) {
        console.error('PDF generation error', e);
      } finally {
        setIsGeneratingPdf(false);
        container.innerHTML = '';
      }
    }, 500);
  }

  function notifyAdmin() {
    if (tg && tg.sendData) {
      tg.sendData(JSON.stringify({ action: 'admin_notification', message: 'Something happened' }));
    }
  }

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Рендер: Выбор города
  if (!city && view !== 'vault') {
        return h('div', { style: { padding: '20px', minHeight: '100vh', background: '#f9f9f9' } },
      h('h2', { style: { textAlign: 'center', marginBottom: '30px' } }, 'Выберите ваш город'),
      h('div', { style: { display: 'flex', gap: '20px', justifyContent: 'center' } },
        h('button', {
          onClick: () => { setCity('MSK'); haptic(); },
          style: { padding: '20px 40px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
        }, 'Москва'),
        h('button', {
          onClick: () => { setCity('SPB'); haptic(); },
          style: { padding: '20px 40px', fontSize: '18px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
        }, 'Санкт-Петербург')
      ),
      h('div', { style: { textAlign: 'center', marginTop: '30px' } },
        h('button', {
          onClick: () => setView('vault'),
          style: { padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
        }, '📦 Мои сертификаты')
      )
    );
  }

  const certs = CERTIFICATES[city] || [];

  if (view === 'vault') {
    return h('div', { style: { padding: '20px', background: '#f9f9f9', minHeight: '100vh' } },
      h('h2', { style: { textAlign: 'center' } }, '📦 Мои сертификаты'),
      vault.length === 0
        ? h('p', { style: { textAlign: 'center', color: '#999' } }, 'Пока нет активных сертификатов')
        : h('div', { style: { marginTop: '20px' } },
          vault.map(o =>
            h('div', { key: o.id, style: { background: '#fff', padding: '20px', marginBottom: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' } },
              h('p', { style: { fontWeight: 'bold', marginBottom: '10px' } }, 'Сертификат: ' + o.name),
              h('p', {}, 'Код: ' + o.id),
              h('p', {}, 'Город: ' + o.city),
              h('p', {}, 'Действителен до: ' + new Date(o.expiry).toLocaleDateString('ru-RU')),
              h('button', {
                onClick: () => downloadPDF(o),
                disabled: isGeneratingPdf,
                style: { marginTop: '10px', padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: isGeneratingPdf ? 'not-allowed' : 'pointer' }
              }, isGeneratingPdf ? 'Генерация...' : '📥 Скачать PDF')
            )
          )
        ),
      h('button', {
        onClick: () => { setView('catalog'); setCity(null); },
        style: { marginTop: '20px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
      }, '← Назад')
    );
  }

  if (view === 'catalog') {
    return h('div', { style: { padding: '20px', background: '#f9f9f9', minHeight: '100vh' } },
      h('h2', { style: { textAlign: 'center' } }, 'Каталог сертификатов — ' + city),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' } },
        certs.map(cert =>
          h('div', { key: cert.id, onClick: () => { setSelected(cert); setView('details'); haptic(); }, style: { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', cursor: 'pointer' } },
            h('h3', { style: { marginBottom: '10px' } }, cert.name),
            h('p', {}, cert.time),
            h('p', { style: { fontSize: '20px', fontWeight: 'bold', color: '#4CAF50' } }, '₽' + cert.price)
          )
        )
      ),
      h('button', {
        onClick: () => setCity(null),
        style: { marginTop: '20px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
      }, '← Сменить город'),
      h('button', {
        onClick: () => setView('vault'),
        style: { marginTop: '20px', marginLeft: '10px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
      }, '📦 Мои сертификаты')
    );
  }

  if (view === 'details' && selected) {
    return h('div', { style: { padding: '20px', background: '#f9f9f9', minHeight: '100vh' } },
      h('h2', {}, selected.name),
      h('p', {}, selected.time),
      h('p', { style: { fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' } }, '₽' + selected.price),
      h('ul', { style: { marginTop: '20px' } },
        selected.includes.map((inc, i) => h('li', { key: i }, inc))
      ),
      h('button', {
        onClick: () => { setView('checkout'); haptic(); },
        style: { marginTop: '20px', padding: '15px 30px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
      }, 'Купить'),
      h('button', {
        onClick: () => { setView('catalog'); setSelected(null); },
        style: { marginTop: '10px', marginLeft: '10px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
      }, '← Назад')
    );
  }

  if (view === 'checkout' && selected) {
    return h('div', { style: { padding: '20px', background: '#f9f9f9', minHeight: '100vh' } },
      h('h2', {}, 'Оформление сертификата'),
      h('p', { style: { marginBottom: '20px' } }, selected.name + ' — ₽' + selected.price),
      h('div', { style: { marginBottom: '15px' } },
        h('label', { style: { display: 'block', marginBottom: '5px' } }, 'От кого:'),
        h('input', {
          type: 'text',
          value: form.sender,
          onInput: (e) => setForm({ ...form, sender: e.target.value }),
          placeholder: 'Ваше имя',
          style: { width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }
        })
      ),
      h('div', { style: { marginBottom: '15px' } },
        h('label', { style: { display: 'block', marginBottom: '5px' } }, 'Кому:'),
        h('input', {
          type: 'text',
          value: form.recipient,
          onInput: (e) => setForm({ ...form, recipient: e.target.value }),
          placeholder: 'Имя получателя',
          style: { width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }
        })
      ),
      h('div', { style: { marginBottom: '20px' } },
        h('label', { style: { display: 'block', marginBottom: '5px' } }, 'Поздравление:'),
        h('textarea', {
          value: form.message,
          onInput: (e) => setForm({ ...form, message: e.target.value }),
          placeholder: 'Ваше поздравление',
          rows: 4,
          style: { width: '100%', padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }
        })
      ),
      h('button', {
        onClick: handleBuy,
        style: { padding: '15px 30px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }
      }, 'Оплатить ₽' + selected.price),
      h('button', {
        onClick: () => setView('details'),
        style: { marginTop: '10px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', width: '100%' }
      }, '← Назад')
    );
  }

  if (view === 'payment' && loading) {
    return h('div', { style: { padding: '20px', textAlign: 'center', minHeight: '100vh', background: '#f9f9f9' } },
      h('h2', {}, 'Оплата...'),
      h('p', {}, 'Подождите, обрабатываем ваш заказ...')
    );
  }

  if (view === 'success') {
    return h('div', { style: { padding: '20px', textAlign: 'center', minHeight: '100vh', background: '#f9f9f9' } },
      h('h2', { style: { color: '#4CAF50' } }, '✅ Спасибо за покупку!'),
      h('p', {}, 'Ваш сертификат успешно создан.'),
      h('button', {
        onClick: () => setView('vault'),
        style: { marginTop: '20px', padding: '15px 30px', fontSize: '18px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
      }, '📦 Посмотреть мои сертификаты'),
      h('button', {
        onClick: () => { setView('catalog'); setSelected(null); setForm({ sender: '', recipient: '', message: '' }); },
        style: { marginTop: '10px', padding: '10px 20px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }
      }, 'Купить ещё')
    );
  }

  return h('div', {}, 'Загрузка...');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(h(App));
