const db = require("../config/db");
require("dotenv").config();

const getReq = async (req, res) => {
  try {
    const query = `SELECT
      mainr_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      room.room_Number AS roomNumber,
      mainr_ProblemTitle,
      mainr_ProblemDescription,
      mainr_Date,
      petitiontype.Type AS Type,
      status.stat_Name AS status
    FROM 
      maintenancerequests
        INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
        INNER JOIN users on users.user_ID = renting.renting_user_ID
        INNER JOIN petitiontype on petitiontype.ID = mainr_pattyp_ID
        INNER JOIN status on status.stat_ID = maintenancerequests.mainr_Stat_ID
        INNER JOIN room on room.room_ID = renting.renting_room_ID
    WHERE
      maintenancerequests.mainr_Stat_ID = "STA000011"
    ORDER BY
      maintenancerequests.mainr_ID ASC
    `;
    //STA000011 = รอนิติบุคคลตรวจสอบ

    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
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

const denyReq = async (req, res) => {
  const { mainr_ID, mainrstatus_ID = "STA000018" } = req.body; //STA000018 = เจ้าหน้าที่ปฎิเสธคำร้อง

  try {
    if (!mainr_ID) {
      return res.status(400).json({ error: "โปรดระบุ mainr_ID" });
    }

    const updateQuery = `
        UPDATE maintenancerequests SET
        mainr_Stat_ID = ?
        WHERE mainr_ID = ?
      `;

    await db.promise().query(updateQuery, [mainrstatus_ID, mainr_ID]);

    res.status(200).json({ message: "ยกเลิกการแจ้งซ่อมเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const sendtomacReq = async (req, res) => {
  const { mainr_ID, mainrstatus_ID = "STA000012" } = req.body; //STA000012 = รอเจ้าหน้าที่ซ่อมบำรุงตรวจสอบ

  try {
    if (!mainr_ID) {
      return res.status(400).json({ error: "โปรดระบุ mainr_ID" });
    }

    const updateQuery = `
        UPDATE maintenancerequests SET
        mainr_Stat_ID = ?
        WHERE mainr_ID = ?
      `;

    await db.promise().query(updateQuery, [mainrstatus_ID, mainr_ID]);

    res.status(200).json({ message: "ยกเลิกการแจ้งซ่อมเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getMacReq = async (req, res) => {
  try {
    const query = `SELECT
        mainr_ID,
        CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
        room.room_Number AS roomNumber,
        mainr_ProblemTitle,
        mainr_ProblemDescription,
        mainr_Date,
        petitiontype.Type AS Type,
        status.stat_Name AS status
      FROM 
        maintenancerequests
        INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
        INNER JOIN users ON users.user_ID = renting.renting_user_ID
        INNER JOIN petitiontype ON petitiontype.ID = mainr_pattyp_ID
        INNER JOIN status ON status.stat_ID = maintenancerequests.mainr_Stat_ID
        INNER JOIN room ON room.room_ID = renting.renting_room_ID
        LEFT JOIN assessproblem ON assessproblem.asp_mainr_ID = maintenancerequests.mainr_ID
      WHERE
        maintenancerequests.mainr_Stat_ID = "STA000012"
        AND assessproblem.asp_mainr_ID IS NULL
      ORDER BY
        maintenancerequests.mainr_ID ASC
    `;
    //STA000012 = รอเจ้าหน้าที่ซ่อมบำรุงตรวจสอบ

    const [result] = await db.promise().query(query);
    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
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

const getMacReqById = async (req, res) => {
  try {
    // const userId = req.query.id;

    // if (!userId) {
    //   return res.status(400).json({ error: "โปรดระบุ id" });
    // }

    const query = `
    SELECT
      mainr_ID,
      CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
      room.room_Number AS roomNumber,
      mainr_ProblemTitle,
      mainr_ProblemDescription,
      mainr_Date,
      petitiontype.Type AS Type,
      status.stat_Name AS status,
      assessproblem.asp_detail AS detail
    FROM 
      maintenancerequests
        INNER JOIN renting on renting.renting_ID = maintenancerequests.mainr_renting_ID
        INNER JOIN users on users.user_ID = renting.renting_user_ID
        INNER JOIN petitiontype on petitiontype.ID = mainr_pattyp_ID
        INNER JOIN status on status.stat_ID = maintenancerequests.mainr_Stat_ID
        INNER JOIN room on room.room_ID = renting.renting_room_ID
        INNER JOIN assessproblem ON assessproblem.asp_mainr_ID = maintenancerequests.mainr_ID
    WHERE
      maintenancerequests.mainr_Stat_ID = "STA000012"
    ORDER BY
      maintenancerequests.mainr_ID ASC
    `;
    //STA000012 = รอเจ้าหน้าที่ซ่อมบำรุงตรวจสอบ

    const [result] = await db.promise().query(query);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
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

const sendAssessProblemReq = async (req, res) => {
  const { mainr_ID, assessProblemText, userID } = req.body;
  try {
    const insertQuery = `
            INSERT INTO assessproblem
            (asp_mainr_ID, asp_detail, asp_user_id)
            VALUES (?, ?, ?)
        `;
    await db
      .promise()
      .query(insertQuery, [mainr_ID, assessProblemText, userID]);

    res.status(201).json({ message: "ส่งประเมิณปัญหาเรียบร้อยแล้ว!" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const getStock = async (req, res) => {
  try {
    const query = `
      SELECT 
        stock.ID AS stockid,
        stock.name AS stockname,
        stock.quantity AS stockquantity,
        unit.name AS unitname,
        type_stock.name AS typestockname
      FROM 
        stock
      INNER JOIN unit on unit.ID = stock.stock_unit_ID
      INNER JOIN type_stock on type_stock.ID = stock.stock_type_stock_ID
    `;

    const [result] = await db.promise().query(query);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลสต็อก" });
    }

    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

const submitRequisition = async (req, res) => {
  const { requisition_mainr_ID, requisition_user_ID, stockItems } = req.body;

  if (
    !requisition_mainr_ID ||
    !requisition_user_ID ||
    !stockItems ||
    stockItems.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "ข้อมูลไม่ครบ กรุณาตรวจสอบข้อมูลที่ส่งมาด้วย" });
  }

  try {
    // ดึงค่า requisition_ID ล่าสุด
    const query =
      "SELECT requisition_ID FROM requisition ORDER BY requisition_ID DESC LIMIT 1";
    const [result] = await db.promise().query(query);
    let maxId;
    if (result.length === 0) {
      maxId = 0;
    } else {
      const lastRequisitionId = result[0].requisition_ID;
      maxId = parseInt(lastRequisitionId.slice(-6)) || 0;
    }
    const num = maxId + 1;
    const requisition_ID = "REQ" + String(num).padStart(6, "0");

    // เก็บวันที่ปัจจุบัน
    const now = new Date();
    const reqDate = now.toISOString().slice(0, 19).replace("T", " ");

    // บันทึกข้อมูลในตาราง requisition
    const insertRequisitionQuery = `
      INSERT INTO requisition (requisition_ID, requisition_Date, requisition_mainr_ID, requisition_user_ID, requisition_stat_ID)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.promise().query(insertRequisitionQuery, [
      requisition_ID,
      reqDate,
      requisition_mainr_ID,
      requisition_user_ID,
      "STA000020", // สถานะเริ่มต้น "ยังไม่เบิก"
    ]);


    // บันทึกข้อมูลในตาราง reqlist (รายละเอียดการเบิก)
    const insertReqlistQuery = `
      INSERT INTO requisition_list (reqlist_order, reqlist_stock_ID, reqlist_requisition_ID, quantity , reqlist_stat_ID)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (let i = 0; i < stockItems.length; i++) {
      const { stockID, quantity, quantity_orders } = stockItems[i];
      const reqlist_order = i + 1; // ลำดับรายการ

      // ตรวจสอบว่ามีรายการสั่งเพิ่มหรือไม่
      let statID;
      if (quantity_orders && quantity_orders > 0) {
        statID = "STA000022"; // ถ้ามี quantity_orders มากกว่า 0 เปลี่ยนเป็น "รอสั่งซื้อ"
      } else {
        statID = "STA000019"; // ถ้าไม่มีสั่งเพิ่มให้สถานะเป็น "รอเบิก"
      }

      await db.promise().query(insertReqlistQuery, [
        reqlist_order,
        stockID,
        requisition_ID,
        quantity,
        statID, // สถานะที่กำหนดตามเงื่อนไข
      ]);

      const updateQuery = `
      UPDATE maintenancerequests SET
      mainr_Stat_ID = ?
      WHERE mainr_ID = ?
    `;

      await db.promise().query(updateQuery, [ "STA000023", requisition_mainr_ID]);
    }
    //STA000023 = กำลังดำเนินการตรวจสอบ

    res.status(201).json({ message: "บันทึกข้อมูลการเบิกวัสดุสำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" });
  }
};


const getSuccessReq = async (req, res) => {
  try {
    const userId = req.query.id;

    if (!userId) {
      return res.status(400).json({ error: "โปรดระบุ id" });
    }

    const query = `
    SELECT
    maintenancerequests.mainr_ID,
    CONCAT(users.user_Fname, ' ', users.user_Lname) AS fullname,
    room.room_Number AS roomNumber,
    maintenancerequests.mainr_ProblemTitle,
    maintenancerequests.mainr_ProblemDescription,
    maintenancerequests.mainr_Date,
    petitiontype.Type AS Type,
    status.stat_Name AS status,
    CONCAT(
        MIN(schedulerepairs.Date), ' ', 
        MIN(schedulerepairs.startTime), ' - ', 
        MIN(schedulerepairs.endTime)
    ) AS scheduleTime,
    MIN(schedulerepairs.Date) AS Date,
    MIN(schedulerepairs.startTime) AS startTime,
    MIN(schedulerepairs.endTime) AS endTime
FROM 
    maintenancerequests
    INNER JOIN renting ON renting.renting_ID = maintenancerequests.mainr_renting_ID
    INNER JOIN users ON users.user_ID = renting.renting_user_ID
    INNER JOIN petitiontype ON petitiontype.ID = maintenancerequests.mainr_pattyp_ID
    INNER JOIN status ON status.stat_ID = maintenancerequests.mainr_Stat_ID
    INNER JOIN room ON room.room_ID = renting.renting_room_ID
    LEFT JOIN schedulerepairs ON schedulerepairs.sdr_mainr_ID = maintenancerequests.mainr_ID
    LEFT JOIN scheculerepairsn_list ON scheculerepairsn_list.srl_sdr_ID = schedulerepairs.ID
WHERE
    scheculerepairsn_list.srl_user_ID = ? 
    AND maintenancerequests.mainr_Stat_ID IN ('STA000014', 'STA000015')
GROUP BY
    maintenancerequests.mainr_ID
ORDER BY
    maintenancerequests.mainr_ID ASC;

    `;
    //STA000014 = รอซ่อม
    //STA000015 = กำลังดำเนินการซ่อม


    const [result] = await db.promise().query(query, [userId]);

    if (result.length === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลการแจ้งซ่อม" });
    }
    const formattedResult = result.map((item) => ({
      ...item,
      mainr_Date:
        new Date(item.mainr_Date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }) +
        " " +
        new Date(item.mainr_Date).toLocaleTimeString("th-TH", {
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

const getStatusReq = async (req, res) => {
  try {
    const query = `SELECT * FROM status 
    WHERE stat_ID = "STA000014"
    OR stat_ID = "STA000015"
    OR stat_ID = "STA000016"
    `;
    const [result] = await db.promise().query(query);
    res.status(200).json(result);
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};
    //STA000014 = รอซ่อม
    //STA000015 = กำลังดำเนินการซ่อม
    //STA000016 = เสร็จสิ้น

const updateStatusReq = async (req, res) => {
  const { mainr_ID, mainrstatus_ID } = req.body;

  try {
    if (!mainr_ID || !mainrstatus_ID) {
      return res.status(400).json({ error: "โปรดระบุ mainr_ID และ mainrstatus_ID" });
    }

    let updateQuery = `
      UPDATE maintenancerequests 
      SET mainr_Stat_ID = ?
      WHERE mainr_ID = ?
    `;

    const queryParams = [mainrstatus_ID, mainr_ID];

    if (mainrstatus_ID === "STA000016") {
      updateQuery = `
        UPDATE maintenancerequests 
        SET mainr_Stat_ID = ?, mainr_SuccessDate = NOW()
        WHERE mainr_ID = ?
      `;
    }

    const [result] = await db.promise().query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่พบข้อมูลที่ต้องการอัปเดต" });
    }

    res.status(200).json({ message: "สถานะการแจ้งซ่อมถูกอัปเดตเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("เกิดข้อผิดพลาด:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" });
  }
};

module.exports = {
  getReq,
  denyReq,
  sendtomacReq,
  getMacReq,
  sendAssessProblemReq,
  getMacReqById,
  getStock,
  submitRequisition,
  getSuccessReq,
  getStatusReq,
  updateStatusReq,
};
