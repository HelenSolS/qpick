import React, { useEffect, useState } from 'react';
import './App.css';

// Telegram WebApp API
declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

const tg = window.Telegram?.WebApp;

function App() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Получаем URL из переменных окружения
  const WEBHOOK_URL = `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_INIT_USER_PATH}`;
  const CREATE_CERTIFICATE_URL = `${import.meta.env.VITE_API_BASE}${import.meta.env.VITE_CREATE_CERTIFICATE_PATH}`;

  // Инициализация пользователя при загрузке приложения
  useEffect(() => {
    if (tg) {
      tg.ready();
      tg.expand();

      // Инициализируем пользователя сразу при загрузке
      initializeUser();
    }
  }, []);

  // Функция инициализации пользователя
  const initializeUser = async () => {
    try {
      const initData = tg?.initData || '';
      const user = tg?.initDataUnsafe?.user;

      if (!user) {
        console.error('Пользователь не найден в Telegram WebApp');
        setIsLoading(false);
        return;
      }

      console.log('Инициализация пользователя:', user);

      // Отправляем данные пользователя в n8n
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'init_user',
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            language_code: user.language_code,
          },
          initData: initData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Пользователь инициализирован:', data);

        // Если есть история покупок - загружаем её
        if (data.history) {
          setUserHistory(data.history);
        }
      } else {
        console.error('Ошибка инициализации:', response.status);
      }
    } catch (error) {
      console.error('Ошибка при инициализации пользователя:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция покупки сертификата
  const handlePurchase = async (certificateData: any) => {
    try {
      const user = tg?.initDataUnsafe?.user;

      if (!user) {
        tg?.showAlert('Ошибка: пользователь не найден');
        return;
      }

      console.log('Покупка сертификата:', certificateData);

      // Отправляем данные о покупке в n8n
      const response = await fetch(CREATE_CERTIFICATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_certificate',
          user: {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
          },
          certificate: certificateData,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Сертификат создан:', data);

        tg?.showAlert('Сертификат успешно создан!');

        // Обновляем историю покупок
        setUserHistory(prev => [...prev, data.certificate]);
      } else {
        console.error('Ошибка создания сертификата:', response.status);
        tg?.showAlert('Ошибка при создании сертификата');
      }
    } catch (error) {
      console.error('Ошибка при покупке:', error);
      tg?.showAlert('Произошла ошибка. Попробуйте снова.');
    }
  };

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Q-PIC Сертификаты</h1>
      </header>

      <main>
        {/* История покупок */}
        {userHistory.length > 0 && (
          <section className="history">
            <h2>Ваши покупки</h2>
            <div className="history-list">
              {userHistory.map((item, index) => (
                <div key={index} className="history-item">
                  <p>{item.name || 'Сертификат'}</p>
                  <p>{item.date}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Список доступных сертификатов */}
        <section className="certificates">
          <h2>Доступные сертификаты</h2>
          <div className="certificates-grid">
            <div className="certificate-card">
              <h3>Сертификат 1000₽</h3>
              <p>Подарочный сертификат на 1000 рублей</p>
              <button onClick={() => handlePurchase({ name: 'Сертификат 1000₽', amount: 1000 })}>
                Купить
              </button>
            </div>
            <div className="certificate-card">
              <h3>Сертификат 2000₽</h3>
              <p>Подарочный сертификат на 2000 рублей</p>
              <button onClick={() => handlePurchase({ name: 'Сертификат 2000₽', amount: 2000 })}>
                Купить
              </button>
            </div>
            <div className="certificate-card">
              <h3>Сертификат 5000₽</h3>
              <p>Подарочный сертификат на 5000 рублей</p>
              <button onClick={() => handlePurchase({ name: 'Сертификат 5000₽', amount: 5000 })}>
                Купить
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
