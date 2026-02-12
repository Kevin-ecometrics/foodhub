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

  private getCurrentDateTime() {
    const now = new Date();
    return {
      fecha: now.toLocaleDateString('es-MX'),
      hora: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      fechaHoraCompleta: now.toLocaleString('es-MX')
    };
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

  // ================= TICKET PRINCIPAL =================
  private generateTicketContent(printData: PrintData, isFinalTicket: boolean = false): string {
    const folio = this.generateFolio();
    const { fecha, hora } = this.getCurrentDateTime();

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
    c += `FECHA: ${fecha} ${hora}\n`;
    c += `MESA: ${printData.tableNumber}  COMENSALES: ${printData.customerCount}\n`;
    c += `MESERO: ${printData.waiter}\n`;
    
    if (isFinalTicket) {
      const { hora: horaReimpresion } = this.getCurrentDateTime();
      c += `*** REIMPRESION - ${horaReimpresion} ***\n`;
    }
    
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

    // TOTAL
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

  // ================= TICKET COCINA CON NOMBRE COMENSAL =================
  private generateKitchenContent(printData: PrintData): string {
    const { fecha, hora } = this.getCurrentDateTime();

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x74\x08'; // Seleccionar página de códigos 8 (Windows-1252)
    c += '\x1B\x61\x01'; // center align

    c += this.line('=') + '\n';

    c += '\x1B\x61\x00'; // left align
    c += `FECHA: ${fecha}\n`;
    c += `HORA: ${hora}\n`;
    c += `MESA: ${printData.tableNumber}\n`;
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
      // Agrupar por comensal
      const groupedByCustomer: Record<string, Array<typeof printData.items[0]>> = {};
      
      kitchenItems.forEach(item => {
        let customerName = item.customerName || 'CLIENTE';
        customerName = customerName.trim();
        if (customerName === '' || customerName.toLowerCase() === 'cliente') {
          customerName = 'CLIENTE';
        }
        
        if (!groupedByCustomer[customerName]) {
          groupedByCustomer[customerName] = [];
        }
        groupedByCustomer[customerName].push(item);
      });

      // Mostrar items agrupados por comensal
      Object.entries(groupedByCustomer).forEach(([customerName, items]) => {
        c += `[ ${customerName} ]\n`;
        items.forEach(item => {
          c += `  ${item.quantity} ${item.name}\n`;
          if (item.notes) {
            c += `    Nota: ${item.notes}\n`;
          }
        });
        c += '\n';
      });
    }

    c += this.line('=') + '\n';
    c += '\x1B\x61\x01'; // center align
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= TICKET BARRA FRÍA CON NOMBRE COMENSAL =================
  private generateColdBarContent(printData: PrintData): string {
    const { fecha, hora } = this.getCurrentDateTime();

    let c = '';
    c += '\x1B\x40'; // reset
    c += '\x1B\x74\x08'; // Seleccionar página de códigos 8 (Windows-1252)
    c += '\x1B\x61\x01'; // center align

    c += this.line('=') + '\n';

    c += '\x1B\x61\x00'; // left align
    c += `FECHA: ${fecha}\n`;
    c += `HORA: ${hora}\n`;
    c += `MESA: ${printData.tableNumber}\n`;
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
      // Agrupar por comensal
      const groupedByCustomer: Record<string, Array<typeof printData.items[0]>> = {};
      
      coldBarItems.forEach(item => {
        let customerName = item.customerName || 'CLIENTE';
        customerName = customerName.trim();
        if (customerName === '' || customerName.toLowerCase() === 'cliente') {
          customerName = 'CLIENTE';
        }
        
        if (!groupedByCustomer[customerName]) {
          groupedByCustomer[customerName] = [];
        }
        groupedByCustomer[customerName].push(item);
      });

      // Mostrar items agrupados por comensal
      Object.entries(groupedByCustomer).forEach(([customerName, items]) => {
        c += `[ ${customerName} ]\n`;
        items.forEach(item => {
          c += `  ${item.quantity} ${item.name}\n`;
          if (item.notes) {
            c += `    Nota: ${item.notes}\n`;
          }
        });
        c += '\n';
      });
    }

    c += this.line('=') + '\n';
    c += '\x1B\x61\x01'; // center align
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= TICKET FINAL CON NOMBRE COMENSAL =================
  private generateTicketWithCustomersContent(printData: PrintData, isFinalTicket: boolean = false): string {
    const folio = this.generateFolio();
    const { fecha, hora } = this.getCurrentDateTime();

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
    c += `FECHA: ${fecha} ${hora}\n`;
    c += `MESA: ${printData.tableNumber}  COMENSALES: ${printData.customerCount}\n`;
    c += `MESERO: ${printData.waiter}\n`;
    
    if (isFinalTicket) {
      const { hora: horaReimpresion } = this.getCurrentDateTime();
      c += `*** REIMPRESION - ${horaReimpresion} ***\n`;
    }
    
    c += '\n';
    c += this.line('=') + '\n';

    // Agrupar por comensal
    const groupedByCustomer: Record<string, Array<typeof printData.items[0]>> = {};
    
    printData.items.forEach(item => {
      let customerName = item.customerName || 'CLIENTE';
      customerName = customerName.trim();
      if (customerName === '' || customerName.toLowerCase() === 'cliente') {
        customerName = 'CLIENTE';
      }
      
      if (!groupedByCustomer[customerName]) {
        groupedByCustomer[customerName] = [];
      }
      groupedByCustomer[customerName].push(item);
    });

    // Mostrar items por comensal
    Object.entries(groupedByCustomer).forEach(([customerName, items]) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      c += `* ${customerName} *\n`;
      c += this.line('-') + '\n';
      
      items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        const qty = item.quantity.toString().padStart(4, ' ');
        const name = item.name.substring(0, 20).padEnd(20, ' ');
        const total = this.money(itemTotal).padStart(10, ' ');
        c += `${qty} ${name} ${total}\n`;
        if (item.notes) {
          c += `      Nota: ${item.notes}\n`;
        }
      });
      
      c += this.line('-') + '\n';
      const subtotalLabel = 'SUBTOTAL';
      const subtotalAmount = this.money(subtotal);
      const leftSubtotal = subtotalLabel.padEnd(this.PAPER_WIDTH - subtotalAmount.length - 1, ' ');
      c += `${leftSubtotal} ${subtotalAmount}\n\n`;
    });

    c += this.line('=') + '\n';

    // TOTAL GENERAL
    const totalLabel = 'TOTAL GENERAL';
    const totalAmount = this.money(printData.total);
    const leftTotal = totalLabel.padEnd(this.PAPER_WIDTH - totalAmount.length - 1, ' ');
    c += `${leftTotal} ${totalAmount}\n\n`;

    // FOOTER
    c += this.center('GRACIAS POR SU VISITA') + '\n';
    c += this.center('VUELVA PRONTO') + '\n';
    c += '\n';

    // CORTE
    c += '\x1D\x56\x00';

    return c;
  }

  // ================= MÉTODOS PÚBLICOS =================
  async printTicket(printData: PrintData, hasCustomerNames: boolean = false, isFinalTicket: boolean = false): Promise<PrintResult> {
    try {
      let content: string;
      
      if (hasCustomerNames) {
        content = this.generateTicketWithCustomersContent(printData, isFinalTicket);
      } else {
        content = this.generateTicketContent(printData, isFinalTicket);
      }

      return await this.callApi('POST', {
        printer: 'ticket',
        content: content,
        title: isFinalTicket ? '*** TICKET FINAL (REIMPRESION) ***' : 'Ticket Cliente',
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
        (item) => item.customerName && 
                 item.customerName.trim() !== "" && 
                 item.customerName.trim().toLowerCase() !== "cliente"
      );

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

      // Ticket para cliente
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

  async printFinalTicket(printData: PrintData): Promise<PrintResult> {
    try {
      const hasCustomerNames = printData.items.some(
        (item) => item.customerName && 
                 item.customerName.trim() !== "" && 
                 item.customerName.trim().toLowerCase() !== "cliente"
      );
      
      return await this.printTicket(printData, hasCustomerNames, true);
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido'
      };
    }
  }

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