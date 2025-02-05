const db = require("../config/db");
const PDFDocument = require("pdfkit");
const fs = require("fs");

// ฟังก์ชันในการอัปเดต max_id ในตาราง maxid
const updateMaxID = async (tableName, newMaxID) => {
  try {
    const query = `
      UPDATE maxid
      SET max_id = ?
      WHERE max_table = ?
    `;
    await db.promise().query(query, [newMaxID, tableName]);
  } catch (err) {
    console.error(`เกิดข้อผิดพลาดในการอัปเดต max_id สำหรับ ${tableName}:`, err);
    throw new Error(`ไม่สามารถอัปเดต max_id สำหรับ ${tableName}`);
  }
};

// ฟังก์ชันในการสร้าง Auto ID สำหรับ Order
const AutoIDorder = async () => {
  try {
    const query = 'CALL GenerateAutoID("orders")';
    const [result] = await db.promise().query(query);
    return result; // ส่งค่าไปที่ createOrder แทน
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    throw new Error("เกิดข้อผิดพลาดในการดำเนินการ"); // ส่ง error กลับไปที่ createOrder
  }
};







// ฟังก์ชันในการสร้างใบสั่งซื้อ
const createOrder = async (req, res) => {
  try {
    // ดึงข้อมูลจาก request body
    const { order_user_ID, date, total, items } = req.body;

    // เรียกใช้ AutoIDorder เพื่อดึง Order ID
    let orderIDResponse = await AutoIDorder();
    let orderID = orderIDResponse[0][0].AutoID;
    console.log("Generated Order ID:", orderID); // ตรวจสอบข้อมูลที่ได้รับ

    // ตรวจสอบว่า order_ID ซ้ำกับที่มีอยู่ในฐานข้อมูลหรือไม่
    const checkOrderIDQuery =
      "SELECT COUNT(*) AS count FROM orders WHERE order_ID = ?";
    const [checkResult] = await db
      .promise()
      .query(checkOrderIDQuery, [orderID]);

    if (checkResult[0].count > 0) {
      // หาก order_ID ซ้ำ ให้เรียก AutoIDorder ใหม่เพื่อสร้าง ID ใหม่
      console.log("Order ID ซ้ำ! กำลังสร้าง Order ID ใหม่...");
      orderIDResponse = await AutoIDorder();
      orderID = orderIDResponse[0][0].AutoID;
    }

    // บันทึกข้อมูลในตาราง orders
    const orderQuery = `
        INSERT INTO orders (order_ID, order_user_ID, date, order_stat_ID, total)
        VALUES (?, ?, ?, ?, ?)
      `;
    await db
      .promise()
      .query(orderQuery, [
        orderID,
        order_user_ID,
        date,
        (order_stat_ID = "SOD000002"),
        total,
      ]);

    // อัปเดต max_id สำหรับ orders
    await updateMaxID("orders", orderID);

    let countnumber = 1;
    // บันทึกรายการสินค้าในตาราง orderlist
    for (const item of items) {
      // บันทึกข้อมูลในตาราง orderlist
      const orderlistQuery = `
  INSERT INTO orderlist (number, orderlist_orders_ID, orderlist_stock_ID, stockname, quantity, unit, price, totalprice)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
      await db
        .promise()
        .query(orderlistQuery, [
          countnumber,
          orderID,
          item.orderlist_stock_ID,
          item.stockname,
          item.quantity,
          item.unit,
          item.price,
          item.totalprice,
        ]);

      countnumber++;
    }

    // ส่งคำตอบกลับไปที่ฟรอนต์เอนด์
    res.status(201).json({
      message: "ใบสั่งซื้อถูกสร้างขึ้นเรียบร้อยแล้ว",
      orderID: orderID, // ส่ง Order ID ที่สร้างใหม่กลับไป
    });
  } catch (err) {
    console.error("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ:", err);
    res.status(500).json({ error: err.message });
  }
};

// ฟังก์ชัน GenerateAutoID ที่จะสร้าง AutoID ใหม่

const GenerateAutoID = async (table_name) => {
  try {
    // กำหนด prefix วันที่เป็น ddmmyy
    const todayPrefix = new Date().toLocaleDateString('en-GB').replace(/\//g, '').slice(0, 6);

    // ดึงค่า max_id ล่าสุดจากตาราง maxid ที่ตรงกับ table_name
    const [lastIdResult] = await db.promise().query(
      'SELECT max_id FROM maxid WHERE max_table = ? ORDER BY max_id DESC LIMIT 1',
      [table_name]
    );

    let nextNumber = '001'; // เริ่มต้นที่ 001
    if (lastIdResult.length > 0) {
      const lastId = lastIdResult[0].max_id;
      
      // ตรวจสอบว่า last_id เป็นของวันเดียวกันหรือไม่
      if (lastId.startsWith(todayPrefix)) {
        // ถ้าใช่ให้เพิ่มหมายเลขถัดไป
        const lastNumber = parseInt(lastId.slice(6), 10);
        nextNumber = (lastNumber + 1).toString().padStart(3, '0');
      }
    }

    // สร้าง new_id ใหม่
    const newId = todayPrefix + nextNumber;
    return newId;
  } catch (err) {
    console.error('Error generating AutoID:', err);
    throw err;
  }
};

// // ฟังก์ชันในการสร้างใบสั่งซื้อ
// const createOrder = async (req, res) => {
//   try {
//     // ดึงข้อมูลจาก request body
//     const { order_user_ID, date, total, items } = req.body;

//     // เรียกใช้ GenerateAutoID เพื่อดึง Order ID
//     let orderID = await GenerateAutoID('orders');
//     console.log("Generated Order ID:", orderID); // ตรวจสอบข้อมูลที่ได้รับ

//     // ตรวจสอบว่า order_ID ซ้ำกับที่มีอยู่ในฐานข้อมูลหรือไม่
//     const checkOrderIDQuery =
//       "SELECT COUNT(*) AS count FROM orders WHERE order_ID = ?";
//     const [checkResult] = await db
//       .promise()
//       .query(checkOrderIDQuery, [orderID]);

//     if (checkResult[0].count > 0) {
//       // หาก order_ID ซ้ำ ให้เรียก GenerateAutoID ใหม่เพื่อสร้าง ID ใหม่
//       console.log("Order ID ซ้ำ! กำลังสร้าง Order ID ใหม่...");
//       orderID = await GenerateAutoID('orders');
//     }

//     // บันทึกข้อมูลในตาราง orders
//     const orderQuery = `
//         INSERT INTO orders (order_ID, order_user_ID, date, order_stat_ID, total)
//         VALUES (?, ?, ?, ?, ?)
//       `;
//     await db
//       .promise()
//       .query(orderQuery, [
//         orderID,
//         order_user_ID,
//         date,
//         (order_stat_ID = "SOD000002"),
//         total,
//       ]);

//     // อัปเดต max_id สำหรับ orders
//     await updateMaxID("orders", orderID);

//     let countnumber = 1;
//     // บันทึกรายการสินค้าในตาราง orderlist
//     for (const item of items) {
//       // บันทึกข้อมูลในตาราง orderlist
//       const orderlistQuery = `
//   INSERT INTO orderlist (number, orderlist_orders_ID, orderlist_stock_ID, stockname, quantity, unit, price, totalprice)
//   VALUES (?, ?, ?, ?, ?, ?, ?, ?)
// `;
//       await db
//         .promise()
//         .query(orderlistQuery, [
//           countnumber,
//           orderID,
//           item.orderlist_stock_ID,
//           item.stockname,
//           item.quantity,
//           item.unit,
//           item.price,
//           item.totalprice,
//         ]);

//       countnumber++;
//     }

//     // ส่งคำตอบกลับไปที่ฟรอนต์เอนด์
//     res.status(201).json({
//       message: "ใบสั่งซื้อถูกสร้างขึ้นเรียบร้อยแล้ว",
//       orderID: orderID, // ส่ง Order ID ที่สร้างใหม่กลับไป
//     });
//   } catch (err) {
//     console.error("เกิดข้อผิดพลาดในการสร้างใบสั่งซื้อ:", err);
//     res.status(500).json({ error: err.message });
//   }
// };


const generateInvoicePDF = async (order, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // กำหนดให้ PDF ส่งกลับไปยัง response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');

  doc.pipe(res); // ส่งข้อมูล PDF ไปที่ Response

  // โหลดฟอนต์ที่รองรับภาษาไทย
  doc.registerFont('th-sarabun', './fonts/THSarabunNew.ttf'); // ใช้ฟอนต์ที่รองรับไทย

  // ใส่ข้อความ "ใบสั่งซื้อ" ด้านบน
  doc.font('th-sarabun').fontSize(28).fillColor('#1d3557').text("ใบสั่งซื้อ", { align: "center" });
  doc.moveDown(0.5);

  // ข้อมูลบริษัท
  doc.font('th-sarabun').fontSize(12).fillColor('#333').text("บริษัท: ", { align: "left" });
  doc.text("ที่อยู่: ", { align: "left" });
  doc.text("โทรศัพท์: ", { align: "left" });
  doc.text("อีเมล: ", { align: "left" });
  doc.text("เว็บไซต์: ", { align: "left" });

  

  doc.moveDown(1);

  // ข้อมูลใบสั่งซื้อ
  doc.font('th-sarabun').fontSize(12).fillColor('#333').text(`เลขที่ใบสั่งซื้อ: ${order.order_ID}`, { align: "left" });
  doc.text(`วันที่: ${order.date}`, { align: "left" });
  doc.text(`สถานะ: ${order.status}`, { align: "left" });

  doc.moveDown(1);

  // เส้นขอบ
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e1e1e1').lineWidth(1).stroke(); // เส้นขอบด้านบนของรายการสินค้า

// รายการสินค้า
doc.font('th-sarabun').fontSize(14).fillColor('#1d3557').text("รายการสินค้า:", { align: "left", underline: true });
doc.moveDown(0.5);

// สร้างหัวตาราง
const tableTop = doc.y;
const rowHeight = 20;
const columnWidths = [50, 100, 180, 70, 100]; // กำหนดความกว้างของแต่ละคอลัมน์
const columns = ['#', 'สินค้า', 'ราคา', 'จำนวน', 'รวม'];

let currentY = tableTop;

// วาดเส้นหัวตาราง
columns.forEach((col, idx) => {
  doc.font('th-sarabun').fontSize(12).fillColor('#333').text(col, columnWidths[idx] * idx + 50, currentY);
});

// วาดเส้นขอบหัวตาราง
doc.moveTo(50, currentY + rowHeight).lineTo(550, currentY + rowHeight).strokeColor('#e1e1e1').lineWidth(1).stroke();

// วาดเส้นและรายการสินค้า
order.items.forEach((item, index) => {
  currentY += rowHeight;

  // วาดข้อมูลในแต่ละแถว
  doc.font('th-sarabun').fontSize(12).fillColor('#333').text(index + 1, 50, currentY);
  doc.text(item.stockname, 100 + columnWidths[0], currentY);
  doc.text(`${item.quantity} ${item.unit}`, 110 + columnWidths[0] + columnWidths[1], currentY);
  doc.text(item.price, 80 + columnWidths[0] + columnWidths[1] + columnWidths[2], currentY);
  doc.text(item.totalprice, 60 + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3], currentY);

  // วาดเส้นขอบรายการสินค้า
  if (index !== order.items.length - 1) {
    doc.moveTo(50, currentY + rowHeight).lineTo(550, currentY + rowHeight).strokeColor('#e1e1e1').lineWidth(1).stroke();
  }
});

// วาดเส้นขอบล่างสุด
doc.moveTo(50, currentY + rowHeight).lineTo(550, currentY + rowHeight).strokeColor('#e1e1e1').lineWidth(1).stroke();

  doc.moveDown();

  // เส้นขอบ
  doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e1e1e1').lineWidth(1).stroke(); // เส้นขอบด้านล่างของรายการสินค้า

  // สรุปยอดรวม
  doc.font('th-sarabun').fontSize(14).fillColor('#1d3557').text(`ราคารวม: ${order.total} บาท`, { align: "left", bold: true });
  doc.moveDown(0.5);

  // ข้อมูลการชำระเงิน
  // doc.text(`ยอดที่ต้องชำระ: ${order.total} บาท`, { align: "left", bold: true });
  doc.moveDown(1);


  const approvedBy = order.approvedBy ? order.approvedBy : "......................";
  // โลโก้และข้อมูลวันและผู้อนุมัติ (ด้านล่าง)
  doc.moveDown(2);
  doc.text(`ผู้จัดทำ: ${order.fullname}`, { align: 'left', continued: true }).text(`วันที่: ${order.date}`, { align: 'right' });

  doc.moveDown(1);
  doc.text(`ผู้อนุมัติ: ${approvedBy}`, { align: 'left', continued: true }).text(`สถานะ: ${order.status}`, { align: 'right' });

  // ปิดเอกสาร
  doc.end();
};




// ฟังก์ชันในการดึงข้อมูลใบสั่งซื้อที่ยังไม่อนุมัติ
const getPendingOrders = async (req, res) => {
  const { limit, offset, search } = req.query;

  // สร้างเงื่อนไขสำหรับการค้นหาข้อมูล
  const searchCondition = search ? `AND (order_ID LIKE ? OR order_user_ID LIKE ? OR date LIKE ? OR CONCAT(users.user_Fname, ' ', users.user_Lname) LIKE ? OR staorder.StaOrder_Name LIKE ?)` : "";
  const searchValue = search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [];

  try {
    const query = `
      SELECT order_ID, order_user_ID, CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname, date, staorder.StaOrder_Name AS status, total
      FROM orders
      INNER JOIN users on users.user_ID = orders.order_user_ID
      INNER JOIN staorder on staorder.StaOrder_ID = orders.order_stat_ID
      WHERE order_stat_ID IN ('SOD000002') ${searchCondition}
      LIMIT ? OFFSET ?;
    `;

    const [result] = await db.promise().query(query, [...searchValue, parseInt(limit), parseInt(offset)]);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }

    // ฟอร์แมตวันที่ในผลลัพธ์
    const formattedResult = result.map((item) => ({
      ...item,
      date:
        new Date(item.date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) 
    }));

    // ดึงข้อมูลของรายการสินค้าที่เกี่ยวข้องกับใบสั่งซื้อ
    const orderDetails = await Promise.all(formattedResult.map(async (order) => {
      const itemsQuery = "SELECT * FROM orderlist WHERE orderlist_orders_ID = ?";
      const [items] = await db.promise().query(itemsQuery, [order.order_ID]);
      order.items = items;
      return order;
    }));

    // ส่งผลลัพธ์กลับไปที่ frontend
    res.status(200).json(orderDetails);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Error fetching orders" });
  }
};

// ฟังก์ชันในการสร้างใบสั่งซื้อเป็น PDF
const createOrderPDF = async (req, res) => {
  const { order_ID } = req.params; // รับค่า order_ID จาก URL parameters

  try {
    // ดึงข้อมูลใบสั่งซื้อจากฐานข้อมูล
    const query = `
      SELECT order_ID, order_user_ID, date, order_stat_ID, CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname, staorder.StaOrder_Name AS status, total
      FROM orders
      INNER JOIN users on users.user_ID = orders.order_user_ID
      INNER JOIN staorder on staorder.StaOrder_ID = orders.order_stat_ID
      WHERE order_ID = ?;
    `;
    const [order] = await db.promise().query(query, [order_ID]);

    if (order.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลใบสั่งซื้อ" });
    }

    // ฟอร์แมตวันที่ให้เป็นแบบวัน/เดือน/ปี พร้อมเวลา
    const formattedDate = new Date(order[0].date).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    // อัพเดทข้อมูลวันที่ที่ฟอร์แมตแล้ว
    order[0].date = formattedDate;

    // ดึงรายการสินค้า
    const itemsQuery = "SELECT * FROM orderlist WHERE orderlist_orders_ID = ?";
    const [items] = await db.promise().query(itemsQuery, [order[0].order_ID]);

    // เพิ่มรายการสินค้าในข้อมูลใบสั่งซื้อ
    order[0].items = items;

    // สร้าง PDF ใบสั่งซื้อ
    generateInvoicePDF(order[0], res);

  } catch (err) {
    console.error("Error creating PDF:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสร้าง PDF" });
  }
};





const orderdata = async (req, res) => {
  try {
    const query = `
        `;
    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
}

const listByOrder = async (req, res) => {
  const { order_user_ID} = req.body;
  try {
    const query = `
        `;
    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
}

module.exports = {
  createOrder,
  getPendingOrders,
  createOrderPDF
};
