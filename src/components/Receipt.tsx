import React, { forwardRef } from 'react';
import { CartItem, SaleMetadata } from '../types';
import { generateTicketText } from '../lib/ticketGenerator';

interface ReceiptProps {
  items: CartItem[];
  metadata: SaleMetadata;
  total: number;
  givenAmount: number;
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ items, metadata, total, givenAmount }, ref) => {
    
    const ticketText = generateTicketText(items, metadata, total, givenAmount);

    return (
      <div ref={ref} className="receipt-container hidden print:block text-black bg-white">
        <style type="text/css" media="print">
          {`
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: #fff;
            }
            .receipt-container {
              width: 76mm; /* Ajustado para dar espacio a los 56 caracteres */
              margin: 0 auto;
              padding: 2mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px; /* Ajuste para que entren los 56 caracteres en el ancho */
              line-height: 1.2;
              color: #000;
              background-color: #fff;
            }
            pre {
              margin: 0;
              padding: 0;
              white-space: pre-wrap;
              word-wrap: break-word;
              overflow: hidden;
            }
            @media print {
              .print\\:block {
                display: block !important;
              }
              .hidden {
                display: none !important;
              }
            }
          `}
        </style>
        <pre>{ticketText}</pre>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';

