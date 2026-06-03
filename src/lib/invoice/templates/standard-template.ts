export interface StandardInvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  dueDate: string;
  company: {
    name: string;
    address: string;
    email: string;
    phone: string;
    website: string;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
  };
  items: Array<{
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  notes?: string;
  terms?: string;
}

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function generateStandardTemplate(data: StandardInvoiceData): string {
  const {
    invoiceNumber, orderNumber, date, dueDate, company, customer,
    items, subtotal, tax, taxRate, shippingCost, discount, total,
    currency, paymentMethod, paymentStatus, notes, terms,
  } = data;

  const itemRows = items
    .map(
      (item, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; text-align: center;">${i + 1}</td>
        <td style="padding: 10px 12px;">
          <div style="font-weight: 500;">${item.name}</div>
          ${item.description ? `<div style="font-size: 12px; color: #6b7280;">${item.description}</div>` : ""}
        </td>
        <td style="padding: 10px 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px 12px; text-align: right;">${formatCurrency(item.unitPrice, currency)}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 500;">${formatCurrency(item.total, currency)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.6; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 30px;">
    <!-- Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div>
        <h1 style="font-size: 28px; color: #1e40af; margin-bottom: 4px;">${company.name}</h1>
        <p style="font-size: 13px; color: #6b7280; white-space: pre-line;">${company.address}</p>
        <p style="font-size: 13px; color: #6b7280;">${company.email} | ${company.phone}</p>
      </div>
      <div style="text-align: right;">
        <h2 style="font-size: 32px; color: #1e40af; letter-spacing: 2px;">INVOICE</h2>
        <p style="font-size: 14px; color: #374151; margin-top: 4px;"><strong>#${invoiceNumber}</strong></p>
      </div>
    </div>

    <!-- Invoice Meta -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px;">
      <div>
        <p style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Bill To</p>
        <p style="font-weight: 600; margin-top: 4px;">${customer.name}</p>
        <p style="font-size: 13px; color: #6b7280;">${customer.email}</p>
        ${customer.phone ? `<p style="font-size: 13px; color: #6b7280;">${customer.phone}</p>` : ""}
        <p style="font-size: 13px; color: #6b7280; white-space: pre-line;">${customer.address}</p>
      </div>
      <div style="text-align: right;">
        <table style="margin-left: auto;">
          <tr><td style="font-size: 12px; color: #6b7280; padding: 2px 0;">Order Number:</td><td style="font-size: 13px; font-weight: 500; padding: 2px 0 2px 12px;">${orderNumber}</td></tr>
          <tr><td style="font-size: 12px; color: #6b7280; padding: 2px 0;">Invoice Date:</td><td style="font-size: 13px; font-weight: 500; padding: 2px 0 2px 12px;">${date}</td></tr>
          <tr><td style="font-size: 12px; color: #6b7280; padding: 2px 0;">Due Date:</td><td style="font-size: 13px; font-weight: 500; padding: 2px 0 2px 12px;">${dueDate}</td></tr>
          <tr><td style="font-size: 12px; color: #6b7280; padding: 2px 0;">Status:</td><td style="font-size: 13px; font-weight: 600; padding: 2px 0 2px 12px; color: ${paymentStatus === "PAID" ? "#059669" : "#d97706"};">${paymentStatus}</td></tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: #1e40af; color: white;">
          <th style="padding: 12px; text-align: center; font-size: 13px; border-radius: 6px 0 0 0;">#</th>
          <th style="padding: 12px; text-align: left; font-size: 13px;">Item</th>
          <th style="padding: 12px; text-align: center; font-size: 13px;">Qty</th>
          <th style="padding: 12px; text-align: right; font-size: 13px;">Unit Price</th>
          <th style="padding: 12px; text-align: right; font-size: 13px; border-radius: 0 6px 0 0;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
      <table style="width: 300px;">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Subtotal</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: right;">${formatCurrency(subtotal, currency)}</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #059669;">Discount</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: right; color: #059669;">-${formatCurrency(discount, currency)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Tax (${taxRate}%)</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: right;">${formatCurrency(tax, currency)}</td>
        </tr>
        ${shippingCost > 0 ? `
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Shipping</td>
          <td style="padding: 6px 0; font-size: 14px; text-align: right;">${formatCurrency(shippingCost, currency)}</td>
        </tr>` : ""}
        <tr style="border-top: 2px solid #1e40af;">
          <td style="padding: 12px 0; font-size: 18px; font-weight: 700;">Total</td>
          <td style="padding: 12px 0; font-size: 18px; font-weight: 700; text-align: right; color: #1e40af;">${formatCurrency(total, currency)}</td>
        </tr>
      </table>
    </div>

    <!-- Payment Info -->
    <div style="padding: 20px; background: #f0f9ff; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #1e40af; margin-bottom: 8px;">Payment Information</h3>
      <p style="font-size: 13px; color: #374151;">Payment Method: ${paymentMethod || "N/A"}</p>
      <p style="font-size: 13px; color: #374151;">Payment Status: <strong>${paymentStatus}</strong></p>
    </div>

    ${notes ? `
    <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px;">
      <h3 style="font-size: 14px; color: #374151; margin-bottom: 8px;">Notes</h3>
      <p style="font-size: 13px; color: #6b7280;">${notes}</p>
    </div>` : ""}

    ${terms ? `
    <div style="padding: 20px; border-top: 1px solid #e5e7eb;">
      <h3 style="font-size: 14px; color: #374151; margin-bottom: 8px;">Terms & Conditions</h3>
      <p style="font-size: 12px; color: #9ca3af;">${terms}</p>
    </div>` : ""}

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <p style="font-size: 12px; color: #9ca3af;">Thank you for your business!</p>
      <p style="font-size: 12px; color: #9ca3af;">${company.name} | ${company.website}</p>
    </div>
  </div>
</body>
</html>`;
}
