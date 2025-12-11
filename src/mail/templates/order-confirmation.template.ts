import { OrderData } from '../interfaces/email-job-data.interface';

export const orderConfirmationTemplate = (orderData: OrderData) => {
  const itemsHtml = orderData.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.productName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right;">$${item.lineTotal.toFixed(2)}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">✅ Payment Successful!</h2>
      <p>Thank you for your order. Your payment has been processed successfully.</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
            <th style="padding: 10px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 15px; text-align: right; font-weight: bold; color: #4CAF50;">
              $${orderData.total.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
};
