# LazyFans Chat — Mobile (Expo)

Мобильная версия чата с сохранением внешнего вида веб-версии (тёмная тема, розовые акценты).

## Запуск

```bash
cd mobile
yarn install
yarn start
```

Затем отсканируй QR-код в Expo Go (Android) или камере (iOS).

## Настройка API

В `src/config.ts` заданы URL по умолчанию:

- `apiUrl`: http://localhost:3000
- `wsUrl`: http://localhost:3000

Для тестирования на физическом устройстве замени `localhost` на IP компьютера в локальной сети (например, `http://192.168.1.100:3000`).

## Структура

- `src/lib/` — auth, api, websocket, users
- `src/hooks/` — useAuth, useChat, useWebSocket
- `src/components/` — UI компоненты
- `src/screens/` — LoginScreen, ChatScreen
- `src/theme.ts` — цвета (gray-950, pink-600 и т.д.)
