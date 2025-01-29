<template>
  <div>
    <WidgetsStatsD class="mb-4" />
    <CRow>
      <CCol :md="12">
        <CCard class="mb-4">
          <CCardHeader>จัดการบทบาท</CCardHeader>
          <CCardBody>
            <CForm class="row g-2 needs-validation" novalidate @submit="handleSubmitRole">
              <CCol md="12">
                <CRow class="mb-3">
                  <CCol md="2">
                    <CFormLabel for="roleID">รหัสบทบาท</CFormLabel>
                    <CFormInput v-model="autoID" type="text" id="roleID" disabled />
                  </CCol>
                  <CCol md="5">
                    <CFormLabel for="roleName">ชื่อบทบาท</CFormLabel>
                    <CFormInput
                      v-model="roleName"
                      type="text"
                      id="roleName"
                      required
                      :class="{ 'is-invalid': isRoleInvalid }"
                    />
                    <CFormFeedback invalid>
                      {{ roleErrorMessage }}
                    </CFormFeedback>
                  </CCol>
                </CRow>

                
                <CRow class="mb-3">
                  <CCol md="2">
                    <CFormLabel for="permission_name">รหัสบทบาท</CFormLabel>
                    <CFormInput v-model="autoIDPEr" type="text" id="permission_name" disabled />
                  </CCol>
                  <CCol md="12">
                    <CFormLabel>กำหนดสิทธิ์:</CFormLabel>
                    <CRow>
                      <template v-for="(permission, index) in permissionsList" :key="index">
                        <CCol md="3">
                          <CFormCheck
                            :id="'permission' + index"
                            :value="index"
                            v-model="selectedPermissions"
                            :disabled="index < 2"
                            :checked="index < 2" 
                          />
                          <CFormLabel :for="'permission' + index">{{ permission }}</CFormLabel>
                        </CCol>
                      </template>
                    </CRow>
                  </CCol>
                </CRow>

                <CFormInput v-if="visible" v-model="token" type="text" id="token" />
              </CCol>
              <CButton type="submit" color="primary">บันทึก</CButton>
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
import { ref, computed, onMounted ,watch} from "vue";
import axios from "axios";


export default {
  name: "RegisRoleComponent",
  setup() {
    const autoID = ref("");
    const autoIDPEr = ref("");
    const roleName = ref("");
    const validatedTooltip = ref(false);
    const toasts = ref([]);
    const selectedPermissions = ref([0, 1]); 
    const permissionsBinary = ref(""); 
    const permissionsList = [
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
    ];

    
    const isRoleInvalid = computed(() => {
      return validatedTooltip.value && roleName.value.trim() === "";
    });

    const roleErrorMessage = computed(() => {
      if (roleName.value.trim() === "") {
        return "กรุณากรอกชื่อบทบาท";
      } 
      return "";
    });

    const handleSubmitRole = (event) => {
      validatedTooltip.value = true;

      if (isRoleInvalid.value) {
        event.preventDefault();
        event.stopPropagation();
      } else {
        handleSubmit();
      }
    };

    const handleSubmit = async () => {
      try {
        const response = await axios.post("/api/auth/registerRole", {
          role_Name: roleName.value,
          permission_name: permissionsBinary.value, 
        });
        createToast("Success", response.data.message);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        let errorMessage = "เกิดข้อผิดพลาดในการลงทะเบียนบทบาท";

        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }

        createToast("Error", errorMessage);
        console.error("Error:", error);
      }
    };

    const createToast = (title, content) => {
      toasts.value.push({ title, content });

      setTimeout(() => {
        toasts.value.shift();
      }, 5000);
    };

    const updatePermissions = () => {
      
      let binary = Array(permissionsList.length).fill(0);
      selectedPermissions.value.forEach(index => {
        binary[index] = 1; 
      });
      permissionsBinary.value = binary.join(''); 
    };


    const fetchAutoID = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getAutoRoleID", {
          headers: { Authorization: `Bearer ${token}` },
        });
        autoID.value = response.data;
      } catch (error) {
        handleFetchError(error, "ดึงข้อมูล ID เกิดข้อผิดพลาด:");
      }
    };

    const fetchAutoIDPer = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/auth/getAutoPermissionID", {
          headers: { Authorization: `Bearer ${token}` },
        });
        autoIDPEr.value = response.data;
      } catch (error) {
        handleFetchError(error, "ดึงข้อมูล ID เกิดข้อผิดพลาด:");
      }
    };

    const handleFetchError = (error, defaultMessage) => {
      let errorMessage = defaultMessage;
      if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      }
      console.error("Error:", errorMessage);
      createToast("Error", errorMessage);
    };

    onMounted(() => {
      fetchAutoID();
      fetchAutoIDPer();
      updatePermissions(); 
    });

    watch(selectedPermissions, () => {
      updatePermissions();
    });

    return {
      autoID,
      autoIDPEr,
      roleName,
      validatedTooltip,
      handleSubmitRole,
      isRoleInvalid,
      roleErrorMessage,
      toasts,
      permissionsList,
      selectedPermissions,
      permissionsBinary,
      updatePermissions,
    };
  }
};
</script>
