import { StandardInvoiceData } from "./standard-template";

export interface GSTInvoiceData extends StandardInvoiceData {
  gstin: string;
  customerGstin?: string;
  hsnCode: string;
  placeOfSupply: string;
  stateCode: string;
  isInterState: boolean;
  cgst: number;
  sgst: number;
  igst: number;
  cessAmount?: number;
  reverseCharge: boolean;
}

function formatINR(amount: number): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `₹${amount.toFixed(2)}`;
  }
}

function numberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  if (num === 0) return "Zero";
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " and " + numberToWords(num % 100) : "");
  if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numberToWords(num % 100000) : "");
  return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 ? " " + numberToWords(num % 10000000) : "");
}

export function generateGSTTemplate(data: GSTInvoiceData): string {
  const {
    invoiceNumber, orderNumber, date, dueDate, company, customer,
    items, subtotal, tax, shippingCost, discount, total,
    paymentMethod, paymentStatus, notes, terms,
    gstin, customerGstin, hsnCode, placeOfSupply, stateCode,
    isInterState, cgst, sgst, igst, cessAmount, reverseCharge,
  } = data;

  const itemRows = items
    .map(
      (item, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 8px 10px; text-align: center; font-size: 12px;">${i + 1}</td>
        <td style="padding: 8px 10px; font-size: 12px;">
          <div style="font-weight: 500;">${item.name}</div>
          ${item.description ? `<div style="font-size: 11px; color: #6b7280;">${item.description}</div>` : ""}
        </td>
        <td style="padding: 8px 10px; text-align: center; font-size: 12px;">${hsnCode}</td>
        <td style="padding: 8px 10px; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 8px 10px; text-align: right; font-size: 12px;">${formatINR(item.unitPrice)}</td>
        <td style="padding: 8px 10px; text-align: right; font-size: 12px;">${formatINR(item.total)}</td>
        <td style="padding: 8px 10px; text-align: right; font-size: 12px;">
          ${isInterState ? formatINR(item.total * 0.18) : formatINR(item.total * 0.09)}
        </td>
        <td style="padding: 8px 10px; text-align: right; font-size: 12px; font-weight: 500;">${formatINR(item.total + (isInterState ? item.total * 0.18 : item.total * 0.18))}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice ${invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.5; font-size: 13px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; padding: 30px 24px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #1e40af; padding-bottom: 16px;">
      <h1 style="font-size: 24px; color: #1e40af; margin-bottom: 4px;">${company.name}</h1>
      <p style="font-size: 12px; color: #6b7280; white-space: pre-line;">${company.address}</p>
      <p style="font-size: 12px; color: #6b7280;">Email: ${company.email} | Phone: ${company.phone}</p>
      <p style="font-size: 13px; font-weight: 600; color: #374151; margin-top: 4px;">GSTIN: ${gstin}</p>
    </div>

    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="font-size: 20px; color: #1e40af; letter-spacing: 3px; text-transform: uppercase;">Tax Invoice</h2>
    </div>

    <!-- Invoice Meta -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; flex: 1; margin-right: 10px;">
        <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; font-weight: 600;">Bill To</p>
        <p style="font-weight: 600; margin-top: 4px;">${customer.name}</p>
        <p style="font-size: 12px; color: #6b7280;">${customer.email}</p>
        ${customer.phone ? `<p style="font-size: 12px; color: #6b7280;">${customer.phone}</p>` : ""}
        <p style="font-size: 12px; color: #6b7280; white-space: pre-line;">${customer.address}</p>
        ${customerGstin ? `<p style="font-size: 12px; font-weight: 600; margin-top: 4px;">GSTIN: ${customerGstin}</p>` : ""}
      </div>
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; flex: 1; margin-left: 10px;">
        <table style="width: 100%;">
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Invoice No:</td><td style="font-size: 12px; font-weight: 600; text-align: right;">${invoiceNumber}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Order No:</td><td style="font-size: 12px; text-align: right;">${orderNumber}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Date:</td><td style="font-size: 12px; text-align: right;">${date}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Due Date:</td><td style="font-size: 12px; text-align: right;">${dueDate}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Place of Supply:</td><td style="font-size: 12px; text-align: right;">${placeOfSupply}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">State Code:</td><td style="font-size: 12px; text-align: right;">${stateCode}</td></tr>
          <tr><td style="font-size: 11px; color: #6b7280; padding: 2px 0;">Reverse Charge:</td><td style="font-size: 12px; text-align: right;">${reverseCharge ? "Yes" : "No"}</td></tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #d1d5db;">
      <thead>
        <tr style="background: #1e40af; color: white;">
          <th style="padding: 8px 10px; font-size: 11px; text-align: center;">#</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: left;">Description</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: center;">HSN</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: center;">Qty</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: right;">Rate</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: right;">Taxable</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: right;">${isInterState ? "IGST" : "CGST"}</th>
          <th style="padding: 8px 10px; font-size: 11px; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Tax Breakdown & Totals -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <!-- Tax Summary -->
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; flex: 1; margin-right: 10px;">
        <h3 style="font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1e40af;">Tax Summary</h3>
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 12px; padding: 3px 0;">HSN Code</td>
            <td style="font-size: 12px; text-align: right;">${hsnCode}</td>
          </tr>
          ${isInterState ? `
          <tr>
            <td style="font-size: 12px; padding: 3px 0;">IGST (18%)</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(igst)}</td>
          </tr>` : `
          <tr>
            <td style="font-size: 12px; padding: 3px 0;">CGST (9%)</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(cgst)}</td>
          </tr>
          <tr>
            <td style="font-size: 12px; padding: 3px 0;">SGST (9%)</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(sgst)}</td>
          </tr>`}
          ${cessAmount ? `
          <tr>
            <td style="font-size: 12px; padding: 3px 0;">Cess</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(cessAmount)}</td>
          </tr>` : ""}
          <tr style="border-top: 1px solid #e5e7eb;">
            <td style="font-size: 12px; padding: 6px 0; font-weight: 600;">Total Tax</td>
            <td style="font-size: 12px; text-align: right; font-weight: 600;">${formatINR(tax)}</td>
          </tr>
        </table>
      </div>

      <!-- Totals -->
      <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; flex: 1; margin-left: 10px;">
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 12px; padding: 3px 0; color: #6b7280;">Subtotal</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(subtotal)}</td>
          </tr>
          ${discount > 0 ? `
          <tr>
            <td style="font-size: 12px; padding: 3px 0; color: #059669;">Discount</td>
            <td style="font-size: 12px; text-align: right; color: #059669;">-${formatINR(discount)}</td>
          </tr>` : ""}
          <tr>
            <td style="font-size: 12px; padding: 3px 0; color: #6b7280;">Tax Amount</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(tax)}</td>
          </tr>
          ${shippingCost > 0 ? `
          <tr>
            <td style="font-size: 12px; padding: 3px 0; color: #6b7280;">Shipping</td>
            <td style="font-size: 12px; text-align: right;">${formatINR(shippingCost)}</td>
          </tr>` : ""}
          <tr style="border-top: 2px solid #1e40af;">
            <td style="padding: 10px 0; font-size: 16px; font-weight: 700;">Grand Total</td>
            <td style="padding: 10px 0; font-size: 16px; font-weight: 700; text-align: right; color: #1e40af;">${formatINR(total)}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Amount in Words -->
    <div style="padding: 10px 16px; background: #f0f9ff; border-radius: 6px; margin-bottom: 16px;">
      <p style="font-size: 12px;"><strong>Amount in Words:</strong> ${numberToWords(Math.round(total))} Rupees Only</p>
    </div>

    <!-- Payment Info -->
    <div style="padding: 12px 16px; background: #f9fafb; border-radius: 6px; margin-bottom: 16px;">
      <h3 style="font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #374151;">Payment Details</h3>
      <p style="font-size: 12px; color: #6b7280;">Payment Method: ${paymentMethod || "N/A"}</p>
      <p style="font-size: 12px; color: #6b7280;">Payment Status: <strong style="color: ${paymentStatus === "PAID" ? "#059669" : "#d97706"};">${paymentStatus}</strong></p>
    </div>

    ${notes ? `
    <div style="padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 16px;">
      <p style="font-size: 12px; color: #6b7280;">${notes}</p>
    </div>` : ""}

    <!-- Declaration & Signature -->
    <div style="display: flex; justify-content: space-between; margin-top: 30px;">
      <div style="flex: 1;">
        <p style="font-size: 11px; color: #6b7280; font-style: italic;">
          This is a computer-generated invoice and does not require a physical signature.
        </p>
        ${terms ? `<p style="font-size: 10px; color: #9ca3af; margin-top: 8px;">${terms}</p>` : ""}
      </div>
      <div style="text-align: center; min-width: 200px;">
        <p style="font-size: 12px; font-weight: 600;">For ${company.name}</p>
        <div style="height: 60px;"></div>
        <p style="font-size: 11px; color: #6b7280; border-top: 1px solid #d1d5db; padding-top: 4px;">Authorized Signatory</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 20px; border-top: 2px solid #1e40af; margin-top: 20px;">
      <p style="font-size: 11px; color: #9ca3af;">Thank you for your business! | ${company.name} | ${company.website}</p>
    </div>
  </div>
</body>
</html>`;
}
