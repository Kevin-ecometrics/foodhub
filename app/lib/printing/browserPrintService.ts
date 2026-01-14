/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

export interface PrintItem {
  name: string;
  quantity: number;
  price: number;
  category_type: 'kitchen' | 'cold_bar';
  notes?: string;
}

export interface OrderDataForPrinting {
  orderId: string;
  tableNumber: number;
  customerCount: number;
  area: string;
  items: PrintItem[];
  total: number;
  createdAt: string;
  waiter?: string;
  eatHere?: boolean;
  orderType?: 'dine_in' | 'take_away';
}

class BrowserPrintService {
  
  private categoryMapping: Record<string, 'kitchen' | 'cold_bar'> = {
    'Bebidas': 'cold_bar',
    'Cerveza': 'cold_bar',
    'Cerveza Artesanal': 'cold_bar',
    'Coquetos': 'cold_bar',
    'Coquetos Clásicos': 'cold_bar',
    'Entradas': 'kitchen',
    'Los Favoritos': 'kitchen',
    'Burritos': 'kitchen',
    'Burgers': 'kitchen',
    'Fuertes': 'kitchen',
    'Pizza': 'kitchen',
    'Jumbos': 'kitchen',
  };

  private formatDateTime(dateString: string): { date: string, time: string } {
    const date = new Date(dateString);
    
    // Formato específico para impresora térmica
    const formattedDate = date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const formattedTime = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
    
    return { date: formattedDate, time: formattedTime };
  }

  private groupItems(items: PrintItem[]): Array<{name: string, quantity: number, notes?: string}> {
    const grouped: Record<string, {quantity: number, notes?: string}> = {};
    
    items.forEach(item => {
      if (grouped[item.name]) {
        grouped[item.name].quantity += item.quantity;
        if (item.notes && grouped[item.name].notes !== item.notes) {
          if (grouped[item.name].notes) {
            grouped[item.name].notes += `, ${item.notes}`;
          } else {
            grouped[item.name].notes = item.notes;
          }
        }
      } else {
        grouped[item.name] = {
          quantity: item.quantity,
          notes: item.notes
        };
      }
    });
    
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      quantity: data.quantity,
      notes: data.notes
    }));
  }

  async printRestaurantTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateRestaurantTicket(orderData);
    return this.printInBrowser(content, `Ticket-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printCustomTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateCustomTicket(orderData);
    return this.printInBrowser(content, `Ticket-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printAllTickets(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateAllTickets(orderData);
    return this.printInBrowser(content, `Pedido-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printKitchenTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const kitchenItems = orderData.items.filter(item => item.category_type === 'kitchen');
    
    if (kitchenItems.length === 0) {
      alert('No hay productos para cocina en este pedido');
      return false;
    }

    const content = this.generateKitchenTicket(orderData, kitchenItems);
    return this.printInBrowser(content, `Cocina-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printColdBarTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const coldBarItems = orderData.items.filter(item => item.category_type === 'cold_bar');
    
    if (coldBarItems.length === 0) {
      alert('No hay productos para barra fría en este pedido');
      return false;
    }

    const content = this.generateColdBarTicket(orderData, coldBarItems);
    return this.printInBrowser(content, `Barra-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateTicket(orderData);
    return this.printInBrowser(content, `Ticket-${orderData.orderId}`, orderData.tableNumber);
  }

  async printFinalTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateFinalTicket(orderData);
    return this.printInBrowser(content, `Ticket-Final-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  async printComensalTicket(orderData: OrderDataForPrinting): Promise<boolean> {
    const content = this.generateComensalTicket(orderData);
    return this.printInBrowser(content, `Comensal-Mesa-${orderData.tableNumber}`, orderData.tableNumber);
  }

  determineCategoryType(categoryName: string): 'kitchen' | 'cold_bar' {
    const normalizedCategory = categoryName.trim().toLowerCase();
    
    const categoryMapping: Record<string, 'kitchen' | 'cold_bar'> = {
      'bebidas': 'cold_bar',
      'cerveza': 'cold_bar',
      'cerveza artesanal': 'cold_bar',
      'coquetos': 'cold_bar',
      'coquetos clásicos': 'cold_bar',
      'entradas': 'kitchen',
      'los favoritos': 'kitchen',
      'burritos': 'kitchen',
      'burgers': 'kitchen',
      'fuertes': 'kitchen',
      'pizza': 'kitchen',
      'jumbos': 'kitchen',
    };
    
    return categoryMapping[normalizedCategory] || 'kitchen';
  }

  private async printInBrowser(content: string, title: string, tableNumber: number): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert('Permite ventanas emergentes para imprimir');
          resolve(false);
          return;
        }

        // Configuración específica para impresora HCUBE-102D (58mm)
        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <meta charset="UTF-8">
              <style>
                /* Configuración para impresora térmica HCUBE-102D de 58mm */
                @media print {
                  @page {
                    size: 58mm auto; /* Ancho específico para HCUBE-102D */
                    margin: 0;
                    margin-top: 5mm;
                    margin-bottom: 5mm;
                  }
                  body {
                    width: 58mm !important;
                    margin: 0 auto !important;
                    padding: 0 3mm !important;
                    font-family: 'Courier New', monospace !important;
                    font-size: 11px !important; /* Tamaño reducido para 58mm */
                    line-height: 1.2 !important;
                    background: white !important;
                    text-align: left !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  br {
                    display: block;
                    content: "";
                    margin-top: 2px;
                  }
                }
                
                @media screen {
                  body {
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    background: #f5f5f5;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                  }
                  .ticket-preview {
                    width: 58mm;
                    min-height: 100mm;
                    background: white;
                    padding: 5mm 3mm;
                    margin: 0 auto;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border: 1px solid #ddd;
                    text-align: left;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    line-height: 1.2;
                  }
                }
                
                .ticket-content {
                  white-space: pre-wrap;
                  line-height: 1.2;
                  text-align: left;
                  font-family: 'Courier New', monospace;
                  width: 100%;
                  display: block;
                  word-break: break-word;
                }
                
                .controls {
                  margin-top: 20px;
                  text-align: center;
                  padding: 20px;
                }
                
                button {
                  background: #3b82f6;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  font-size: 14px;
                  cursor: pointer;
                  margin: 5px;
                }
                
                button:hover {
                  background: #2563eb;
                }
                
                button.secondary {
                  background: #6b7280;
                }
                
                button.secondary:hover {
                  background: #4b5563;
                }
                
                /* Ajustes para impresión térmica */
                .line-separator {
                  text-align: center;
                  letter-spacing: 2px;
                }
              </style>
            </head>
            <body>
              <div class="ticket-preview">
                <div class="ticket-content">
                  ${content.replace(/\n/g, '<br>')}
                </div>
              </div>
              
              <div class="controls no-print">
                <button onclick="window.print()">
                  🖨️ Imprimir
                </button>
                
                <button onclick="window.close()" class="secondary">
                  Cerrar ventana
                </button>
                
              </div>
              
              <script>
                window.focus();
                
                // Auto-impresión después de 1 segundo (opcional)
                setTimeout(() => {
                  const urlParams = new URLSearchParams(window.location.search);
                  if (urlParams.get('autoPrint') === 'true') {
                    window.print();
                  }
                }, 1000);
                
                window.addEventListener('afterprint', () => {
                  setTimeout(() => {
                    if (confirm('¿Cerrar ventana de impresión?')) {
                      window.close();
                    }
                  }, 500);
                });
              </script>
            </body>
          </html>
        `;

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        resolve(true);
      } catch (error) {
        console.error('Error:', error);
        alert('Error al generar el ticket');
        resolve(false);
      }
    });
  }

  private generateRestaurantTicket(orderData: OrderDataForPrinting): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    
    // Encabezado con fecha y hora en líneas separadas
        ticket += `           LA MAQUILA\n`;
    ticket += `______\n\n`;
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n\n`;
    ticket += `______\n\n`;
    
    // Nombre del restaurante
    const restaurantName = orderData.area || 'LA MAQUILA';
    ticket += `${restaurantName}\n\n`;
    ticket += `______\n\n`;
    
    // Información de la mesa
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    ticket += `Personas: ${orderData.customerCount}\n`;
    ticket += `Mesero: ${orderData.waiter || 'Sistema'}\n\n`;
    ticket += `______\n\n`;
    
    // Productos con precios (formato ajustado para 58mm)
    const maxNameLength = 18; // Reducido para 58mm
    
    orderData.items.forEach(item => {
      const itemTotal = item.quantity * item.price;
      const nameDisplay = item.name.length > maxNameLength 
        ? item.name.substring(0, maxNameLength - 3) + '...' 
        : item.name;
      
      const quantityDisplay = `${item.quantity}x`;
      const nameWithSpaces = nameDisplay.padEnd(maxNameLength);
      const totalDisplay = `$${itemTotal.toFixed(2)}`;
      
      ticket += `${quantityDisplay} ${nameWithSpaces} ${totalDisplay}\n`;
    });
    
    ticket += `\n______\n\n`;
    ticket += `TOTAL: $${orderData.total.toFixed(2)}\n\n`;
    ticket += `______\n\n`;
    ticket += `GRACIAS POR SU VISITA\n\n`;
    ticket += `______\n`;
    
    return ticket;
  }

  private generateFinalTicket(orderData: OrderDataForPrinting): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    
    // FECHA y HORA en líneas separadas claramente
    
    ticket += `           LA MAQUILA\n`;
    ticket += `______\n\n`;
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n`;
    // ticket += `______\n\n`;
    
    // ticket += `LA MAQUILA\n\n`;
    // ticket += `______\n\n`;
    
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    // ticket += `Personas: ${orderData.customerCount}\n`;
    ticket += `Mesero: ${orderData.waiter || 'Sistema'}\n`;
    ticket += `______\n\n`;
    
    // Productos con formato ajustado para impresora térmica
    const maxNameLength = 16; // Más corto para 58mm
    const maxPriceLength = 8;
    
    orderData.items.forEach(item => {
      const itemTotal = item.quantity * item.price;
      const nameDisplay = item.name.length > maxNameLength 
        ? item.name.substring(0, maxNameLength - 3) + '...' 
        : item.name;
      
      const quantityDisplay = `${item.quantity}x`;
      const nameWithSpaces = nameDisplay.padEnd(maxNameLength);
      const totalDisplay = `$${itemTotal.toFixed(2)}`.padStart(maxPriceLength);
      
      ticket += `${quantityDisplay} ${nameWithSpaces} ${totalDisplay}\n`;
    });
    
    ticket += `\n______\n\n`;
    ticket += `TOTAL: $${orderData.total.toFixed(2)}\n`;
    ticket += `______\n\n`;
    ticket += `GRACIAS POR SU VISITA\n`;
    ticket += `______\n`;
    
    return ticket;
  }

  private generateKitchenTicket(orderData: OrderDataForPrinting, kitchenItems: PrintItem[]): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    const groupedItems = this.groupItems(kitchenItems);
        ticket += `           LA MAQUILA\n`;
    ticket += `______\n\n`;
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    // ticket += `Personas: ${orderData.customerCount}\n`;
    if (orderData.waiter) {
      ticket += `Mesero: ${orderData.waiter}\n`;
    }
    // ticket += `Pedido #: ${orderData.orderId}\n\n`;
    ticket += `______\n\n`;
    
    if (orderData.orderType === 'take_away') {
      ticket += `PARA LLEVAR\n\n`;
    } else if (orderData.eatHere !== false) {
      ticket += `COMER AQUÍ\n\n`;
    }
    
    ticket += `______\n\n`;
    
    groupedItems.forEach(item => {
      ticket += `[${item.quantity}x] ${item.name}\n`;
      if (item.notes) {
        ticket += `   Notas: ${item.notes}\n`;
      }
    });
    
    ticket += `\n______\n\n`;
    // ticket += `Total Items: ${kitchenItems.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    
    if (kitchenItems.some(item => item.notes)) {
      ticket += `\n⚠️ Notas especiales\n`;
    }
    
    // ticket += `\n______\n\n`;
    // ticket += `LISTO PARA COCINAR\n\n`;
    // ticket += `______\n`;
    
    return ticket;
  }

  private generateColdBarTicket(orderData: OrderDataForPrinting, coldBarItems: PrintItem[]): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    const groupedItems = this.groupItems(coldBarItems);
    
        ticket += `           LA MAQUILA\n`;
    ticket += `______\n\n`;
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    ticket += `______\n\n`;
    ticket += `BARRA FRÍA\n\n`;
    ticket += `______\n\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    // ticket += `Personas: ${orderData.customerCount}\n`;
    if (orderData.waiter) {
      ticket += `Mesero: ${orderData.waiter}\n`;
    }
    // ticket += `Pedido #: ${orderData.orderId}\n\n`;
    ticket += `______\n\n`;
    
    if (orderData.orderType === 'take_away') {
      ticket += `PARA LLEVAR\n\n`;
    } else if (orderData.eatHere !== false) {
      ticket += `COMER AQUÍ\n\n`;
    }
    
    ticket += `______\n\n`;
    
    groupedItems.forEach(item => {
      ticket += `[${item.quantity}x] ${item.name}\n`;
      if (item.notes) {
        ticket += `   Notas: ${item.notes}\n`;
      }
    });
    
    ticket += `\n______\n\n`;
    // ticket += `Total Items: ${coldBarItems.reduce((sum, item) => sum + item.quantity, 0)}\n`;
    
    if (coldBarItems.some(item => item.notes)) {
      ticket += `\n⚠️ Notas especiales\n`;
    }
    
    // ticket += `\n______\n\n`;
    // ticket += `LISTO PARA PREPARAR\n\n`;
    // ticket += `______\n`;
    
    return ticket;
  }

  private generateCustomTicket(orderData: OrderDataForPrinting): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    const groupedItems = this.groupItems(orderData.items);
    
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n\n`;
    
    if (orderData.orderType === 'take_away') {
      ticket += `PARA LLEVAR\n\n`;
    } else if (orderData.eatHere !== false) {
      ticket += `COMER AQUI\n\n`;
    }
    
    groupedItems.forEach(item => {
      ticket += `${item.quantity} ${item.name}\n`;
    });
    
    ticket += `\n\n`;
    
    return ticket;
  }

  private generateComensalTicket(orderData: OrderDataForPrinting): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    const groupedItems = this.groupItems(orderData.items);
    
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n\n`;
    ticket += `______\n\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    if (orderData.customerCount > 0) {
      ticket += `Personas: ${orderData.customerCount}\n`;
    }
    ticket += `\n`;
    
    if (orderData.orderType === 'take_away') {
      ticket += `PARA LLEVAR\n\n`;
    } else {
      ticket += `COMER AQUI\n\n`;
    }
    
    ticket += `______\n\n`;
    
    groupedItems.forEach(item => {
      ticket += `${item.quantity} ${item.name}\n`;
      if (item.notes) {
        ticket += `   (${item.notes})\n`;
      }
    });
    
    ticket += `\n______\n\n`;
    ticket += `Total: $${orderData.total.toFixed(2)}\n\n`;
    ticket += `______\n\n`;
    ticket += `GRACIAS POR SU VISITA\n\n`;
    ticket += `______\n`;
    
    return ticket;
  }

  private generateAllTickets(orderData: OrderDataForPrinting): string {
    const kitchenItems = orderData.items.filter(item => item.category_type === 'kitchen');
    const coldBarItems = orderData.items.filter(item => item.category_type === 'cold_bar');
    const { date, time } = this.formatDateTime(orderData.createdAt);
    
    let ticket = '';
    
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n\n`;
    ticket += `______\n\n`;
    
    if (kitchenItems.length > 0) {
      ticket += `COCINA\n\n`;
      ticket += `______\n\n`;
      ticket += `Mesa: ${orderData.tableNumber}\n`;
      ticket += `Personas: ${orderData.customerCount}\n`;
      if (orderData.waiter) {
        ticket += `Mesero: ${orderData.waiter}\n`;
      }
      ticket += `______\n\n`;
      
      this.groupItems(kitchenItems).forEach(item => {
        ticket += `[${item.quantity}x] ${item.name}\n`;
        if (item.notes) {
          ticket += `   Notas: ${item.notes}\n`;
        }
      });
      
      ticket += `\n______\n\n\n`;
    }
    
    if (coldBarItems.length > 0) {
      ticket += `BARRA FRÍA\n\n`;
      ticket += `______\n\n`;
      ticket += `Mesa: ${orderData.tableNumber}\n`;
      if (orderData.waiter) {
        ticket += `Mesero: ${orderData.waiter}\n`;
      }
      ticket += `______\n\n`;
      
      this.groupItems(coldBarItems).forEach(item => {
        ticket += `[${item.quantity}x] ${item.name}\n`;
        if (item.notes) {
          ticket += `   Notas: ${item.notes}\n`;
        }
      });
      
      ticket += `\n______\n\n\n`;
    }
    
    ticket += `TICKET DE VENTA\n\n`;
    ticket += `______\n\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    ticket += `Personas: ${orderData.customerCount}\n`;
    if (orderData.waiter) {
      ticket += `Mesero: ${orderData.waiter}\n`;
    }
    ticket += `______\n\n`;
    
    // Formato ajustado para 58mm
    const maxNameLength = 16;
    const maxPriceLength = 8;
    
    orderData.items.forEach(item => {
      const total = item.quantity * item.price;
      const nameDisplay = item.name.length > maxNameLength 
        ? item.name.substring(0, maxNameLength - 3) + '...' 
        : item.name;
      
      const nameWithSpaces = nameDisplay.padEnd(maxNameLength);
      const totalDisplay = `$${total.toFixed(2)}`.padStart(maxPriceLength);
      
      ticket += `${item.quantity}x ${nameWithSpaces} ${totalDisplay}\n`;
    });
    
    ticket += `\n______\n\n`;
    ticket += `TOTAL: $${orderData.total.toFixed(2)}\n\n`;
    ticket += `______\n\n`;
    ticket += `Gracias por su visita\n\n`;
    ticket += `______\n`;
    
    return ticket;
  }

  private generateTicket(orderData: OrderDataForPrinting): string {
    let ticket = '';
    const { date, time } = this.formatDateTime(orderData.createdAt);
    
    ticket += `FECHA: ${date}\n`;
    ticket += `HORA: ${time}\n\n`;
    ticket += `______\n\n`;
    ticket += `TICKET DE VENTA\n\n`;
    ticket += `______\n\n`;
    ticket += `Mesa: ${orderData.tableNumber}\n`;
    ticket += `Personas: ${orderData.customerCount}\n`;
    if (orderData.waiter) {
      ticket += `Mesero: ${orderData.waiter}\n`;
    }
    ticket += `______\n\n`;
    
    // Formato ajustado para 58mm
    const maxNameLength = 16;
    const maxPriceLength = 8;
    
    orderData.items.forEach(item => {
      const total = item.quantity * item.price;
      const nameDisplay = item.name.length > maxNameLength 
        ? item.name.substring(0, maxNameLength - 3) + '...' 
        : item.name;
      
      const nameWithSpaces = nameDisplay.padEnd(maxNameLength);
      const totalDisplay = `$${total.toFixed(2)}`.padStart(maxPriceLength);
      
      ticket += `${item.quantity}x ${nameWithSpaces} ${totalDisplay}\n`;
    });
    
    ticket += `\n______\n\n`;
    ticket += `TOTAL: $${orderData.total.toFixed(2)}\n\n`;
    ticket += `______\n\n`;
    ticket += `Gracias por su visita\n\n`;
    ticket += `______\n`;
    
    return ticket;
  }
}

export const browserPrintService = new BrowserPrintService();