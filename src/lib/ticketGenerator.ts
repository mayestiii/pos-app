import { CartItem, SaleMetadata } from '../types';

export function generateTicketText(
  items: CartItem[],
  metadata: SaleMetadata,
  total: number,
  givenAmount: number
): string {
  const WIDTH = 56;
  const lines: string[] = [];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-CL');
  };

  const formatQuantity = (qty: number) => {
    return qty.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const centerText = (text: string) => {
    if (text.length >= WIDTH) return text.substring(0, WIDTH);
    const leftPad = Math.floor((WIDTH - text.length) / 2);
    return ' '.repeat(leftPad) + text + ' '.repeat(WIDTH - text.length - leftPad);
  };

  const placeLeftRight = (left: string, right: string) => {
    const spaces = WIDTH - left.length - right.length;
    if (spaces < 0) return (left + right).substring(0, WIDTH);
    return left + ' '.repeat(spaces) + right;
  };

  const buildLine = () => ' '.repeat(WIDTH);

  const placeLeft = (line: string, text: string, pos: number) => {
    let chars = line.split('');
    for (let i = 0; i < text.length && pos + i < WIDTH; i++) {
      chars[pos + i] = text[i];
    }
    return chars.join('');
  };

  const placeRight = (line: string, text: string, endPos: number) => {
    const startPos = endPos - text.length + 1;
    let chars = line.split('');
    for (let i = 0; i < text.length && startPos + i >= 0 && startPos + i < WIDTH; i++) {
      chars[startPos + i] = text[i];
    }
    return chars.join('');
  };

  // HEADER
  lines.push(centerText('DIST. DE LICORES Y BEBIDAS'));
  lines.push(centerText('EL MOLINO LTDA.'));
  lines.push(centerText('DIST. DE VINOS, LICORES, CONFITES,'));
  lines.push(centerText('ABARROTES, BEBIDAS Y BOTILLERIA'));
  lines.push(centerText('Dirección: Ariztia 256'));
  lines.push(centerText('Comuna: Quillota - Valparaíso'));
  lines.push(centerText('Teléfono: 332316901 - +56 9 5234 3838'));
  lines.push(centerText('E-mail: ventasdistribuidoraelmolino@gmail.com'));
  lines.push('');

  // META
  const dateStr = metadata.date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = metadata.date.toLocaleTimeString('es-CL', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  lines.push(placeLeftRight(`Fecha emisión: ${dateStr}`, `Hora: ${timeStr}`));
  lines.push(`Vendedor: ${metadata.seller}`);

  // TABLE HEADER
  lines.push('+' + '-'.repeat(WIDTH - 2) + '+');
  lines.push('| Cod.  Descrip        Cant.     Valor   Dscto%  Total |');
  lines.push('+' + '-'.repeat(WIDTH - 2) + '+');

  // ITEMS
  for (const item of items) {
    lines.push(item.name.toUpperCase().substring(0, WIDTH));
    let itemLine = buildLine();
    itemLine = placeLeft(itemLine, item.sku.substring(0, 10), 0);
    itemLine = placeRight(itemLine, formatQuantity(item.quantity), 27);
    itemLine = placeRight(itemLine, formatCurrency(item.price), 37);
    // dscto is empty in example
    itemLine = placeRight(itemLine, formatCurrency(item.price * item.quantity), 53);
    lines.push(itemLine);
  }
  lines.push('');

  // TOTALS
  let totalLine = buildLine();
  totalLine = placeLeft(totalLine, 'TOTAL $', 0);
  totalLine = placeRight(totalLine, formatCurrency(total), 53);
  lines.push(totalLine);
  lines.push('');

  const pagaAmount = givenAmount || total;
  let pagaLine = buildLine();
  pagaLine = placeLeft(pagaLine, 'Paga con $', 0);
  pagaLine = placeRight(pagaLine, formatCurrency(pagaAmount), 53);
  lines.push(pagaLine);

  const vueltoAmount = Math.max(0, pagaAmount - total);
  let vueltoLine = buildLine();
  vueltoLine = placeLeft(vueltoLine, 'Vuelto   $', 0);
  vueltoLine = placeRight(vueltoLine, formatCurrency(vueltoAmount), 53);
  lines.push(vueltoLine);
  lines.push('');

  const ivaAmount = Math.round(total - (total / 1.19));
  let ivaLine = buildLine();
  ivaLine = placeLeft(ivaLine, 'EL IVA DE ESTA BOLETA ES:', 0);
  ivaLine = placeRight(ivaLine, formatCurrency(ivaAmount), 53);
  lines.push(ivaLine);
  lines.push('');

  // FOOTER
  lines.push('='.repeat(WIDTH));
  lines.push(centerText('[ TIMBRE ELECTRONICO SII - PDF417 ]'));
  lines.push(centerText('Timbre Electrónico SII - Res. N° XX de 2026'));
  lines.push(centerText('Verifique documento en www.sii.cl'));
  lines.push('='.repeat(WIDTH));

  return lines.join('\n');
}
