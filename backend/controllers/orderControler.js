const db = require("../config/db");

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

const getPendingOrders = async (req, res) => {
  // ดึงค่าจาก query parameters ที่ส่งมาจาก frontend
  const { limit, offset, search } = req.query;

  // สร้างเงื่อนไขสำหรับการค้นหาข้อมูล
  // ถ้ามีการส่งคำค้นหามา (search query) จะทำการสร้างเงื่อนไขค้นหาด้วย LIKE
  // โดยใช้คำค้นหาในฟิลด์ order_ID, order_user_ID, date, ชื่อผู้ใช้, และสถานะ
  // หากไม่มีการค้นหาจะไม่ใช้เงื่อนไขการค้นหานี้
  const searchCondition = search ? `AND (order_ID LIKE ? OR order_user_ID LIKE ? OR date LIKE ? OR CONCAT(users.user_Fname, ' ', users.user_Lname) LIKE ? OR staorder.StaOrder_Name LIKE ?)` : "";
  const searchValue = search ? [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`] : [];

  try {
    // สร้าง SQL query สำหรับดึงข้อมูลใบสั่งซื้อที่ยังไม่อนุมัติ
    // โดยการกรองข้อมูลที่มี `order_stat_ID` เป็น 'SOD000002' (สถานะยังไม่ได้อนุมัติ)
    // ใช้คำค้นหาหากมีการส่งมาจาก frontend
    // ใช้ LIMIT และ OFFSET เพื่อกำหนดจำนวนแถวที่ต้องการแสดงผลตามที่ frontend ระบุ
    const query = `
      SELECT order_ID, 
             order_user_ID,
             CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
             date,
             staorder.StaOrder_Name AS status,
             total
      FROM orders
      INNER JOIN users on users.user_ID = orders.order_user_ID
      INNER JOIN staorder on staorder.StaOrder_ID = orders.order_stat_ID
      WHERE order_stat_ID IN ('SOD000002') ${searchCondition}
      LIMIT ? OFFSET ?;
    `;
    
    // รัน query ในฐานข้อมูลและส่งค่าผลลัพธ์มาให้
    const [result] = await db.promise().query(query, [...searchValue, parseInt(limit), parseInt(offset)]);

    // หากไม่พบข้อมูลที่ตรงกับเงื่อนไข
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }

    // แปลงรูปแบบวันที่ให้เป็นวันที่ในรูปแบบไทย
    const formattedResult = result.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    }));

    // ส่งผลลัพธ์กลับไปที่ frontend ในรูปแบบ JSON
    res.status(200).json(formattedResult);
  } catch (err) {
    // ถ้ามีข้อผิดพลาดในการดึงข้อมูลจากฐานข้อมูล
    // จะแสดงข้อผิดพลาดใน console และส่งสถานะ 500 (Internal Server Error) พร้อมข้อความ
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Error fetching orders" });
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
  getPendingOrders
};
