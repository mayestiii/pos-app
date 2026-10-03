"use client";

import React, { useState, useRef, useEffect } from 'react';
import { mockProducts } from '../data/products';
import { CartItem, Product, SaleMetadata } from '../types';
import { Receipt } from '../components/Receipt';
import { EscPosPrinter } from '../lib/EscPosPrinter';

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [givenAmountStr, setGivenAmountStr] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSerialSupported, setIsSerialSupported] = useState(false);
  const [mounted, setMounted] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSerialSupported('serial' in navigator);
    setMounted(true);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const givenAmount = parseInt(givenAmountStr) || 0;
  const vuelto = Math.max(0, givenAmount - total);

  // We ensure date is stable or only rendered after mount
  const metadata: SaleMetadata = {
    date: new Date(),
    seller: 'CAJA 01 - SALA',
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: qty } : item)));
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const clearCart = () => {
    setCart([]);
    setGivenAmountStr('');
  };

  const handlePrintBrowser = () => {
    window.print();
    // In browser print, we don't automatically clear because user might cancel dialog.
  };

  const handlePrintSerial = async () => {
    if (cart.length === 0) return alert('El carrito está vacío');
    try {
      setIsPrinting(true);
      const printer = new EscPosPrinter();
      await printer.connect();
      await printer.printTicket(cart, metadata, total, givenAmount);
      await printer.disconnect();
      clearCart();
    } catch (err: any) {
      alert(`Error al imprimir: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (cart.length === 0) return alert('El carrito está vacío');
    try {
      const { generateTicketText } = await import('../lib/ticketGenerator');
      const ticketText = generateTicketText(cart, metadata, total, givenAmount);
      
      const blob = new Blob([ticketText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      clearCart();
    } catch (err: any) {
      alert(`Error al generar archivo: ${err.message}`);
    }
  };

  // Prevenir renderizado de servidor que causa mismatch (Hydration)
  if (!mounted) return <div className="min-h-screen bg-gray-50"></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex print:bg-white print:block">
      {/* POS UI - Hidden during browser print */}
      <div className="flex flex-1 print:hidden flex-col md:flex-row h-screen">
        
        {/* Left Side: Product Catalog */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col border-r border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">SisGen POS</h1>
              <p className="text-slate-500 font-medium">{metadata.seller} | {metadata.date.toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {mockProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between active:scale-95 group"
                >
                  <div>
                    <div className="text-xs text-slate-400 font-mono mb-1">{product.sku}</div>
                    <div className="font-semibold text-slate-700 text-sm h-10 overflow-hidden leading-snug group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </div>
                  </div>
                  <div className="mt-4 font-bold text-lg text-slate-900 bg-slate-100 p-2 rounded-lg text-center group-hover:bg-blue-50 transition-colors">
                    ${product.price.toLocaleString('es-CL')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Cart and Checkout */}
        <div className="w-full md:w-[420px] bg-white shadow-2xl flex flex-col h-full z-10">
          <div className="p-5 bg-slate-900 text-white shadow-md flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Carrito
            </h2>
            <button 
              onClick={clearCart} 
              className="text-slate-400 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1"
            >
              Vaciar
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p>Agrega productos al carrito</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {cart.map((item) => (
                  <li key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                    <div className="flex-1 overflow-hidden pr-2 flex flex-col gap-1">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateCartItem(item.id, { name: e.target.value.toUpperCase() })}
                        className="font-semibold text-slate-800 text-sm w-full bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition-colors hover:bg-slate-100 rounded-sm px-1 -ml-1"
                        placeholder="Nombre producto"
                        title="Clic para editar nombre"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500 font-mono">$</span>
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => updateCartItem(item.id, { price: parseInt(e.target.value) || 0 })}
                          className="text-xs text-slate-500 font-mono w-16 bg-transparent border-b border-transparent focus:border-blue-400 focus:outline-none transition-colors hover:bg-slate-100 rounded-sm px-1 -ml-1"
                          title="Clic para editar precio"
                        />
                        <span className="text-xs text-slate-500 font-mono">x {item.quantity}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 bg-white rounded text-slate-600 shadow-sm font-bold hover:bg-slate-50">-</button>
                      <span className="w-6 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 bg-white rounded text-slate-600 shadow-sm font-bold hover:bg-slate-50">+</button>
                    </div>
                    
                    <div className="w-20 text-right font-bold text-slate-900 ml-2 shrink-0">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Checkout Panel */}
          <div className="p-5 bg-white border-t border-slate-200">
            <div className="flex justify-between items-center mb-4 text-2xl font-black text-slate-900 bg-slate-100 p-4 rounded-xl">
              <span>TOTAL</span>
              <span>${total.toLocaleString('es-CL')}</span>
            </div>
            
            <div className="mb-5 relative">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Efectivo Recibido</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                <input
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-10 pr-4 py-3 text-right text-xl font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-slate-900 transition-all outline-none"
                  value={givenAmountStr}
                  onChange={(e) => setGivenAmountStr(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 text-lg font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <span>VUELTO</span>
              <span>${vuelto.toLocaleString('es-CL')}</span>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={handlePrintBrowser}
                disabled={cart.length === 0}
                className="bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="text-xs">Imprimir Sistema</span>
              </button>
              
              <button
                onClick={handlePrintSerial}
                disabled={cart.length === 0 || !isSerialSupported || isPrinting}
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-colors flex flex-col items-center justify-center gap-1"
                title={!isSerialSupported ? "Web Serial no soportado en este navegador" : ""}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs">{isPrinting ? "Imprimiendo..." : "Ticket Directo"}</span>
              </button>
            </div>

            <button
              onClick={handleDownloadTicket}
              disabled={cart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-colors flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Crear Boleta (.txt)
            </button>

            {!isSerialSupported && (
               <p className="text-xs text-red-500 mt-3 text-center font-medium">⚠️ Impresión directa requiere Chrome/Edge.</p>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Component - Only visible on print */}
      <Receipt ref={receiptRef} items={cart} metadata={metadata} total={total} givenAmount={givenAmount} />
    </div>
  );
}
