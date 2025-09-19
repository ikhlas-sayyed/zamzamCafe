function n(t){const d=(t.totalAmount*.025).toFixed(2),l=(t.totalAmount*.025).toFixed(2),a=`
    <div style="font-family: Courier New, monospace; font-size: 14px; width: 320px;">
      <div style="text-align:center; font-weight:bold;">Cafe Zam Zam</div>
      <div style="text-align:center;">Pune</div>
      <div style="text-align:center;">GSTIN: 29ABCDE1234F1Z5</div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <div>
        Bill No: ${t.orderNumber}
        <span style="float:right">Dt: ${new Date(t.createdAt).toLocaleDateString()}</span>
      </div>
      <div>
        Time: ${new Date(t.createdAt).toLocaleTimeString()} &nbsp; Waiter: ${t.waiterId} &nbsp; Table: ${t.tableNumber}
      </div>
      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td><b>Description</b></td>
          <td style="text-align:right;"><b>Qty</b></td>
          <td style="text-align:right;"><b>Amount</b></td>
        </tr>
        ${t.items.map(i=>`
          <tr>
            <td>${i.name}</td>
            <td style="text-align:right;">${i.quantity}</td>
            <td style="text-align:right;">${(i.totalPrice-i.totalPrice*.05).toFixed(2)}</td>
          </tr>
        `).join("")}
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>

      <table style="width:100%;">
        <tr><td><b>Total Amount</b></td><td style="text-align:right;">${(t.totalAmount-parseFloat(d+l)).toFixed(2)}</td></tr>
        <tr><td>CGST 2.5%</td><td style="text-align:right;">${d}</td></tr>
        <tr><td>SGST 2.5%</td><td style="text-align:right;">${l}</td></tr>
        <tr><td><b>Bill Amount</b></td><td style="text-align:right;"><b>${t.totalAmount}</b></td></tr>
      </table>

      <div style="border-top:1px dashed #000; margin:6px 0;"></div>
      <div style="text-align:center;">Thank You! Visit Again</div>
    </div>
  `,e=window.open("","","width=400,height=600");e.document.write(`<html><head><title>Bill</title></head><body>${a}</body></html>`),e.document.close(),e.focus(),e.print(),e.close()}export{n as p};
