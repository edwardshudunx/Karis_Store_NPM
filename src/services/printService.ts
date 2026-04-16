import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatRupiah } from '../utils/currency';
import { terbilang } from '../utils/terbilang';

const commonStyles = `
  body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #1e293b; line-height: 1.4; }
  .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 24px; font-weight: bold; color: #059669; margin: 0; }
  .info-table { width: 100%; margin-bottom: 20px; font-size: 11px; }
  .table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px; table-layout: fixed; }
  .table th { background: #f8fafc; padding: 10px 8px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #64748b; text-transform: uppercase; vertical-align: middle; }
  .table td { padding: 10px 8px; border-bottom: 1px solid #f1f5f9; word-wrap: break-word; vertical-align: middle; }
  
  .col-name { width: 40%; }
  .col-qty { width: 15%; text-align: center; }
  .col-price { width: 20%; text-align: center; }
  .col-total { width: 25%; text-align: center; }

  .section-title { font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 8px; text-transform: uppercase; border-left: 4px solid #10b981; padding-left: 8px; }
  .summary-box { background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; margin-top: 10px; }
  .summary-row { display: flex; align-items: center; margin-bottom: 4px; font-size: 12px; color: #475569; }
  .summary-label { flex: 1; text-align: right; padding-right: 15px; }
  .summary-value { width: 25%; text-align: right; font-weight: bold; padding-right: 12px; }
  
  .net-box { background: #f0fdfa; padding: 12px 0; border-radius: 8px; border: 1px solid #10b981; margin-top: 8px; }
  .net-row { display: flex; align-items: center; font-weight: 800; font-size: 16px; color: #059669; }
  .net-label { flex: 1; text-align: right; padding-right: 15px; font-size: 13px; }
  .net-value { width: 25%; text-align: right; padding-right: 12px; }

  .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px; }
  .sign-box { text-align: center; width: 180px; }
  .sign-line { margin-top: 50px; border-top: 1px solid #94a3b8; padding-top: 5px; font-weight: bold; }
`;

export const generateInvoicePDF = async (order: any, allReturns: any[] = [], mode: 'print' | 'share' = 'print') => {
  const totalReturn = allReturns.reduce((s, r) => s + r.totalAmount, 0);
  const netAmount = order.totalAmount - totalReturn;

  const itemsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="text-align: center;">${formatRupiah(item.price)}</td>
      <td style="text-align: center;">${formatRupiah(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head><style>${commonStyles}</style></head>
      <body>
        <div class="header"><div class="title">KARIS STORE</div><div style="font-size: 11px; color: #64748b;">SURAT PESANAN</div></div>
        <table class="info-table">
          <tr>
            <td><strong>PELANGGAN:</strong> ${order.customerName}<br>${order.customerPhone ? `Telp: ${order.customerPhone}<br>` : ''}${order.customerAddress ? `Alamat: ${order.customerAddress}` : ''}</td>
            <td style="text-align: right;"><strong>NO:</strong> SP-${String(order.id).padStart(4, '0')}<br><strong>TGL:</strong> ${new Date(order.date).toLocaleDateString('id-ID')}${order.dueDate ? `<br><strong>TEMPO:</strong> ${new Date(order.dueDate).toLocaleDateString('id-ID')}` : ''}</td>
          </tr>
        </table>
        <table class="table">
          <thead><tr><th class="col-name">Barang</th><th class="col-qty">Qty</th><th class="col-price">Harga</th><th class="col-total">Subtotal</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        ${allReturns.length > 0 ? `
          <div class="section-title" style="color: #ef4444; border-left-color: #ef4444;">Penyesuaian Retur</div>
          <table class="table">
            <tbody>
              ${allReturns.flatMap(r => (r.items || [])).map((item: any) => `
                <tr style="color: #ef4444;">
                  <td>${item.productName} (Retur)</td>
                  <td style="text-align: center;">-${item.quantity}</td>
                  <td style="text-align: center;">${formatRupiah(item.price)}</td>
                  <td style="text-align: center;">-${formatRupiah(item.price * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="summary-box">
           ${allReturns.length > 0 ? `
              <div class="summary-row"><span class="summary-label">Total Pesanan</span><span class="summary-value">${formatRupiah(order.totalAmount)}</span></div>
              <div class="summary-row"><span class="summary-label" style="color: #ef4444;">Total Retur (-)</span><span class="summary-value" style="color: #ef4444;">${formatRupiah(totalReturn)}</span></div>
           ` : ''}
           <div class="net-row">
              <span class="net-label">${allReturns.length > 0 ? 'TOTAL AKHIR' : 'TOTAL PESANAN'}</span>
              <span class="net-value">${formatRupiah(netAmount)}</span>
           </div>
           ${allReturns.length > 0 ? `<div style="font-size: 9px; color: #64748b; margin-top: 4px; font-style: italic; text-align: right;">Terbilang: ${terbilang(netAmount)} Rupiah</div>` : ''}
        </div>
      </body>
    </html>
  `;
  if (mode === 'print') {
    await Print.printAsync({ html });
  } else {
    try {
       const { uri } = await Print.printToFileAsync({ html });
       await Sharing.shareAsync(uri, { 
         UTI: '.pdf', 
         mimeType: 'application/pdf',
         dialogTitle: `Bagikan SP-${String(order.id).padStart(4, '0')}` 
       });
    } catch (e) { console.error('Sharing Error', e); }
  }
};

export const generateSettlementPDF = async (order: any, allReturns: any[], mode: 'print' | 'share' = 'print') => {
  const totalReturn = allReturns.reduce((s, r) => s + r.totalAmount, 0);
  const netAmount = order.totalAmount - totalReturn;

  const orderItemsHtml = (order.items || []).map((item: any) => `
    <tr>
      <td>${item.productName}</td>
      <td style="text-align: center;">${item.quantity} ${item.unit || ''}</td>
      <td style="text-align: center;">${formatRupiah(item.price)}</td>
      <td style="text-align: center;">${formatRupiah(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const allReturnItems: any[] = [];
  allReturns.forEach(r => { if (r.items) allReturnItems.push(...r.items); });
  
  const returnItemsHtml = allReturnItems.map((item: any) => `
    <tr style="color: #ef4444;">
      <td>${item.productName}</td>
      <td style="text-align:center">-${item.quantity} ${item.unit || ''}</td>
      <td style="text-align:center">${formatRupiah(item.price)}</td>
      <td style="text-align:center">-${formatRupiah(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const html = `
    <html>
      <head><style>${commonStyles}</style></head>
      <body>
        <div class="header"><div class="title">KARIS STORE</div><div style="font-size: 11px; color: #64748b;">KWITANSI PELUNASAN</div></div>
        
        <table class="info-table">
          <tr>
            <td><strong>PELANGGAN:</strong> ${order.customerName}<br>${order.customerPhone ? `Telp: ${order.customerPhone}` : ''}</td>
            <td style="text-align: right;"><strong>REF:</strong> SP-${String(order.id).padStart(4, '0')}<br><strong>TGL BAYAR:</strong> ${new Date().toLocaleDateString('id-ID')}</td>
          </tr>
        </table>

        <div class="section-title">Detail Pesanan</div>
        <table class="table">
          <thead><tr><th class="col-name">Barang</th><th class="col-qty">Qty</th><th class="col-price">Harga</th><th class="col-total">Subtotal</th></tr></thead>
          <tbody>${orderItemsHtml}</tbody>
        </table>

        ${allReturnItems.length > 0 ? `
          <div class="section-title" style="color: #ef4444; border-left-color: #ef4444;">Barang Diretur</div>
          <table class="table">
            <thead><tr><th class="col-name">Barang</th><th class="col-qty">Qty</th><th class="col-price">Harga</th><th class="col-total">Potongan</th></tr></thead>
            <tbody>${returnItemsHtml}</tbody>
          </table>
        ` : ''}

        <div class="summary-box">
          <div class="summary-row"><span class="summary-label">Total Pesanan</span><span class="summary-value">${formatRupiah(order.totalAmount)}</span></div>
          <div class="summary-row"><span class="summary-label" style="color: #ef4444;">Total Potongan Retur (-)</span><span class="summary-value" style="color: #ef4444;">${formatRupiah(totalReturn)}</span></div>
          <div class="net-box">
             <div class="net-row"><span class="net-label">PEMBAYARAN DITERIMA</span><span class="net-value">${formatRupiah(netAmount)}</span></div>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 5px; font-style: italic; text-align: right;">Terbilang: ${terbilang(netAmount)} Rupiah</div>
        </div>

        <div class="footer">
          <div class="sign-box">Pelanggan,<div class="sign-line">${order.customerName}</div></div>
          <div class="sign-box">Hormat Kami,<div class="sign-line">KARIS STORE</div></div>
        </div>
      </body>
    </html>
  `;
  if (mode === 'print') {
    await Print.printAsync({ html });
  } else {
    try {
       const { uri } = await Print.printToFileAsync({ html });
       await Sharing.shareAsync(uri, { 
         UTI: '.pdf', 
         mimeType: 'application/pdf',
         dialogTitle: `Kwitansi-${String(order.id).padStart(4, '0')}` 
       });
    } catch (e) { console.error('Sharing Error', e); }
  }
};
