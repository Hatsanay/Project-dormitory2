<template>
  <div>
    <ul class="nav nav-tabs">
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '1' }"
          @click.prevent="setActiveTab('1')"
          href="#"
        >
          <i class="fa-solid fa-circle-check"></i>
          อนุมัติใบสั่งซื้อ
        </a>
      </li>
      <li class="nav-item">
        <a
          class="nav-link"
          :class="{ active: activeTab === '2' }"
          @click.prevent="setActiveTab('2')"
          href="#"
        >
          <i class="fa-solid fa-clock-rotate-left"></i>
          อนุมัติใบสั่งซื้อ
        </a>
      </li>
    </ul>

    <div class="tab-content mt-3">
      <!-- Tab 1 -->
      <div v-if="activeTab === '1'" class="tab-pane active"></div>

      <!-- Tab 2 -->
      <div v-if="activeTab === '2'" class="tab-pane active"></div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from "vue";
// import axios from "axios";
import VueEasyLightbox from "vue-easy-lightbox";
// import Swal from "sweetalert2";

export default {
  name: "approveOrderManage",
  components: {
    VueEasyLightbox,
  },
  setup() {
    const activeTab = ref("1");

    const setActiveTab = (tab) => {
      activeTab.value = tab;
      if (tab === "1") {
      } else if (tab === "2") {
      }
    };

    onMounted(() => {});

    return {
      activeTab,
      setActiveTab,
    };
  },
};
</script>

<style scoped>
.card-body p {
  margin: 0;
}

.date {
  font-weight: bold;
  color: white;
}

.cancelButton {
  color: white;
}
.frontwhite {
  color: white;
}

.status {
  font-size: 18px;
  color: rgb(228, 148, 0);
  text-align: right;
  margin-top: 10px;
}

.card-modern {
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

.card-modern:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.card-header-modern {
  color: white;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  padding: 10px;
}

.card-title-modern {
  font-size: 1.2rem;
  font-weight: bold;
}

.date-modern {
  font-weight: bold;
  color: #e0e0e0;
}

.status-modern {
  font-size: 16px;
  color: #ff9800;
  text-align: right;
}

.cancelButton-modern {
  width: 100%;
  color: white;
  background-color: #f44336;
  border-radius: 5px;
  padding: 10px;
}

.card-footer-modern {
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.btnAdd {
  margin-bottom: 10px;
}
.btn-modern {
  background-color: #6c757d;
  color: white;
  padding: 8px 16px;
  border-radius: 5px;
  transition: background-color 0.3s ease;
}

.btn-modern:hover {
  background-color: #5a6268;
}

.form-select-modern {
  border-radius: 5px;
  padding: 5px;
  border: 1px solid #ced4da;
}

/* Custom styles */

.swal2-popup {
  max-width: 195vw; /* กำหนดให้ SweetAlert2 มีขนาดสูงสุด 95% ของหน้าจอ */
}
.swal2-input {
  padding: 16px;
  height: 500px;
  border: 2px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}

.swal2-radio {
  margin-right: 10px;
}

.swal2-radio + label {
  margin-bottom: 8px;
  font-size: 14px;
}

.swal2-radio:checked + label {
  color: #007bff;
}

.swal-textarea {
  width: 100%; /* กำหนดความกว้างเต็ม */
  height: 1550px; /* เพิ่มความสูงตามที่ต้องการ */
  padding: 16px;
  border: 2px solid #ccc;
  border-radius: 8px;
  font-size: 16px;
}
</style>
