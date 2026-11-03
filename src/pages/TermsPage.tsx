export function TermsPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12 max-w-2xl mx-auto text-gray-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-[#16a273] rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">P</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">PharmaGo — Условия использования</h1>
      </div>

      <p className="text-sm text-gray-500 mb-6">Последнее обновление: ноябрь 2026 г.</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="font-semibold text-gray-900 mb-2">1. О сервисе</h2>
          <p>PharmaGo — платформа для доставки безрецептурных лекарств из аптеки PINTOK XK на дом. Сервис работает в г. Шымбай (Каракалпакстан, Узбекистан).</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">2. Только безрецептурные препараты</h2>
          <p>Через приложение можно заказать только безрецептурные (OTC) лекарства. Рецептурные препараты не отпускаются через данный сервис.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">3. Оплата</h2>
          <p>Оплата производится наличными при получении заказа. Платёжные данные карт в приложении не хранятся.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">4. Отмена и возврат</h2>
          <p>После подтверждения заказа отмена возможна только по звонку в аптеку до начала сборки. После передачи водителю заказ не может быть отменён через приложение.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">5. Наличие лекарств</h2>
          <p>Информация о наличии препаратов носит справочный характер и актуальна на момент последней синхронизации с системой учёта аптеки. Окончательное наличие подтверждается фармацевтом.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">6. Ответственность</h2>
          <p>PharmaGo является платформой-посредником. Ответственность за качество и соответствие лекарств несёт аптека PINTOK XK, имеющая соответствующую лицензию.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">7. Возраст пользователей</h2>
          <p>Сервис предназначен для лиц старше 18 лет. Регистрируясь, вы подтверждаете, что вам исполнилось 18 лет.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-900 mb-2">8. Контакты</h2>
          <p>По вопросам: <a href="tel:+998930763133" className="text-[#16a273] font-medium">+998 93 076-31-33</a></p>
        </div>
      </section>
    </div>
  )
}
