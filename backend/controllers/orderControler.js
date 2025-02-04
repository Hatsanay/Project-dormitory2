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

// ฟังก์ชันในการสร้างใบสั่งซื้อ (PDF)

const generateInvoicePDF = async (order, res) => {
  const doc = new PDFDocument();
  
  // กำหนดให้ PDF ส่งกลับไปยัง response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=invoice.pdf');

  doc.pipe(res); // ส่งข้อมูล PDF ไปที่ Response

  // โหลดฟอนต์ที่รองรับภาษาไทย
  doc.registerFont('th-sarabun', './fonts/THSarabunNew.ttf'); // ใช้ฟอนต์ที่รองรับไทย

  // เพิ่มข้อมูลบริษัทและส่วนหัว
  doc.font('th-sarabun').fontSize(18).text("ใบสั่งซื้อ", { align: "center" });
  doc.moveDown();
  
  // ข้อมูลบริษัท
  doc.font('th-sarabun').fontSize(12).text("บริษัท: FLOWACCOUNT", { align: "left" });
  doc.text("ที่อยู่: 1234/56 ถนนราชวิถี กรุงเทพฯ 10110", { align: "left" });
  doc.text("โทรศัพท์: 02-1234567", { align: "left" });
  doc.text("อีเมล: support@flowaccount.com", { align: "left" });
  doc.text("เว็บไซต์: www.flowaccount.com", { align: "left" });

  doc.moveDown();
  
  // ข้อมูลใบสั่งซื้อ
  doc.font('th-sarabun').text(`เลขที่ใบสั่งซื้อ: ${order.order_ID}`, { align: "left" });
  doc.text(`วันที่: ${order.date}`, { align: "left" });
  doc.text(`สถานะ: ${order.status}`, { align: "left" });

  doc.moveDown();
  
  // รายการสินค้า
  doc.font('th-sarabun').text("รายการสินค้า:", { align: "left" });
  order.items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.name} | จำนวน: ${item.quantity} | ราคา: ${item.price} | รวม: ${item.totalprice}`);
  });

  doc.moveDown();
  
  // สรุปยอด
  doc.text(`ราคารวม: ${order.total} บาท`, { align: "left" });

  // ข้อมูลการชำระเงิน
  doc.text(`ยอดที่ต้องชำระ: ${order.total} บาท`, { align: "left" });

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

    // ดึงข้อมูลของรายการสินค้าที่เกี่ยวข้องกับใบสั่งซื้อ
    const orderDetails = await Promise.all(result.map(async (order) => {
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
      SELECT order_ID, order_user_ID, date, order_stat_ID, total
      FROM orders
      WHERE order_ID = ?;
    `;
    const [order] = await db.promise().query(query, [order_ID]);

    if (order.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลใบสั่งซื้อ" });
    }

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
