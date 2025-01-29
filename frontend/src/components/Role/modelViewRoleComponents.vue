<template>
  <div>
    <WidgetsStatsD class="mb-4" />
    <CRow>
      <CCol :md="12">
        <CCard class="mb-4">
          <CCardHeader>ข้อมูลบทบาท</CCardHeader>
          <CCardBody>
            <CForm class="row g-3 needs-validation" novalidate>
              <CCol md="12">
                <CRow class="mb-3">
                  <CCol md="3">
                    <CFormLabel for="role_ID">รหัสบทบาท</CFormLabel>
                    <CFormInput v-model="role_ID" type="text" id="role_ID" disabled />
                  </CCol>
                  <CCol md="5" class="position-relative">
                    <CFormLabel for="role_Name">ชื่อบทบาท</CFormLabel>
                    <CFormInput
                      v-model="role_Name"
                      type="text"
                      id="role_Name"
                      required
                      :class="{ 'is-invalid': isRoleNameInvalid }"
                      disabled
                    />
                    <CFormFeedback invalid>{{ roleErrorMessage }}</CFormFeedback>
                  </CCol>
                </CRow>
              </CCol>
              <CRow class="mb-3">
                <CCol md="3">
                  <CFormLabel for="permission_ID">รหัสสิทธิ์</CFormLabel>
                  <CFormInput v-model="permission_ID" type="text" id="permission_ID" disabled />
                </CCol>
                <CCol md="12">
                  <CFormLabel>กำหนดสิทธิ์:</CFormLabel>
                  <CRow>
                    <template v-for="(permission, index) in permissionsList" :key="index">
                      <CCol md="3">
                        <CFormCheck
                          :id="'permission' + index"
                          v-model="selectedPermissions[index]"
                          
                        />
                        <CFormLabel :for="'permission' + index">{{ permission }}</CFormLabel>
                      </CCol>
                    </template>
                  </CRow>
                </CCol>
              </CRow>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <!-- Notifications -->
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
import { useRoute } from "vue-router";

export default {
  name: "ModelViewRoleComponents",
  props: {
    selectedRole: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const route = useRoute();
    const role_ID = ref(props.selectedRole?.role_ID || "");
    const role_Name = ref(props.selectedRole?.role_Name || "");
    const permission_ID = ref(props.selectedRole?.permission_ID || "");
    const selectedPermissions = ref(new Array(41).fill(0));
    const toasts = ref([]);
    const permissionsList = ref([
      "ล็อคเอาท์", "หน้าจอหลัก", "หน้าเเสดงผลผู้ใข้", "หน้าเเสดงผลแอ็ดมิน",
      "หน้าเเสดงผลช่าง", "หน้าเเสดงผลนิติ", "ประวัติการแจ้งซ่อม", "ส่งคำร้องแจ้งซ่อม",
      "คำขอร้องแจ้งซ่อม", "รับคำขอร้องแจ้งซ่อม", "การเบิกวัสดุ", "นัดเวลาเข้าซ่อม",
      "จัดการผู้ใช้งาน", "เพิ่มผู้ใช้งาน", "แก้ไขผู้ใช้งาน", "จัดการห้องพัก",
      "เพิ่มห้องพัก", "แก้ไขห้องพัก", "จัดการคลังวัสดุ", "เพิ่มคลังวัสดุ",
      "แก้ไขคลังวัสดุ", "จัดการประเภทวัสดุ", "เพิ่มประเภทวัสดุ", "แก้ไขประเภทวัสดุ",
      "จัดการสถานะ", "เพิ่มสถานะ", "แก้ไขสถานะ", "จัดการประเภทสถานะ",
      "เพิ่มประเภทสถานะ", "แก้ไขประเภทสถานะ", "จัดการหน่วย", "เพิ่มหน่วย",
      "แก้ไขหน่วย", "จัดการตำแหน่ง", "เพิ่มจัดการตำแหน่ง", "แก้ไขจัดการตำแหน่ง",
      "การเช่า","เพิ่มการเช่า","จัดการประเภทคำร้อง","เพิ่มประเภทคำร้อง","แก้ไขประเภทคำร้อง"
    ]);

    const isRoleNameInvalid = computed(() => role_Name.value.trim() === "");
    const roleErrorMessage = computed(() => {
      return role_Name.value.trim() === "" ? "กรุณากรอกชื่อบทบาท" : "";
    });

    const fetchRoleByID = async (rid) => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getRoleByID", {
          params: { ID: rid },
          headers: { Authorization: `Bearer ${token}` },
        });
        const roleData = response.data;
        role_Name.value = roleData.role_Name || "";
        permission_ID.value = roleData.role_permissions || "";
        selectedPermissions.value = roleData.permission_name.split("").map((bit) => parseInt(bit));
      } catch (error) {
        console.error("Error fetching role data:", error);
        toasts.value.push({
          title: "ข้อผิดพลาด",
          content: "ไม่สามารถดึงข้อมูลบทบาทได้",
        });
      }
    };

    onMounted(() => {
      fetchRoleByID(role_ID.value);
    });

    watch(
      () => props.selectedRole,
      (newRole) => {
        role_ID.value = newRole?.role_ID || "";
        role_Name.value = newRole?.role_Name || "";
        permission_ID.value = newRole?.permission_ID || "";
      },
      { immediate: true }
    );

    return {
      role_ID,
      role_Name,
      permissionsList,
      selectedPermissions,
      toasts,
      isRoleNameInvalid,
      roleErrorMessage,
      permission_ID,
    };
  },
};
</script>
