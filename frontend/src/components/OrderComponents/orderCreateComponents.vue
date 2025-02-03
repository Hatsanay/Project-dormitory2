<template>
  <div>
    <CRow>
      <CCol :md="8">
        <CCard class="mb-4">
          <CCardHeader>รายละเอียดใบสั่งซื้อ</CCardHeader>
          <CCardBody>
            <CForm class="row g-3" @submit.prevent="confirmhandleSubmit">
              <!-- เลือกหรือพิมพ์ชื่อสินค้า -->
              <CCol :md="12">
                <CFormLabel>เลือกหรือพิมพ์ชื่อสินค้า</CFormLabel>
                <input
                  list="stockList"
                  v-model="selectedProductName"
                  @change="onProductChange"
                  class="form-control"
                  placeholder="พิมพ์หรือเลือกสินค้า"
                />
                <datalist id="stockList">
                  <option
                    v-for="product in stockList"
                    :key="product.stockid"
                    :value="product.stockname"
                  >
                    {{ product.stockname }} ({{ product.typestockname }})
                  </option>
                </datalist>
              </CCol>

              <!-- รายการสินค้า -->
              <CCol :md="12">
                <CFormLabel>รายการสินค้า</CFormLabel>
                <CInputGroup
                  v-for="(item, index) in order.items"
                  :key="index"
                  class="mb-3"
                >
                  <CFormInput
                    v-model="item.name"
                    placeholder="ชื่อสินค้า"
                    :readonly="!item.isCustom"
                    required
                  />
                  <CFormInput
                    v-model="item.quantity"
                    type="number"
                    placeholder="จำนวน"
                    min="1"
                    required
                  />
                  <CFormInput v-model="item.unit" placeholder="หน่วย" required />
                  <CFormInput
                    v-model="item.price"
                    type="number"
                    placeholder="ราคาต่อหน่วย"
                    min="0"
                    required
                  />
                  <CButton color="danger" @click="removeItem(index)"> ลบ </CButton>
                </CInputGroup>
                <CButton color="success" @click="addItem"> เพิ่มรายการสินค้า </CButton>
              </CCol>

              <!-- ปุ่มบันทึก -->
              <CCol :md="12" class="mt-4">
                <CButton type="submit" color="primary">บันทึกใบสั่งซื้อ</CButton>
              </CCol>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>

      <!-- ส่วนพรีวิวใบสั่งซื้อ -->
      <CCol :md="4">
        <CCard class="mb-4">
          <CCardHeader>พรีวิวใบสั่งซื้อ</CCardHeader>
          <CCardBody>
            <div v-if="fullName">
              <h5>ผู้ออกใบสั่งซื้อ: {{ fullName }}</h5>
              <hr />
              <h6>รายการสินค้า:</h6>
              <ul class="list-unstyled">
                <li v-for="(item, index) in order.items" :key="index" class="mb-2">
                  {{ item.name }} - {{ item.quantity }} {{ item.unit }} -
                  {{ formatCurrency(item.price * item.quantity) }}
                </li>
              </ul>
              <hr />
              <h6>รวมทั้งหมด: {{ formatCurrency(totalAmount) }}</h6>
            </div>
            <div v-else>
              <p class="text-muted">กรุณากรอกข้อมูลเพื่อดูพรีวิว</p>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- Toast สำหรับแสดงข้อความแจ้งเตือน -->
    <CToaster class="p-3" placement="top-end">
      <CToast v-for="(toast, index) in toasts" :key="index" visible>
        <CToastHeader closeButton>
          <span class="me-auto fw-bold">{{ toast.title }}</span>
        </CToastHeader>
        <CToastBody>{{ toast.content }}</CToastBody>
      </CToast>
    </CToaster>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "OrderCreate",
  setup() {
    const order = ref({
      items: [],
    });

    const userId = ref(localStorage.getItem("userID"));
    const fullName = ref("");
    const stockList = ref([]); // เก็บข้อมูลสต็อกจาก API
    const selectedProductName = ref(""); // ชื่อสินค้าที่เลือกหรือพิมพ์
    const toasts = ref([]);

    // ดึงข้อมูลสต็อกจาก API
    const fetchStock = async () => {
      try {
        const response = await axios.get("/api/auth/getStock"); // เปลี่ยนเป็น endpoint ที่ถูกต้อง
        stockList.value = response.data;
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการดึงข้อมูลสต็อก:", error);
        toasts.value.push({
          title: "ข้อผิดพลาด",
          content: "ไม่สามารถดึงข้อมูลสต็อกได้",
        });
      }
    };

    // ดึงข้อมูลผู้ใช้จาก API
    const getUserByIdfromReq = async (uid) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getUserByIdfromReq", {
          params: { id: uid },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const userData = response.data;
        fullName.value = userData.fullname || "";
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    // เมื่อเลือกหรือพิมพ์ชื่อสินค้า
    const onProductChange = () => {
      if (selectedProductName.value) {
        const selectedProduct = stockList.value.find(
          (product) => product.stockname === selectedProductName.value
        );

        if (selectedProduct) {
          // ถ้ามีใน stockList ให้ดึงข้อมูลมาใช้
          order.value.items.push({
            name: selectedProduct.stockname,
            quantity: 1,
            unit: selectedProduct.unitname,
            price: 0,
            orderlist_stock_ID: selectedProduct.stockid, // กำหนด stock_id
            isCustom: false, // ไม่สามารถแก้ไขชื่อได้
          });
        } else {
          // ถ้าไม่มีใน stockList ให้ใช้ชื่อที่พิมพ์เข้ามา
          order.value.items.push({
            name: selectedProductName.value,
            quantity: 1,
            unit: "",
            price: 0,
            orderlist_stock_ID: null, // ถ้าเป็นสินค้าที่พิมพ์เองให้เป็น NULL
            isCustom: true, // สามารถแก้ไขชื่อได้
          });
        }
        selectedProductName.value = ""; // ล้างการเลือก
      }
    };

    // เพิ่มรายการสินค้า
    const addItem = () => {
      order.value.items.push({
        name: "",
        quantity: 1,
        unit: "",
        price: 0,
        isCustom: true, // สามารถแก้ไขชื่อได้
      });
    };

    // ลบรายการสินค้า
    const removeItem = (index) => {
      order.value.items.splice(index, 1);
    };

    // คำนวณยอดรวม
    const totalAmount = computed(() => {
      return order.value.items.reduce((total, item) => {
        return total + item.quantity * item.price;
      }, 0);
    });

    // จัดรูปแบบเงิน
    const formatCurrency = (value) => {
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
      }).format(value);
    };

    // เมื่อส่งฟอร์ม
    // เมื่อส่งฟอร์ม
    const handleSubmit = async () => {
      try {
        const token = localStorage.getItem("token");
        const orderData = {
          order_user_ID: userId.value,
          date: new Date().toISOString().split("T")[0],
          order_stat_ID: 1,
          total: totalAmount.value,
          items: order.value.items.map((item) => ({
            orderlist_stock_ID: item.orderlist_stock_ID,
            stockname: item.name,
            quantity: item.quantity,
            unit: item.unit,
            price: item.price,
            totalprice: item.quantity * item.price,
          })),
        };

        console.log(orderData); // ตรวจสอบข้อมูลที่ส่งไปยังเซิร์ฟเวอร์

        // ส่งข้อมูลไปยัง API
        const response = await axios.post("/api/auth/createOrder", orderData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // เช็คสถานะของการบันทึก
        if (response.status === 201) {
          return response; // ส่งข้อมูลกลับเพื่อให้ confirmhandleSubmit ทราบว่าเสร็จสิ้น
        }
      } catch (error) {
        console.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล:", error);
        throw new Error("ไม่สามารถบันทึกข้อมูลได้");
      }
    };

    // ยืนยันการส่งข้อมูล (confirmhandleSubmit)
    const confirmhandleSubmit = async () => {
      Swal.fire({
        title: "คุณแน่ใจหรือไม่?",
        text: "คุณไม่ต้องการเบิกใช่หรือไม่?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "ตกลง",
        cancelButtonText: "ยกเลิก",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // เรียกใช้ handleSubmit เพื่อบันทึกข้อมูล
            const response = await handleSubmit();

            if (response && response.status === 201) {
              Swal.fire({
                icon: "success",
                title: "บันทึกสำเร็จ",
                text: "การใบสั่งซื้อของคุณถูกบันทึกแล้ว",
              }).then(() => {
                window.location.reload(); // รีเฟรชหน้าเว็บหลังบันทึกสำเร็จ
              });
            }
          } catch (error) {
            Swal.fire({
              icon: "error",
              title: "เกิดข้อผิดพลาด",
              text: "ไม่สามารถบันทึกข้อมูลได้",
            });
          }
        }
      });
    };

    // ดึงข้อมูลผู้ใช้และสต็อกเมื่อคอมโพเนนต์ถูกโหลด
    onMounted(() => {
      if (userId.value) {
        getUserByIdfromReq(userId.value);
      }
      fetchStock();
    });

    return {
      order,
      fullName,
      stockList,
      selectedProductName,
      toasts,
      onProductChange,
      addItem,
      removeItem,
      totalAmount,
      formatCurrency,
      handleSubmit,
      confirmhandleSubmit,
    };
  },
};
</script>

<style scoped>
.list-unstyled {
  padding-left: 0;
  list-style: none;
}
</style>
