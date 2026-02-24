"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type City = { id: number; name: string };
type Tariff = { id: number; name: string; amount_cents: number };
type Design = { id: number; name: string };

const TELEGRAM_ID_STORAGE = "studio_certs_telegram_id";

export default function PurchasePage() {
  const [telegramId, setTelegramId] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [cityId, setCityId] = useState<number | "">("");
  const [tariffId, setTariffId] = useState<number | "">("");
  const [designId, setDesignId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [pdConsent, setPdConsent] = useState(false);

  const loadCities = useCallback(async () => {
    try {
      const res = await fetch("/api/cities");
      if (res.ok) setCities(await res.json());
    } catch {
      setError("Не удалось загрузить города");
    }
  }, []);

  const loadTariffsAndDesigns = useCallback(async (city: number) => {
    try {
      const [tRes, dRes] = await Promise.all([
        fetch(`/api/tariffs?city=${city}`),
        fetch(`/api/designs?city=${city}`),
      ]);
      if (tRes.ok) setTariffs(await tRes.json());
      if (dRes.ok) setDesigns(await dRes.json());
    } catch {
      setError("Не удалось загрузить тарифы и дизайны");
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(TELEGRAM_ID_STORAGE);
      if (stored) setTelegramId(stored);
    }
    loadCities();
  }, [loadCities]);

  useEffect(() => {
    if (cityId !== "") {
      const id = Number(cityId);
      if (!Number.isNaN(id)) {
        setTariffId("");
        setDesignId("");
        loadTariffsAndDesigns(id);
      }
    } else {
      setTariffs([]);
      setDesigns([]);
    }
  }, [cityId, loadTariffsAndDesigns]);

  const selectedTariff = tariffs.find((t) => t.id === Number(tariffId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreatedCode(null);
    const tid = telegramId.trim();
    if (!tid) {
      setError("Укажите Telegram ID");
      return;
    }
    if (cityId === "" || tariffId === "" || designId === "") {
      setError("Выберите город, тариф и дизайн");
      return;
    }
    const amount_cents = selectedTariff?.amount_cents ?? 0;
    if (amount_cents <= 0) {
      setError("Выберите тариф");
      return;
    }
    if (!pdConsent) {
      setError("Необходимо согласие на обработку персональных данных");
      return;
    }
    setLoading(true);
    try {
      // Заглушка ЮKassa: сначала "оплата", потом создание сертификата
      const payRes = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_cents,
          tariff_id: Number(tariffId),
          telegram_id: tid,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        setError(payData.error || "Ошибка оплаты");
        return;
      }
      const res = await fetch("/api/create-certificate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telegram_id: tid,
          tariff_id: Number(tariffId),
          design_id: Number(designId),
          city_id: Number(cityId),
          pd_consent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка создания сертификата");
        return;
      }
      setCreatedCode(data.code);
      if (typeof window !== "undefined") {
        localStorage.setItem(TELEGRAM_ID_STORAGE, tid);
      }
    } catch {
      setError("Сервис временно недоступен");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-semibold text-stone-800">
        Покупка сертификата
      </h1>

      {createdCode && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <p className="font-medium">Сертификат оплачен и создан</p>
          <p className="mt-1 font-mono text-lg">{createdCode}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`/api/certificate/pdf?code=${encodeURIComponent(createdCode)}`}
              download
              className="inline-block min-h-[44px] rounded-lg bg-green-600 px-4 py-2 text-white no-underline"
            >
              Скачать PDF
            </a>
            <Link
              href="/vault"
              className="inline-block min-h-[44px] rounded-lg border border-green-600 px-4 py-2 text-green-800 no-underline"
            >
              Мои сертификаты
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="telegram_id" className="block text-sm font-medium text-stone-600">
            Telegram ID
          </label>
          <input
            id="telegram_id"
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            placeholder="123456789"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900"
            minLength={1}
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-stone-600">
            Город
          </label>
          <select
            id="city"
            value={cityId === "" ? "" : String(cityId)}
            onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
          >
            <option value="">Выберите город</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="tariff" className="block text-sm font-medium text-stone-600">
            Тариф
          </label>
          <select
            id="tariff"
            value={tariffId === "" ? "" : String(tariffId)}
            onChange={(e) => setTariffId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
          >
            <option value="">Выберите тариф</option>
            {tariffs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {(t.amount_cents / 100).toFixed(0)} ₽
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="design" className="block text-sm font-medium text-stone-600">
            Дизайн
          </label>
          <select
            id="design"
            value={designId === "" ? "" : String(designId)}
            onChange={(e) => setDesignId(e.target.value ? Number(e.target.value) : "")}
            className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900"
          >
            <option value="">Выберите дизайн</option>
            {designs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <label className="mt-2 flex items-start gap-2">
          <input
            type="checkbox"
            checked={pdConsent}
            onChange={(e) => setPdConsent(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-stone-300"
          />
          <span className="text-xs text-stone-500">
            Нажимая «Оплатить», вы соглашаетесь на обработку персональных данных в соответствии с политикой конфиденциальности.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] rounded-lg bg-stone-800 px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Оплата…" : `Оплатить ${selectedTariff ? `${(selectedTariff.amount_cents / 100).toFixed(0)} ₽` : ""}`}
        </button>
      </form>

      <p className="mt-6">
        <Link href="/vault" className="text-stone-600 underline">
          Мои сертификаты
        </Link>
      </p>
    </main>
  );
}
