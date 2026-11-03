export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto text-gray-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-[#16a273] rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">PharmaGo — Политика конфиденциальности</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">Последнее обновление: ноябрь 2026 г.</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">1. Какие данные мы собираем</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Номер телефона (для авторизации)</li>
            <li>Имя (по желанию)</li>
            <li>GPS-координаты и адрес доставки (только при оформлении заказа)</li>
            <li>История заказов</li>
            <li>Push-токен устройства (для уведомлений о статусе заказа)</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">2. Как мы используем данные</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Оформление и доставка заказов лекарств</li>
            <li>Отправка уведомлений о статусе заказа</li>
            <li>Связь по вопросам поддержки</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">3. Передача данных третьим лицам</h2>
          <p>Мы не продаём и не передаём ваши персональные данные третьим лицам, за исключением:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Водителя — получает только адрес доставки для выполнения заказа</li>
            <li>Eskiz.uz — SMS-сервис для отправки кода подтверждения</li>
            <li>Expo — платформа для push-уведомлений</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">4. Хранение данных</h2>
          <p>Данные хранятся на защищённых серверах Railway (EU) и удаляются по вашему запросу.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">5. Геолокация</h2>
          <p>Приложение запрашивает доступ к геолокации только при выборе адреса доставки. Данные о местоположении не хранятся постоянно и не передаются третьим лицам, кроме водителя (адрес доставки).</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">6. Ваши права</h2>
          <p>Вы можете запросить удаление своих данных или получить их копию, связавшись с нами.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">7. Контакты</h2>
          <p>По вопросам конфиденциальности: <a href="tel:+998930763133" className="text-[#16a273] font-medium">+998 93 076-31-33</a></p>
        </div>
      </section>
    </div>
  )
}
