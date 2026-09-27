'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatCircle, X } from '@phosphor-icons/react'

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '3013109200'
const WHATSAPP_URL = `https://wa.me/57${WHATSAPP_NUMBER}`

export default function WhatsAppFloatButton() {
  const [isOpen, setIsOpen] = useState(false)

  const quickMessages = [
    { text: 'Hola YAK, quiero hacer un pedido', action: 'order' },
    { text: 'Tengo una duda sobre mi pedido', action: 'support' },
    { text: 'Quiero saber zonas de entrega', action: 'zones' },
    { text: 'Hablar con un asesor', action: 'agent' },
  ]

  const handleQuickMessage = (msg: string) => {
    const url = `${WHATSAPP_URL}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full bg-emerald-600 text-white shadow-xl flex items-center justify-center hover:bg-emerald-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        aria-label={isOpen ? 'Cerrar opciones de WhatsApp' : 'Abrir WhatsApp YAK'}
        aria-expanded={isOpen}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ChatCircle width={28} height={28} weight="fill" color="currentColor" aria-hidden="true" />
      </motion.button>

      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            className="fixed bottom-6 right-6 z-[9999] w-72 bg-white rounded-2xl shadow-2xl border border-yak-griego/60 p-3"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            role="menu"
            aria-label="Opciones rápidas de WhatsApp"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-yak-navy uppercase tracking-wider">YAK Soporte</p>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-yak-muted hover:text-yak-ink hover:bg-yak-griego transition-colors"
                aria-label="Cerrar"
                whileTap={{ scale: 0.9 }}
              >
                <X width={18} height={18} weight="regular" color="currentColor" aria-hidden="true" />
              </motion.button>
            </div>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {quickMessages.map((msg, i) => (
                <motion.button
                  key={msg.action}
                  onClick={() => handleQuickMessage(msg.text)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-yak-ink hover:bg-yak-griego/50 transition-colors flex items-center gap-2"
                  role="menuitem"
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ChatCircle width={18} height={18} weight="regular" color="#6B8E5E" aria-hidden="true" />
                  <span className="truncate">{msg.text}</span>
                </motion.button>
              ))}
            </div>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors mt-2 flex items-center justify-center gap-2"
            >
              <ChatCircle width={18} height={18} weight="fill" color="currentColor" aria-hidden="true" />
              Abrir chat directo
            </a>
          </motion.div>
        </>
      )}
    </>
  )
}