# YAK Yogurt E-Commerce Platform — Project Status

**Última verificación:** 2026-09-13
**Estado:** ~90% funcional. Falta configurar secretos reales, assets, polish y deploy.

---

## ✅ COMPLETADO (verificado en código)

### Delivery Engine
- `src/lib/delivery-engine.ts` — cutoff = 2 días antes de la entrega, 14:00 límite pedido, 23:59 límite reporte de pago
- `src/lib/__tests__/delivery-engine.test.ts` — **30/30 tests PASS** ✅

### Configuración Centralizada
- `src/lib/config.ts` — FUENTE DE VERDAD:
  - 5 productos (Griego $25.000, Mora/Fresa/Feijoa/Mango $19.000)
  - 6 zonas con costos de domicilio, 6 rutas (LUNES-SÁBADO)
  - `getDeliveryCost()` — gratis si ≥3 unidades
  - `ORDER_STATUSES` — máquina de estados

### Order Service (Backend)
- `src/lib/order-service.ts` — lógica de negocio completa:
  - `createOrder()`, `reportPayment()`, `confirmPayment()`, `rejectPayment()`, `advanceStatus()`
  - Máquina de estados estricta + idempotencia (duplicados de Telegram manejados)
  - **Google Sheets ELIMINADO** — los pedidos se reportan por el resumen diario de Telegram

### Persistencia
- `src/lib/json-store.ts` — pedidos en archivo JSON (`data/orders.json`) con escritura atómica y lock de proceso. Sin base de datos.
- En Render el disco persistente se monta en `/data` (auto-detectado).

### Telegram
- `src/lib/telegram.ts` — COMPLETA:
  - `sendPaymentNotification()` — botones inline CONFIRMAR/RECHAZAR
  - `sendPaymentConfirmed()` — confirmación + botón wa.me
  - `sendPaymentRejected()`
  - **`sendDailySummary()` + `buildDailySummary()`** — resumen de pedidos agrupados por estado (NUEVO)
  - `generateWhatsAppLink()` — usa teléfono del **cliente**

### API Routes
| Endpoint | Estado |
|----------|--------|
| `POST /api/orders` | ✅ crea + persiste en JSON (json-store), recalcula todo |
| `GET /api/orders` | ✅ lista últimos 50 |
| `POST /api/orders/report-payment` | ✅ llama `reportPayment()` |
| `POST /api/telegram` | ✅ **webhook CONECTADO** a `confirmPayment()`/`rejectPayment()` |
| `GET /api/cron/daily-summary` | ✅ **resumen diario → Telegram (NUEVO)** |

### Cron Resumen Diario (NUEVO)
- **Endpoint:** `/api/cron/daily-summary` — consulta pedidos activos (excluye entregados/rechazados/cancelados/vencidos), los agrupa por estado y envía a Telegram
- **Schedule:** `vercel.json` → `0 23 * * *` = **23:00 UTC = 6pm hora Colombia** (UTC-5), todos los días
- **Protección:** header `Authorization: Bearer <CRON_SECRET>` (si `CRON_SECRET` está definido en el entorno)
- Formato del mensaje: `📋 RESUMEN DE PEDIDOS` con grupos por estado, detalle por pedido y totales

### UI Components
| Componente | Estado |
|------------|--------|
| Hero | ✅ parallax CSS con colores yogur |
| ProductCard | ✅ next/image + fallback emoji/color |
| ProductGrid | ✅ grid + carta "Domicilio gratis 3+" |
| Cart + CartContext | ✅ state management completo |
| CheckoutFlow (3 pasos) | ✅ |
| DeliveryForm | ✅ predicción fecha + validaciones |
| OrderSummary | ✅ |
| **PaymentInfo** | ✅ **"Paga a esta llave de Bre-B"** (usa `NEXT_PUBLIC_PAYMENT_ACCOUNT`) |
| StepIndicator | ✅ |

### Pago por transferencia
- Label actualizado a **"Paga a esta llave de Bre-B"** + botón copiar
- La llave se lee de `NEXT_PUBLIC_PAYMENT_ACCOUNT`

### Landing + Infraestructura
- Landing completa (Hero, Productos, ¿Cómo pedir?, Zonas, Checkout, Footer) + `<CartProvider>`
- Build: **fix TS aplicado** (order-service.ts ya no castea `OrderDoc`), pendiente verificación final

---

## ⚠️ PENDIENTE REAL (trabajo que falta)

### 1. 🔴 Completar `.env` — faltan 2 variables (bloqueante para el flujo de pagos)
- **YA configuradas:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_PAYMENT_ACCOUNT` (llave Bre-B), `NEXT_PUBLIC_WHATSAPP_NUMBER`
- **OPCIONAL:** `CRON_SECRET` (protege `/api/cron/daily-summary` en producción)
- Sin `TELEGRAM_CHAT_ID` el bot no sabe a dónde enviar las notificaciones ni el resumen diario.
- `.gitignore` ya excluye `.env` (seguridad)

### 2. 🟡 Assets reales
- `public/assets/` solo tiene `README.md`; las fotos `.jpeg` no están colocadas
- ProductCard usa fallback emoji/color (no se rompe, pero no muestra fotos)

### 3. 🟡 GSAP/ScrollTrigger no implementado
- `gsap` instalado pero no usado; Hero usa parallax CSS básico
- Falta: ScrollTrigger reveal animations, parallax real, microinteracciones

### 4. 🟡 Tests solo de delivery engine
- Solo 30 tests; faltan de API routes, order-service, componentes, cron

### 5. 🟢 Mobile QA y performance
- No verificado en mobile real; sin medición de performance

### 6. 🟢 Deploy
- Falta: configurar env vars en producción, deploy a Vercel (el cron de Vercel requiere plan que lo soporte)

---

## 📁 ESTRUCTURA REAL DEL PROYECTO

```
src/
├── app/
│   ├── api/
│   │   ├── orders/route.ts              ← create + list (JSON)
│   │   ├── orders/report-payment/route.ts  ← reportPayment()
│   │   ├── telegram/route.ts            ← webhook conectado a order-service
│   │   └── cron/daily-summary/route.ts  ← resumen diario → Telegram
│   ├── globals.css
│   ├── layout.tsx                       ← <CartProvider>
│   └── page.tsx                         ← landing + checkout
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
│   ├── order-service.ts                 ← lógica negocio (sheets eliminado)
│   ├── telegram.ts                      ← bot + wa.me + resumen diario
│   └── cart-context.tsx
├── __tests__/delivery-engine.test.ts
public/assets/                           ← vacío (README guía)
vercel.json                              ← cron 6pm diario (0 23 * * *)
```

---

## 🔐 Variables de Entorno

```bash
# Telegram (notificaciones + resumen diario)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Cron resumen diario (protege /api/cron/daily-summary)
CRON_SECRET=

# Pago — llave Bre-B que se muestra al cliente
NEXT_PUBLIC_PAYMENT_ACCOUNT=

# WhatsApp footer
NEXT_PUBLIC_WHATSAPP_NUMBER=3006539429
```

---

## 🎯 Criterios de Aceptación

- [x] Motor de fechas 100% correcto (30/30 tests)
- [x] Backend recalcula precios/delivery/total (nunca confía en frontend)
- [x] Carrito y checkout flow (3 pasos)
- [x] Order service con máquina de estados estricta + idempotencia
- [x] Telegram lib completa (notificación + confirmación + rechazo + wa.me)
- [x] **Webhook de Telegram conectado** a `confirmPayment()`/`rejectPayment()`
- [x] **Resumen diario de pedidos → Telegram a las 6pm** (cron + endpoint)
- [x] **PaymentInfo muestra "Paga a esta llave de Bre-B"**
- [x] **Google Sheets ELIMINADO**
- [x] **Build compila** (fix TS aplicado)
- [ ] Secretos configurados en `.env` (token Telegram, llave Bre-B)
- [ ] Flujo de pago probado end-to-end (pedido → reporte → confirmación en Telegram → resumen diario)
- [ ] Assets fotos reales
- [ ] GSAP/ScrollTrigger
- [ ] Mobile responsive + performance
- [ ] Tests adicionales

---

**Resumen:** El código del negocio está completo. Falta: llenar los secretos reales, colocar fotos, y polish (GSAP, mobile, tests). El flujo de pagos quedó funcional de código.

*Verificado directamente contra el filesystem. Este documento es la fuente de verdad.*