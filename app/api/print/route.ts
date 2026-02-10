import { NextRequest, NextResponse } from 'next/server';

// Configuración desde variables de entorno
const PRINTNODE_API_KEY = process.env.PRINTNODE_API_KEY || '';
const PRINTNODE_BASE_URL = 'https://api.printnode.com';

// IDs de impresoras desde variables de entorno
const PRINTER_KITCHEN_ID = process.env.PRINTER_KITCHEN_ID || '';
const PRINTER_BAR_ID = process.env.PRINTER_BAR_ID || '';
const PRINTER_TICKET_ID = process.env.PRINTER_TICKET_ID || '';

interface PrintRequest {
  printer: 'kitchen' | 'bar' | 'ticket' | 'all';
  content: string;
  title: string;
  orderData?: any;
  printType?: string;
}

// Mapa de IDs de impresoras
const PRINTER_IDS = {
  kitchen: PRINTER_KITCHEN_ID ? parseInt(PRINTER_KITCHEN_ID) : 0,
  bar: PRINTER_BAR_ID ? parseInt(PRINTER_BAR_ID) : 0,
  ticket: PRINTER_TICKET_ID ? parseInt(PRINTER_TICKET_ID) : 0,
};

// Verificar configuración mínima
function checkConfig(): { valid: boolean; message: string } {
  if (!PRINTNODE_API_KEY) {
    return { valid: false, message: 'PRINTNODE_API_KEY no configurada' };
  }
  
  if (!PRINTER_IDS.kitchen || !PRINTER_IDS.bar || !PRINTER_IDS.ticket) {
    return { valid: false, message: 'Faltan IDs de impresoras en la configuración' };
  }
  
  return { valid: true, message: 'Configuración OK' };
}

// Enviar a PrintNode
async function sendToPrintNode(printerId: number, title: string, content: string) {
  try {
    const printJob = {
      printerId: printerId,
      title: title,
      contentType: 'raw_base64',
      content: Buffer.from(content).toString('base64'),
      source: 'Restaurant POS',
    };

    const response = await fetch(`${PRINTNODE_BASE_URL}/printjobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PRINTNODE_API_KEY).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(printJob),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PrintNode error:', response.status, errorText);
      return { success: false, error: `Error ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    return { success: true, jobId: result.id };
  } catch (error: any) {
    console.error('Error enviando a PrintNode:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar configuración
    const configCheck = checkConfig();
    if (!configCheck.valid) {
      return NextResponse.json(
        { error: configCheck.message },
        { status: 500 }
      );
    }

    // Parsear solicitud
    const body: PrintRequest = await request.json();
    const { printer, content, title, orderData, printType } = body;

    if (!printer || !content || !title) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Determinar qué impresoras usar
    let printersToUse: ('kitchen' | 'bar' | 'ticket')[] = [];
    
    if (printer === 'all') {
      // Según el tipo de impresión
      if (printType === 'kitchen') {
        printersToUse = ['kitchen'];
      } else if (printType === 'bar') {
        printersToUse = ['bar'];
      } else if (printType === 'ticket' || printType === 'comensales' || printType === 'final-ticket') {
        printersToUse = ['ticket'];
      } else {
        // 'all' significa cocina + barra + ticket
        printersToUse = ['kitchen', 'bar', 'ticket'];
      }
    } else {
      printersToUse = [printer];
    }

    // Enviar a cada impresora
    const results = [];
    
    for (const printerType of printersToUse) {
      const printerId = PRINTER_IDS[printerType];
      
      if (!printerId) {
        results.push({
          printer: printerType,
          success: false,
          error: `Impresora ${printerType} no configurada`
        });
        continue;
      }

      const jobTitle = printerType === 'kitchen' ? `Cocina - ${title}` :
                       printerType === 'bar' ? `Barra - ${title}` :
                       `Ticket - ${title}`;
      
      const result = await sendToPrintNode(printerId, jobTitle, content);
      results.push({
        printer: printerType,
        ...result
      });
      
      // Log en consola
      const tableNumber = orderData?.tableNumber || 'N/A';
      if (result.success) {
        console.log(`✅ Impresión exitosa: ${printerType} - Mesa ${tableNumber}`);
      } else {
        console.error(`❌ Error impresión ${printerType}:`, result.error);
      }
    }

    const allSuccess = results.every(r => r.success);
    const someSuccess = results.some(r => r.success);

    return NextResponse.json({
      success: someSuccess,
      message: allSuccess ? 'Todas las impresiones exitosas' :
               someSuccess ? 'Algunas impresiones exitosas' :
               'Error en todas las impresiones',
      results: results,
    });

  } catch (error: any) {
    console.error('Error en API de impresión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar configuración
    const configCheck = checkConfig();
    if (!configCheck.valid) {
      return NextResponse.json({
        success: false,
        error: configCheck.message,
        printers: [],
        config: PRINTER_IDS
      });
    }

    // Obtener impresoras de PrintNode
    let printers = [];
    let connected = false;
    
    try {
      const response = await fetch(`${PRINTNODE_BASE_URL}/printers`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(PRINTNODE_API_KEY).toString('base64')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        printers = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          state: p.state,
          computer: p.computer?.name,
        }));
        connected = true;
      }
    } catch (error) {
      console.error('Error conectando con PrintNode:', error);
    }

    // Verificar si nuestras impresoras configuradas existen
    const configStatus = {
      kitchen: {
        id: PRINTER_IDS.kitchen,
        exists: printers.some((p: any) => p.id === PRINTER_IDS.kitchen),
        name: printers.find((p: any) => p.id === PRINTER_IDS.kitchen)?.name || 'No encontrada'
      },
      bar: {
        id: PRINTER_IDS.bar,
        exists: printers.some((p: any) => p.id === PRINTER_IDS.bar),
        name: printers.find((p: any) => p.id === PRINTER_IDS.bar)?.name || 'No encontrada'
      },
      ticket: {
        id: PRINTER_IDS.ticket,
        exists: printers.some((p: any) => p.id === PRINTER_IDS.ticket),
        name: printers.find((p: any) => p.id === PRINTER_IDS.ticket)?.name || 'No encontrada'
      }
    };

    return NextResponse.json({
      success: true,
      connected: connected,
      printers: printers,
      config: PRINTER_IDS,
      configStatus: configStatus,
      message: connected ? 
        `Conectado a PrintNode. ${printers.length} impresoras disponibles.` :
        'No se pudo conectar con PrintNode'
    });

  } catch (error: any) {
    console.error('Error obteniendo impresoras:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno',
      printers: [],
      config: PRINTER_IDS
    });
  }
}