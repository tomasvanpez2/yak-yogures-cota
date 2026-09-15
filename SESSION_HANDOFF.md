# YAK Yogurt Platform — Sesión Handoff

**Fecha:** 2026-09-13
**Branch:** master

---

## ✅ CAMBIOS DE ESTA SESIÓN

### 1. Google Sheets ELIMINADO 🗑️
- `src/lib/sheets.ts` **eliminado** del proyecto
- `order-service.ts`: quitadas las llamadas a `addToGoogleSheets()`/`getSheetsConfig()` y el import
- `.env` y `.env.example`: quitadas `GOOGLE_SHEETS_ID` y `GOOGLE_API_KEY`

### 2. Resumen diario a Telegram (6pm) — NUEVO 📋
- **Endpoint:** `src/app/api/cron/daily-summary/route.ts`
  - Consulta pedidos activos de `json-store.ts` (excluye DELIVERED, PAYMENT_REJECTED, CANCELLED, EXPIRED)
  - Los agrupa por estado y envía a Telegram
  - Protegido con `Authorization: Bearer <CRON_SECRET>` (opcional en dev)
- **Schedule:** `vercel.json` → `"0 23 * * *"` = 23:00 UTC = **6pm hora Colombia** (UTC-5) todos los días
- **Funciones:** `sendDailySummary()` + `buildDailySummary()` en `src/lib/telegram.ts`
  - Formato: grupos por estado (🔴 POR VERIFICAR, 🟡 PENDIENTES, 🟢 CONFIRMADOS...), detalle por pedido (id, cliente, productos, total, zona, día), totales al final

### 3. Pago → llave Bre-B 💰
- `PaymentInfo.tsx`: label cambiado a **"Paga a esta llave de Bre-B"**
- La llave sale de `NEXT_PUBLIC_PAYMENT_ACCOUNT` (con botón copiar)

### 4. Webhook de Telegram CONECTADO 🔌
- `src/app/api/telegram/route.ts` reescrito — ya NO es stub
- Ahora delega en `confirmPayment(orderId, 'TELEGRAM')` / `rejectPayment(orderId)` de `order-service.ts`
- Acuse al chat del admin + responde 200 a Telegram

### 5. Fix build (TS2345) 🔧
- `order-service.ts`: `type OrderDoc = Order & { _id?: unknown }` → `type OrderDoc = Order`, quitado el cast en `insertOne`
- Antes: `npm run build` fallaba. Verificar que ahora pasa.

### 6. Seguridad env 💣
- `.gitignore`: ahora excluye `.env` (además de `.env*.local`)

---

## ❌ PENDIENTE REAL (trabajo que falta)

### 1. 🔴 Completar `.env` — faltan 2 variables (bloqueante para negocio)
**YA configuradas:** `TELEGRAM_BOT_TOKEN`, `NEXT_PUBLIC_PAYMENT_ACCOUNT` (llave Bre-B), `NEXT_PUBLIC_WHATSAPP_NUMBER`.

**FALTA SOLO:** `TELEGRAM_CHAT_ID` (se obtiene con @userinfobot o @RawDataBot).
`CRON_SECRET` es opcional (solo protege el endpoint del resumen diario en producción).

### 2. 🟡 Probar flujo end-to-end (requiere secretos)
1. Crear pedido en la web
2. Click "YA REALICÉ EL PAGO" → notificación llega a Telegram (botones confirmar/rechazar)
3. Admin confirma en Telegram → cliente recibe pago confirmado + botón wa.me
4. 6pm → resumen diario llega a Telegram

### 3. 🟡 Assets fotos reales
Copiar a `public/assets/`: `griego.jpeg`, `mora.jpeg`, `mango.jpeg`, `fresa.jpeg`, `feijoa.jpeg`

### 4. 🟡 GSAP/ScrollTrigger
- `gsap` instalado pero no usado. Falta: ScrollTrigger, parallax, reveal animations

### 5. 🟡 Tests adicionales
- Solo 30 tests de delivery engine. Faltan: API routes, order-service, cron, componentes

### 6. 🟢 Mobile QA y performance
### 7. 🟢 Deploy a Vercel (incluye activar Cron — requiere plan que lo soporte)

---

## 📁 ESTRUCTURA REAL DEL PROYECTO

```
src/
├── app/
│   ├── api/
│   │   ├── orders/route.ts              ← create + list (JSON)
│   │   ├── orders/report-payment/route.ts  ← reportPayment()
│   │   ├── telegram/route.ts            ← ✅ webhook conectado
│   │   └── cron/daily-summary/route.ts  ← ✅ resumen diario → Telegram
│   ├── globals.css
│   ├── layout.tsx                       ← <CartProvider>
│   └── page.tsx                         ← landing completa
├── components/
│   ├── cart/Cart.tsx
│   ├── checkout/{CheckoutFlow,DeliveryForm,OrderSummary,PaymentInfo}.tsx
│   ├── common/StepIndicator.tsx
│   ├── hero/Hero.tsx
│   └── products/{ProductCard,ProductGrid}.tsx
├── lib/
│   ├── config.ts                        ← FUENTE DE VERDAD
│   ├── delivery-engine.ts               ← 30 tests ✅
│   ├── json-store.ts                    ← persistencia JSON local
│   ├── order.ts                         ← tipos + validaciones
│   ├── order-service.ts                 ← lógica negocio
│   ├── telegram.ts                      ← bot + wa.me + resumen diario
│   └── cart-context.tsx
public/assets/                           ← vacío (README guía)
vercel.json                              ← cron 6pm (0 23 * * *)
```

---

## 🔐 Variables de Entorno

```bash
# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Cron (protege /api/cron/daily-summary)
CRON_SECRET=

# Pago — llave Bre-B
NEXT_PUBLIC_PAYMENT_ACCOUNT=

# WhatsApp footer
NEXT_PUBLIC_WHATSAPP_NUMBER=3006539429
```

---

## COMANDOS ÚTILES

```bash
npm run dev          # Dev
npx vitest run       # Tests (30 delivery engine)
npx tsc --noEmit     # Typecheck
npm run build        # Build (fix TS aplicado — verificar)
npm run lint         # Lint
```

---

## PROBAR EL RESUMEN DIARIO MANUALMENTE

Sin esperar al cron, puede probarse localmente:

```bash
# Con curl (si CRON_SECRET está vacío no requiere header)
curl "http://localhost:3000/api/cron/daily-summary"

# Si CRON_SECRET está configurado:
curl -H "Authorization: Bearer <CRON_SECRET>" "http://localhost:3000/api/cron/daily-summary"
```

---

*El filesystem es la fuente de verdad. Estado verificado 2026-09-13.*