function printBill(order) {
  const cgst = (order.totalAmount * 0.025).toFixed(2);
  const sgst = (order.totalAmount * 0.025).toFixed(2);


  const billHtml = `
    <div style="font-family: Courier New, monospace; font-size: 14px; width: 320px;">
      <div style="text-align:center; font-weight:bold;">Cafe Zam Zam</div>
      <div style="text-align:center;">Pune</div>
      <div style="text-align:center;">GSTIN: 29ABCDE1234F1Z5</div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <div>
        Bill No: ${order.orderNumber}
        <span style="float:right">Dt: ${new Date(order.createdAt).toLocaleDateString()}</span>
      </div>
      <div>
        Time: ${new Date(order.createdAt).toLocaleTimeString()} &nbsp; Waiter: ${order.waiterId} &nbsp; Table: ${order.tableNumber}
      </div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td><b>Description</b></td>
          <td style="text-align:right;"><b>Qty</b></td>
          <td style="text-align:right;"><b>Amount</b></td>
        </tr>
        ${order.items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td style="text-align:right;">${item.quantity}</td>
            <td style="text-align:right;">${(item.totalPrice-(item.totalPrice*0.05)).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%;">
        <tr><td><b>Total Amount</b></td><td style="text-align:right;">${(order.totalAmount-(parseFloat(cgst+sgst))).toFixed(2)}</td></tr>
        <tr><td>CGST 2.5%</td><td style="text-align:right;">${cgst}</td></tr>
        <tr><td>SGST 2.5%</td><td style="text-align:right;">${sgst}</td></tr>
        <tr><td><b>Bill Amount</b></td><td style="text-align:right;"><b>${order.totalAmount}</b></td></tr>
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>
      <div style="text-align:center;">Thank You! Visit Again</div>
    </div>
  `;

  // Open print window
  const printWindow = window.open("", "", "width=400,height=600");
  printWindow.document.write(`<html><head><title>Bill</title></head><body>${billHtml}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
  printWindow.close();
}

export default printBill;