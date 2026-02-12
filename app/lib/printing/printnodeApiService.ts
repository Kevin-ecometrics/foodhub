/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PrintData {
  orderId: string;
  tableNumber: number;
  customerCount: number;
  area: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    category_type: string;
    notes?: string;
    customerName?: string;
  }>;
  total: number;
  createdAt: string;
  waiter: string;
}

export interface Printer {
  id: number;
  name: string;
  state: string;
  computer?: string;
}

export interface PrintResult {
  success: boolean;
  message?: string;
  error?: string;
  results?: Array<{
    printer: string;
    success: boolean;
    error?: string;
  }>;
}

export class PrintNodeApiService {
  testConnection() {
    throw new Error("Method not implemented.");
  }
  private baseUrl: string;
  private PAPER_WIDTH = 46; // 58mm
  private internalApiKey: string;

  constructor() {
    this.baseUrl = '/api/print';
    this.internalApiKey = process.env.NEXT_PUBLIC_INTERNAL_API_KEY || '';
  }

  private async callApi(method: string = 'GET', body?: any): Promise<any> {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    
    if (this.internalApiKey) {
      headers['Authorization'] = `Bearer ${this.internalApiKey}`;
    }

    const response = await fetch(this.baseUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return response.json();
  }

  // ================= HELPERS =================
  private line(char = '-') {
    // FIX: Usar repetición de caracteres sin salto de línea extra
    return char.repeat(this.PAPER_WIDTH);
  }

  private center(text: string) {
    const pad = Math.floor((this.PAPER_WIDTH - text.length) / 2);
    return ' '.repeat(Math.max(0, pad)) + text;
  }

  private money(v: number) {
    return `$${v.toFixed(2)}`;
  }

  private generateFolio() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  private totalItems(items: PrintData['items']) {
    return items.reduce((s, i) => s + i.quantity, 0);
  }

  private numberToWordsMX(amount: number): string {
    const u = ['CERO','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
    const d = ['', 'DIEZ','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];

    const entero = Math.floor(amount);

    if (entero < 10)
      return u[entero];

    const dec = Math.floor(entero / 10);
    const uni = entero % 10;

    if (dec >= d.length) {
      return `${entero}`;
    }

    return `${d[dec]}${uni ? ' Y ' + u[uni] : ''}`;
  }

  // ================= TICKET FINAL =================
  private generateTicketContent(printData: PrintData, isFinalTicket: boolean = false): string {
    const folio = this.generateFolio();
    const fecha = new Date(printData.createdAt);
    const fechaStr = fecha.toLocaleDateString('es-MX');
    const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x74\x08'; // Seleccionar página de códigos 8 (Windows-1252)
    c += '\x1B\x61\x00'; // left align

    // HEADER
    c += this.center('LA MAQUILA') + '\n';
    c += this.center('ESTACION CULTURAL') + '\n';
    c += this.center('R.F.C. GADG-840229-MY6') + '\n';
    c += this.center('JUAN RUIZ DE ALARCON #1570') + '\n';
    c += this.center('ZONA URBANA RIO C.P. 22010') + '\n';
    c += '\n';

    c += this.line('=') + '\n';

    // INFO
    c += `FOLIO: ${folio}\n`;
    c += `FECHA: ${fechaStr} ${horaStr}\n`;
    c += `MESA: ${printData.tableNumber}  COMENSALES: ${printData.customerCount}\n`;
    c += `MESERO: ${printData.waiter}\n`;
    c += '\n';

    c += this.line('=') + '\n';

    // ITEMS header
    c += 'CANT DESCRIPCION                  IMPORTE\n';
    c += this.line('-') + '\n';

    // ITEMS
    printData.items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      const qty = item.quantity.toString().padStart(4, ' ');
      const name = item.name.substring(0, 25).padEnd(25, ' ');
      const total = this.money(itemTotal).padStart(12, ' ');
      c += `${qty} ${name} ${total}\n`;
      if (item.notes) {
        const note = `  - ${item.notes}`.substring(0, this.PAPER_WIDTH);
        c += note + '\n';
      }
    });

    c += this.line('-') + '\n';

    // TOTAL numeric
    const totalLabel = 'TOTAL';
    const totalAmount = this.money(printData.total);
    const left = totalLabel.padEnd(this.PAPER_WIDTH - totalAmount.length - 1, ' ');
    c += `${left} ${totalAmount}\n\n`;

    // FOOTER
    c += this.center('GRACIAS POR SU VISITA') + '\n';
    c += this.center('VUELVA PRONTO') + '\n';
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= TICKET COCINA =================
  private generateKitchenContent(printData: PrintData): string {
    const fecha = new Date(printData.createdAt);
    const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x74\x08'; // Seleccionar página de códigos 8 (Windows-1252)
    c += '\x1B\x61\x01'; // center align

    // HEADER
    // c += this.center('LA MAQUILA') + '\n';
    // c += this.center('COCINA') + '\n';
    // c += '\n';

    c += this.line('=') + '\n';

    c += '\x1B\x61\x00'; // left align
    c += `FECHA: ${fecha.toLocaleDateString('es-MX')}\n`;
    c += `HORA: ${horaStr}\n`;
    c += `MESA: ${printData.tableNumber}\n`;
    // c += `MESERO: ${printData.waiter}\n`;
    c += '\n';

    c += this.line('-') + '\n';

    c += '\x1B\x61\x01'; // center align
    c += 'COCINA\n';
    c += '\n';

    c += '\x1B\x61\x00'; // left align

    // Filtrar solo items de cocina
    const kitchenItems = printData.items.filter(item => 
      item.category_type === 'kitchen' || 
      !['bebida', 'cerveza', 'coquetos', 'bar', 'cold_bar'].some(cat => 
        item.category_type?.toLowerCase().includes(cat)
      )
    );

    if (kitchenItems.length === 0) {
      c += 'No hay productos de cocina\n';
    } else {
      kitchenItems.forEach(item => {
        c += `[${item.quantity}] ${item.name}\n`;
        if (item.notes) {
          c += `  Nota: ${item.notes}\n`;
        }
      });
    }

    c += '\n';
    c += this.line('=') + '\n';
    c += '\x1B\x61\x01'; // center align
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= TICKET BARRA FRÍA =================
  private generateColdBarContent(printData: PrintData): string {
    const fecha = new Date(printData.createdAt);
    const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x74\x08'; // Seleccionar página de códigos 8 (Windows-1252)
    c += '\x1B\x61\x01'; // center align

    // HEADER
    // c += this.center('LA MAQUILA') + '\n';
    // c += this.center('BARRA FRÍA') + '\n';
    // c += '\n';

    c += this.line('=') + '\n';

    c += '\x1B\x61\x00'; // left align
    c += `FECHA: ${fecha.toLocaleDateString('es-MX')}\n`;
    c += `HORA: ${horaStr}\n`;
    c += `MESA: ${printData.tableNumber}\n`;
    // c += `MESERO: ${printData.waiter}\n`;
    c += '\n';

    c += this.line('-') + '\n';

    c += '\x1B\x61\x01'; // center align
    c += 'BARRA FRIA\n';
    c += '\n';

    c += '\x1B\x61\x00'; // left align

    // Filtrar solo items de barra fría
    const coldBarItems = printData.items.filter(item => 
      item.category_type === 'cold_bar' ||
      ['bebida', 'cerveza', 'coquetos', 'bar', 'cold_bar'].some(cat => 
        item.category_type?.toLowerCase().includes(cat)
      )
    );

    if (coldBarItems.length === 0) {
      c += 'No hay productos de barra fría\n';
    } else {
      coldBarItems.forEach(item => {
        c += `[${item.quantity}] ${item.name}\n`;
        if (item.notes) {
          c += `  Nota: ${item.notes}\n`;
        }
      });
    }

    c += '\n';
    c += this.line('=') + '\n';
    c += '\x1B\x61\x01'; // center align
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= TICKET CON COMENSALES =================
  private generateTicketWithCustomersContent(printData: PrintData): string {
    const fecha = new Date(printData.createdAt);
    const fechaStr = fecha.toLocaleDateString('es-MX');
    const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x61\x01'; // center align

    // HEADER
    c += this.center('LA MAQUILA') + '\n';
    c += '\n';

    c += this.line('=') + '\n';

    c += '\x1B\x61\x00'; // left align
    c += `FECHA: ${fechaStr}\n`;
    c += `HORA: ${horaStr}\n`;
    c += `MESA: ${printData.tableNumber}\n`;
    c += '\n';

    c += this.line('-') + '\n';

    // Agrupar por comensal
    const groupedByCustomer: Record<string, Array<typeof printData.items[0]>> = {};
    
    printData.items.forEach(item => {
      const customerName = item.customerName || 'Cliente';
      if (!groupedByCustomer[customerName]) {
        groupedByCustomer[customerName] = [];
      }
      groupedByCustomer[customerName].push(item);
    });

    // Mostrar items por comensal
    Object.entries(groupedByCustomer).forEach(([customerName, items]) => {
      c += `[ ${customerName} ]\n`;
      
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        c += `  ${item.quantity}x ${item.name.substring(0, 20).padEnd(20, ' ')} ${this.money(itemTotal)}\n`;
        if (item.notes) {
          c += `    Nota: ${item.notes}\n`;
        }
      });
      c += '\n';
    });

    c += this.line('-') + '\n';

    // TOTAL
    const totalLabel = 'TOTAL';
    const totalAmount = this.money(printData.total);
    const left = totalLabel.padEnd(this.PAPER_WIDTH - totalAmount.length - 1, ' ');
    c += `${left} ${totalAmount}\n\n`;

    // FOOTER
    c += '\x1B\x61\x01'; // center align
    c += this.center('GRACIAS POR SU VISITA') + '\n';
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= MÉTODOS PÚBLICOS =================
  async printTicket(printData: PrintData, hasCustomerNames: boolean = false, isFinalTicket: boolean = false): Promise<PrintResult> {
    try {
      let content: string;
      
      if (isFinalTicket) {
        content = this.generateTicketContent(printData, true);
      } else if (hasCustomerNames) {
        content = this.generateTicketWithCustomersContent(printData);
      } else {
        content = this.generateTicketContent(printData, false);
      }

      return await this.callApi('POST', {
        printer: 'ticket',
        content: content,
        title: isFinalTicket ? 'Ticket Final' : 'Ticket Cliente',
        printType: isFinalTicket ? 'final-ticket' : 'ticket',
        orderData: printData,
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async printKitchenTicket(printData: PrintData): Promise<PrintResult> {
    try {
      const content = this.generateKitchenContent(printData);
      
      return await this.callApi('POST', {
        printer: 'kitchen',
        content: content,
        title: 'Cocina',
        printType: 'kitchen',
        orderData: printData,
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async printColdBarTicket(printData: PrintData): Promise<PrintResult> {
    try {
      const content = this.generateColdBarContent(printData);
      
      return await this.callApi('POST', {
        printer: 'bar',
        content: content,
        title: 'Barra Fría',
        printType: 'bar',
        orderData: printData,
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  async printAllTickets(printData: PrintData): Promise<PrintResult> {
    try {
      // Verificar si hay items para cada área
      const hasKitchenItems = printData.items.some(item => 
        item.category_type === 'kitchen' || 
        !['bebida', 'cerveza', 'coquetos', 'bar', 'cold_bar'].some(cat => 
          item.category_type?.toLowerCase().includes(cat)
        )
      );
      
      const hasColdBarItems = printData.items.some(item => 
        item.category_type === 'cold_bar' ||
        ['bebida', 'cerveza', 'coquetos', 'bar', 'cold_bar'].some(cat => 
          item.category_type?.toLowerCase().includes(cat)
        )
      );

      const hasCustomerNames = printData.items.some(
        (item) => item.customerName && item.customerName !== "Cliente",
      );

      // Enviar a todas las áreas necesarias
      const results = [];

      if (hasKitchenItems) {
        const kitchenResult = await this.printKitchenTicket(printData);
        results.push({
          printer: 'kitchen',
          ...kitchenResult
        });
      }

      if (hasColdBarItems) {
        const barResult = await this.printColdBarTicket(printData);
        results.push({
          printer: 'bar',
          ...barResult
        });
      }

      // Siempre imprimir ticket para cliente
      const ticketResult = await this.printTicket(printData, hasCustomerNames, false);
      results.push({
        printer: 'ticket',
        ...ticketResult
      });

      const allSuccess = results.every(r => r.success);
      const someSuccess = results.some(r => r.success);

      return {
        success: someSuccess,
        message: allSuccess ? 'Todas las impresiones exitosas' :
                 someSuccess ? 'Algunas impresiones exitosas' :
                 'Error en todas las impresiones',
        results: results,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

  // Verificar estado de las impresoras
  async checkPrinters(): Promise<PrintResult> {
    try {
      const result = await this.callApi('GET');
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error verificando impresoras'
      };
    }
  }
}

// ===== INSTANCIA ÚNICA =====
let instance: PrintNodeApiService | null = null;

export function getPrintNodeApiService(): PrintNodeApiService {
  if (!instance) instance = new PrintNodeApiService();
  return instance;
}