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
    return h(
