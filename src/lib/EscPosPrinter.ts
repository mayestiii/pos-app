import { CartItem, SaleMetadata } from '../types';

export class EscPosPrinter {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private encoder = new TextEncoder();

  // Basic ESC/POS Commands
  private readonly INIT = new Uint8Array([0x1B, 0x40]); // Initialize
  private readonly CUT = new Uint8Array([0x1D, 0x56, 0x00]); // Full cut
  private readonly ALIGN_LEFT = new Uint8Array([0x1B, 0x61, 0x00]);
  private readonly ALIGN_CENTER = new Uint8Array([0x1B, 0x61, 0x01]);
  private readonly ALIGN_RIGHT = new Uint8Array([0x1B, 0x61, 0x02]);
  private readonly BOLD_ON = new Uint8Array([0x1B, 0x45, 0x01]);
  private readonly BOLD_OFF = new Uint8Array([0x1B, 0x45, 0x00]);
  private readonly DOUBLE_HEIGHT_ON = new Uint8Array([0x1B, 0x21, 0x10]);
  private readonly DOUBLE_WIDTH_ON = new Uint8Array([0x1B, 0x21, 0x20]);
  private readonly NORMAL_TEXT = new Uint8Array([0x1B, 0x21, 0x00]);
  private readonly LF = new Uint8Array([0x0A]); // Line feed

  async connect() {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API no soportada en este navegador (usa Chrome/Edge).');
    }

    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 }); // Default for many thermal printers
      this.writer = this.port.writable?.getWriter() ?? null;
      if (!this.writer) throw new Error('No se pudo abrir el flujo de escritura.');
      return true;
    } catch (error) {
      console.error('Error conectando a impresora:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }

  private async write(data: Uint8Array | string) {
    if (!this.writer) return;
    if (typeof data === 'string') {
      // Very basic normalization for thermal printers, removing accents
      let str = data.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      await this.writer.write(this.encoder.encode(str));
    } else {
      await this.writer.write(data);
    }
  }

  // Formatting utilities
  private formatLine(left: string, right: string, width = 48) {
    const spaces = width - left.length - right.length;
    return left + (spaces > 0 ? ' '.repeat(spaces) : '') + right;
  }

  private padRight(str: string, length: number) {
    return str.length >= length ? str.substring(0, length) : str.padEnd(length, ' ');
  }

  private padLeft(str: string, length: number) {
    return str.length >= length ? str.substring(0, length) : str.padStart(length, ' ');
  }

  async printTicket(items: CartItem[], metadata: SaleMetadata, total: number, givenAmount: number) {
    if (!this.writer) throw new Error('Impresora no conectada');

    await this.write(this.INIT);
    await this.write(this.NORMAL_TEXT);

    // Utilizamos el mismo generador de texto exacto
    const { generateTicketText } = await import('./ticketGenerator');
    const ticketText = generateTicketText(items, metadata, total, givenAmount);

    // Escribir el texto línea por línea (o todo de una vez si lo soporta, pero mejor con saltos de línea explícitos)
    await this.write(ticketText + '\n');
    
    await this.write(this.LF);
    await this.write(this.LF);
    await this.write(this.LF);
    await this.write(this.LF); // Feed a few lines before cutting

    await this.write(this.CUT);
  }
}
