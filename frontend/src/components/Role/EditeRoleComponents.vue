<template>
  <div>
    <WidgetsStatsD class="mb-4" />
    <CRow>
      <CCol :md="12">
        <CCard class="mb-4">
          <CCardHeader>แก้ไขข้อมูลบทบาท</CCardHeader>
          <CCardBody>
            <CForm class="row g-3 needs-validation" novalidate @submit="handleSubmitRole">
              <CCol md="12">
                <CRow class="mb-3">
                  <CCol md="2">
                    <CFormLabel for="role_ID">รหัสบทบาท</CFormLabel>
                    <CFormInput v-model="role_ID" type="text" id="role_ID" disabled />
                  </CCol>
                  <CCol md="3" class="position-relative">
                    <CFormLabel for="role_Name">ชื่อบทบาท</CFormLabel>
                    <CFormInput v-model="role_Name" type="text" id="role_Name" required :class="{ 'is-invalid': isRoleNameInvalid }" />
                    <CFormFeedback invalid>{{ roleErrorMessage }}</CFormFeedback>
                  </CCol>
                </CRow>
              </CCol>
              <CRow class="mb-3">
                <CCol md="12">
                  <CFormLabel>กำหนดสิทธิ์:</CFormLabel>
                  <CRow>
                    <template v-for="(permission, index) in permissionsList" :key="index">
                      <CCol md="3">
                        <CFormCheck
                          :id="'permission' + index"
                          :value="1"
                          :checked="selectedPermissions[index] === 1" 
                          @change="togglePermission(index)"
                          :disabled="index < 2" 
                        />
                        <CFormLabel :for="'permission' + index">{{ permission }}</CFormLabel>
                      </CCol>
                    </template>
                  </CRow>
                </CCol>
              </CRow>
              <CButton type="submit" color="primary" :disabled="isRoleNameInvalid">บันทึก</CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

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
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { useRoute, useRouter } from "vue-router";

export default {
  name: "EditRoleComponent",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const role_ID = ref(route.query.id || "");
    const permissionname = ref("");
    const role_Name = ref("");
    const selectedPermissions = ref(Array(41).fill(0));
    const permissionsBinary = ref("");
    const toasts = ref([]);
    const permissionsList = [
      "ล็อคเอาท์", "หน้าจอหลัก", "หน้าเเสดงผลผู้ใช้", "หน้าเเสดงผลแอ็ดมิน",
      "หน้าเเสดงผลช่าง", "หน้าเเสดงผลนิติ", "ประวัติการแจ้งซ่อม", "ส่งคำร้องแจ้งซ่อม",
      "คำขอร้องแจ้งซ่อม", "รับคำขอร้องแจ้งซ่อม", "การเบิกวัสดุ", "นัดเวลาเข้าซ่อม",
      "จัดการผู้ใช้งาน", "เพิ่มผู้ใช้งาน", "แก้ไขผู้ใช้งาน", "จัดการห้องพัก",
      "เพิ่มห้องพัก", "แก้ไขห้องพัก", "จัดการคลังวัสดุ", "เพิ่มคลังวัสดุ",
      "แก้ไขคลังวัสดุ", "จัดการประเภทวัสดุ", "เพิ่มประเภทวัสดุ", "แก้ไขประเภทวัสดุ",
      "จัดการสถานะ", "เพิ่มสถานะ", "แก้ไขสถานะ", "จัดการประเภทสถานะ",
      "เพิ่มประเภทสถานะ", "แก้ไขประเภทสถานะ", "จัดการหน่วย", "เพิ่มหน่วย",
      "แก้ไขหน่วย", "จัดการตำแหน่ง", "เพิ่มตำแหน่ง", "แก้ไขตำแหน่ง",
      "การเช่า", "เพิ่มการเช่า", "จัดการประเภทคำร้อง", "เพิ่มประเภทคำร้อง", "แก้ไขประเภทคำร้อง"
    ];

    const isRoleNameInvalid = computed(() => role_Name.value.trim() === "");

    const roleErrorMessage = computed(() => {
      return role_Name.value.trim() === "" ? "กรุณากรอกชื่อบทบาท" : "";
    });

    const handleSubmitRole = async (event) => {
      event.preventDefault();
      if (isRoleNameInvalid.value) return;

      try {
        const payload = {
          role_name: role_Name.value,
          permission_name: selectedPermissions.value.join(''),
        };
        await axios.put(`/api/auth/updateRole?role_ID=${role_ID.value}&permission_ID=${permissionname.value}`, payload);
        toasts.value.push({
          title: "สำเร็จ",
          content: "ข้อมูลถูกบันทึกเรียบร้อยแล้ว",
        });
        setTimeout(() => {
          router.push("ViewRoleView");
        }, 1000);
      } catch (error) {
        toasts.value.push({
          title: "ข้อผิดพลาด",
          content: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
        });
      }
    };

    const fetchRoleByID = async (rid) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getRoleByID", {
          params: { ID: rid },
          headers: { Authorization: `Bearer ${token}` },
        });
        const roleData = response.data;
        role_Name.value = roleData.role_Name || "";
        permissionname.value = roleData.role_permissions || "";
        selectedPermissions.value = roleData.permission_name
          .split("")
          .map((bit) => parseInt(bit));
      } catch (error) {
        console.error("Error fetching role data:", error);
        toasts.value.push({
          title: "ข้อผิดพลาด",
          content: "ไม่สามารถดึงข้อมูลบทบาทได้",
        });
      }
    };

    const togglePermission = (index) => {
      selectedPermissions.value[index] = selectedPermissions.value[index] === 1 ? 0 : 1;
    };

    onMounted(() => {
      fetchRoleByID(role_ID.value);
    });

    return {
      role_ID,
      role_Name,
      permissionsList,
      selectedPermissions,
      toasts,
      handleSubmitRole,
      isRoleNameInvalid,
      roleErrorMessage,
      togglePermission,
      permissionname
    };
  },
};
</script>
