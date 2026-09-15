# Assets YAK

Coloca aquí las imágenes reales de los productos:

- griego.jpeg  (yogur griego 1L)
- mora.jpeg    (yogur mora 1L)
- mango.jpeg   (yogur mango 1L)
- fresa.jpeg   (yogur fresa 1L)
- feijoa.jpeg  (yogur feijoa 1L)
- logo.png     (logo YAK, si aplica)

Las imágenes referenciadas en `src/lib/config.ts` son:

```
productImage('griego')   → /assets/griego.jpeg
productImage('mora')     → /assets/mora.jpeg
productImage('mango')    → /assets/mango.jpeg
productImage('fresa')    → /assets/fresa.jpeg
productImage('feijoa')   → /assets/feijoa.jpeg
```

Si las imágenes aún no existen, los componentes (ProductCard, etc.) usan el
color del producto como fallback visual (sin 404 rotos). Copia las fotos y
reconstruye — no necesitas cambiar código.
