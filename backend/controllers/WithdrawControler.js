const db = require("../config/db");
require("dotenv").config();
const multer = require("multer");
const path = require("path");

const getWithdrawReq = async (req, res) => {
  try {
    const query = `SELECT 
      requisition_ID,
      requisition_Date,
      requisition_mainr_ID,
      requisition_user_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      status.stat_Name AS statusRequis,
      COUNT(requisition_ID) AS countlist
  FROM 
      requisition
      INNER JOIN maintenancerequests on maintenancerequests.mainr_ID = requisition.requisition_mainr_ID
      INNER JOIN users on users.user_ID = requisition.requisition_user_ID
      INNER JOIN status  ON status.stat_ID = requisition.requisition_stat_ID
      INNER JOIN requisition_list on requisition_list.reqlist_requisition_ID = requisition.requisition_ID
      WHERE maintenancerequests.mainr_Stat_ID = "STA000023"
      AND requisition.requisition_stat_ID = "STA000020"

 GROUP BY requisition_ID
        `;
    //STA000023 = กำลังดำเนินการตรวจสอบ
    //STA000020 = ยังไม่เบิก
    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      requisition_Date:
        new Date(item.requisition_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.requisition_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getWithdrawReqlist = async (req, res) => {
  try {
    const RequeiId = req.query.id;

    if (!RequeiId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }

    const query = `SELECT requisition_ID,
    requisition_Date,
    requisition_mainr_ID,
    requisition_user_ID,
    CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
    statusRequi.stat_Name AS statusRequis,
    requisition_list.reqlist_order AS listnumber,
    requisition_list.reqlist_stock_ID AS stockid,
    stock.name AS stockname,
    requisition_list.quantity AS withdrawquantity,
    stock.quantity AS stockquantity,
    unit.name AS unit,
    statusRequilist.stat_Name AS statusRequislist,
    CASE 
        WHEN stock.quantity < requisition_list.quantity THEN requisition_list.quantity - stock.quantity 
        ELSE 0 
    END AS stockbroken
FROM 
    requisition
    INNER JOIN maintenancerequests on maintenancerequests.mainr_ID = requisition.requisition_mainr_ID
    INNER JOIN users on users.user_ID = requisition.requisition_user_ID
    INNER JOIN status statusRequi ON statusRequi.stat_ID = requisition.requisition_stat_ID
    INNER JOIN requisition_list on requisition_list.reqlist_requisition_ID = requisition.requisition_ID
    INNER JOIN stock on stock.ID = requisition_list.reqlist_stock_ID
    INNER JOIN status statusRequilist on statusRequilist.stat_ID = requisition.requisition_stat_ID
    INNER JOIN unit on unit.ID = stock.stock_unit_ID
WHERE maintenancerequests.mainr_Stat_ID = "STA000023"
OR maintenancerequests.mainr_Stat_ID = "STA000013"
OR maintenancerequests.mainr_Stat_ID = "STA000014"
AND requisition_ID =  ?
      `;
    //STA000023 = กำลังดำเนินการตรวจสอบ
    //STA000013 = รอนัด
    //STA000014 = รอซ่อม
    const [result] = await db.promise().query(query, [RequeiId]);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งเบิก" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      requisition_Date:
        new Date(item.requisition_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.requisition_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const putReqWithdraw = async (req, res) => {
  const { requisitionID, Withdrawtatus_ID = "STA000019", mainr_ID } = req.body;  //STA000019 = รอเบิก

  try {
    if (!requisitionID) {
      return res.status(400).json({ error: "โปรดระบุ requisitionID" });
    }
    if (!mainr_ID) {
      return res.status(400).json({ error: "โปรดระบุ requisitionID" });
    }

    const updateQuery = `
      UPDATE requisition 
      SET requisition_stat_ID = ? 
      WHERE requisition_ID = ?
    `;
    await db.promise().query(updateQuery, [Withdrawtatus_ID, requisitionID]);

    const getStockQuery = `
      SELECT reqlist_stock_ID, quantity 
      FROM requisition_list 
      WHERE reqlist_requisition_ID = ?
    `;
    const [stockItems] = await db
      .promise()
      .query(getStockQuery, [requisitionID]);

    for (const item of stockItems) {
      const { reqlist_stock_ID, quantity } = item;

      const [stock] = await db.promise().query(
        `
        SELECT quantity FROM stock WHERE ID = ?
      `,
        [reqlist_stock_ID]
      );

      if (stock[0].quantity < quantity) {
        return res.status(400).json({
          error: `สต็อกไม่เพียงพอสำหรับวัสดุ ID: ${reqlist_stock_ID}`,
        });
      }

      const updateStockQuery = `
        UPDATE stock 
        SET quantity = quantity - ? 
        WHERE ID = ?
      `;
      await db.promise().query(updateStockQuery, [quantity, reqlist_stock_ID]);
    }
    const updatemaintenancerequests = `
    UPDATE maintenancerequests 
    SET mainr_Stat_ID = "STA000013"
    WHERE mainr_ID = ?
  `;
    await db.promise().query(updatemaintenancerequests, [mainr_ID]);
    //STA000013 = รอนัด
    res.status(200).json({ message: "รับเรื่องเบิกวัสดุเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getWithdraw = async (req, res) => {
  try {
    const query = `SELECT 
      requisition_ID,
      requisition_Date,
      requisition_mainr_ID,
      requisition_user_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      status.stat_Name AS statusRequis,
      COUNT(requisition_ID) AS countlist
  FROM 
      requisition
      INNER JOIN maintenancerequests on maintenancerequests.mainr_ID = requisition.requisition_mainr_ID
      INNER JOIN users on users.user_ID = requisition.requisition_user_ID
      INNER JOIN status  ON status.stat_ID = requisition.requisition_stat_ID
      INNER JOIN requisition_list on requisition_list.reqlist_requisition_ID = requisition.requisition_ID
      WHERE maintenancerequests.mainr_Stat_ID = "STA000013"
      OR maintenancerequests.mainr_Stat_ID = "STA000014"
      AND requisition.requisition_stat_ID = "STA000019"

 GROUP BY requisition_ID
        `;

        //STA000013 = รอนัด
        //STA000014 = รอซ่อม
        //STA000019 = รอเบิก
    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      requisition_Date:
        new Date(item.requisition_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.requisition_Date).toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const putAcceptWithdraw = async (req, res) => {
  const {
    requisitionID,
    statusRequisition = "STA000021",
    statusRequisitionList = "STA000021",
  } = req.body;
        //STA000021 = เบิกเสร็จสิ้น
  try {
    if (!requisitionID) {
      return res.status(400).json({ error: "โปรดระบุ requisitionID" });
    }

    const updateRequisitionQuery = `
      UPDATE requisition 
      SET requisition_stat_ID = ? 
      WHERE requisition_ID = ?
    `;
    await db
      .promise()
      .query(updateRequisitionQuery, [statusRequisition, requisitionID]);

    const getRequisitionListQuery = `
      SELECT reqlist_stock_ID 
      FROM requisition_list 
      WHERE reqlist_requisition_ID = ?
    `;
    const [requisitionList] = await db
      .promise()
      .query(getRequisitionListQuery, [requisitionID]);

    for (const item of requisitionList) {
      const { reqlist_stock_ID } = item;

      const updateRequisitionListQuery = `
        UPDATE requisition_list 
        SET reqlist_stat_ID = ?
        WHERE reqlist_stock_ID = ? AND reqlist_requisition_ID = ?
      `;
      await db
        .promise()
        .query(updateRequisitionListQuery, [
          statusRequisitionList,
          reqlist_stock_ID,
          requisitionID,
        ]);
    }

    res.status(200).json({ message: "รับเรื่องเบิกวัสดุเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const cancelWithdraw = async (req, res) => {
  const { requisitionID, cancelStatusID = "STA000024" } = req.body;

  try {
    if (!requisitionID) {
      return res.status(400).json({ error: "โปรดระบุ requisitionID" });
    }

    const updateRequisitionQuery = `
      UPDATE requisition 
      SET requisition_stat_ID = ? 
      WHERE requisition_ID = ?
    `;
    await db
      .promise()
      .query(updateRequisitionQuery, [cancelStatusID, requisitionID]);

    const getRequisitionListQuery = `
      SELECT reqlist_stock_ID, quantity 
      FROM requisition_list 
      WHERE reqlist_requisition_ID = ?
    `;
    const [requisitionList] = await db
      .promise()
      .query(getRequisitionListQuery, [requisitionID]);

    for (const item of requisitionList) {
      const { reqlist_stock_ID, quantity } = item;

      const updateStockQuery = `
        UPDATE stock 
        SET quantity = quantity + ? 
        WHERE ID = ?
      `;
      await db.promise().query(updateStockQuery, [quantity, reqlist_stock_ID]);
    }

    res.status(200).json({ message: "ยกเลิกการเบิกวัสดุเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};






module.exports = {
  getWithdrawReq,
  getWithdrawReqlist,
  putReqWithdraw,
  getWithdraw,
  putAcceptWithdraw,
  cancelWithdraw,

};
