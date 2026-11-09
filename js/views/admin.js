/**
 * SmartQueue - Admin Dashboard & Queue Calling Console
 */

const AdminView = {
  currentCounter: 1,
  selectedServiceFilter: 'all',
  searchQuery: '',
  dateFilter: '',
  statusFilter: 'all',
  editingServiceId: null,

  async render() {
    const currentUser = DB.getCurrentUser();
    const isAdmin = currentUser && currentUser.role === 'admin';

    if (!isAdmin) {
      return this.renderAdminGate();
    }

    const today = DB.getTodayString();
    if (!this.dateFilter) this.dateFilter = today;

    const stats = await DB.getStats(this.dateFilter);
    const services = await DB.getServices();

    // Current queue at selected counter
    const todayBookings = await DB.getBookings({ date: this.dateFilter });
    const currentCounterQueue = todayBookings.find(
      b => b.counterNumber === this.currentCounter && b.status === 'in_service'
    );

    // Filter bookings for table
    let tableBookings = [...todayBookings];
    if (this.selectedServiceFilter !== 'all') {
      tableBookings = tableBookings.filter(b => b.serviceId === this.selectedServiceFilter);
    }
    if (this.statusFilter !== 'all') {
      tableBookings = tableBookings.filter(b => b.status === this.statusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      tableBookings = tableBookings.filter(b =>
        b.queueNumber.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q)
      );
    }

    return `
      <div class="fade-in container">
        <!-- Admin Header -->
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="badge" style="background-color: var(--navy-900); color: var(--white);">ADMIN CONSOLE</span>
              <span class="pulse-dot pulse" style="color: var(--success);"></span>
            </div>
            <h2 class="section-title">ระบบบริหารจัดการคิวและเคาน์เตอร์</h2>
          </div>
          <div class="admin-header-actions">
            <button class="btn btn-outline btn-sm" onclick="App.navigate('tv')">
              🖥️ เปิดจอ TV แสดงผล
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminView.openServiceModal()">
              + จัดการประเภทบริการ
            </button>
            <button class="btn btn-outline-danger btn-sm" onclick="AdminView.resetSystemData()">
              🔄 รีเซ็ตข้อมูล Demo
            </button>
          </div>
        </div>

        <!-- 4 KPI Stat Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-blue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">${stats.totalToday}</span>
              <span class="stat-label">คิวทั้งหมดประจำวัน</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-amber">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">${stats.waiting}</span>
              <span class="stat-label">รอรับบริการ</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-indigo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">${stats.inServiceCount}</span>
              <span class="stat-label">กำลังให้บริการ</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-emerald">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">${stats.completed}</span>
              <span class="stat-label">เสร็จสิ้นแล้ว</span>
            </div>
          </div>
        </div>

        <!-- Queue Caller Station -->
        <div class="caller-station-card">
          <div class="station-top-bar">
            <div class="station-title">
              <span>🎙️ สถานีเรียกคิวประจำเคาน์เตอร์</span>
            </div>

            <!-- Counter Selection Toggles -->
            <div class="station-counter-selector">
              <button class="counter-btn-toggle ${this.currentCounter === 1 ? 'active' : ''}" onclick="AdminView.switchCounter(1)">
                ช่องบริการ 1
              </button>
              <button class="counter-btn-toggle ${this.currentCounter === 2 ? 'active' : ''}" onclick="AdminView.switchCounter(2)">
                ช่องบริการ 2
              </button>
              <button class="counter-btn-toggle ${this.currentCounter === 3 ? 'active' : ''}" onclick="AdminView.switchCounter(3)">
                ช่องบริการ 3
              </button>
            </div>
          </div>

          <!-- Active Calling Display -->
          <div class="station-calling-box">
            <div style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem;">
              คิวปัจจุบันประจำช่องบริการ ${this.currentCounter}
            </div>
            <div class="station-current-queue">
              ${currentCounterQueue ? currentCounterQueue.queueNumber : '---'}
            </div>
            <div class="station-current-customer">
              ${currentCounterQueue ? `ผู้รับบริการ: <strong>${currentCounterQueue.customerName}</strong> (${currentCounterQueue.customerPhone})` : 'ยังไม่มีคิวที่กำลังให้บริการที่ช่องนี้'}
            </div>
          </div>

          <!-- Caller Actions -->
          <div class="station-buttons">
            <button class="btn btn-primary btn-lg" onclick="AdminView.callNextQueue()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              เรียกคิวถัดไป (Call Next)
            </button>

            ${currentCounterQueue ? `
              <button class="btn btn-outline btn-lg" style="color: var(--white); border-color: rgba(255,255,255,0.4);" onclick="AdminView.recallCurrentQueue('${currentCounterQueue.queueNumber}')">
                🔔 เรียกซ้ำ (Recall)
              </button>
              <button class="btn btn-success btn-lg" onclick="AdminView.completeCurrentQueue('${currentCounterQueue.id}', '${currentCounterQueue.queueNumber}')">
                ✓ ให้บริการเสร็จสิ้น
              </button>
              <button class="btn btn-danger btn-lg" onclick="AdminView.skipCurrentQueue('${currentCounterQueue.id}', '${currentCounterQueue.queueNumber}')">
                ข้าม / ไม่มา
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Bookings Data Management Section -->
        <div class="section-header" style="margin-top: 2.5rem; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <h3 style="font-size: 1.35rem; font-weight: 700; color: var(--navy-900);">
            📋 รายการคิวและการจองทั้งหมด (${tableBookings.length} รายการ)
          </h3>
        </div>

        <!-- Filters Bar -->
        <div style="background-color: var(--white); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1.25rem; margin-bottom: 1.25rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 200px;">
            <input type="text" class="form-control" placeholder="ค้นหา: เลขคิว, ชื่อ, หรือเบอร์โทร..."
                   value="${this.searchQuery}"
                   oninput="AdminView.onSearchInput(this.value)">
          </div>

          <div style="min-width: 140px;">
            <input type="date" class="form-control" value="${this.dateFilter}" onchange="AdminView.onDateChange(this.value)">
          </div>

          <div style="min-width: 160px;">
            <select class="form-control" onchange="AdminView.onServiceFilterChange(this.value)">
              <option value="all">ทุกประเภทบริการ</option>
              ${services.map(s => `<option value="${s.id}" ${this.selectedServiceFilter === s.id ? 'selected' : ''}>${s.name} (${s.codePrefix})</option>`).join('')}
            </select>
          </div>

          <div style="min-width: 140px;">
            <select class="form-control" onchange="AdminView.onStatusFilterChange(this.value)">
              <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>ทุกสถานะ</option>
              <option value="waiting" ${this.statusFilter === 'waiting' ? 'selected' : ''}>รอรับบริการ</option>
              <option value="in_service" ${this.statusFilter === 'in_service' ? 'selected' : ''}>กำลังให้บริการ</option>
              <option value="completed" ${this.statusFilter === 'completed' ? 'selected' : ''}>เสร็จสิ้นแล้ว</option>
              <option value="cancelled" ${this.statusFilter === 'cancelled' ? 'selected' : ''}>ยกเลิก</option>
            </select>
          </div>
        </div>

        <!-- Bookings Table -->
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>หมายเลขคิว</th>
                <th>ผู้รับบริการ</th>
                <th>บริการ</th>
                <th>เวลานัดหมาย</th>
                <th>ช่องบริการ</th>
                <th>สถานะ</th>
                <th>จัดการสถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${tableBookings.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--gray-500);">
                    ไม่พบรายการจองคิวตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ` : tableBookings.map(b => {
                const srv = services.find(s => s.id === b.serviceId);
                return `
                  <tr>
                    <td>
                      <strong style="color: var(--primary); font-size: 1.1rem; letter-spacing: 0.05em;">${b.queueNumber}</strong>
                    </td>
                    <td>
                      <div style="font-weight: 600; color: var(--navy-900);">${b.customerName}</div>
                      <div style="font-size: 0.775rem; color: var(--gray-500);">${b.customerPhone}</div>
                    </td>
                    <td>${srv ? srv.name : '-'}</td>
                    <td>
                      <div>${b.timeSlot}</div>
                      <div style="font-size: 0.775rem; color: var(--gray-400);">${b.date}</div>
                    </td>
                    <td>
                      <span class="badge" style="background-color: var(--gray-100); color: var(--navy-800);">
                        ${b.counterNumber ? `ช่อง ${b.counterNumber}` : '-'}
                      </span>
                    </td>
                    <td>${DB.getStatusBadge(b.status)}</td>
                    <td>
                      <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <select class="form-control" style="padding: 0.3rem 0.5rem; font-size: 0.8rem; width: auto;"
                                onchange="AdminView.updateStatus('${b.id}', this.value)">
                          <option value="waiting" ${b.status === 'waiting' ? 'selected' : ''}>รอรับบริการ</option>
                          <option value="in_service" ${b.status === 'in_service' ? 'selected' : ''}>กำลังให้บริการ</option>
                          <option value="completed" ${b.status === 'completed' ? 'selected' : ''}>เสร็จสิ้น</option>
                          <option value="cancelled" ${b.status === 'cancelled' ? 'selected' : ''}>ยกเลิก</option>
                        </select>
                        <button class="btn btn-outline btn-sm" onclick="BookingView.showTicketModal(${JSON.stringify(b).replace(/"/g, '&quot;')})">
                          ดู
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Services Management Modal Container -->
        <div id="serviceManageModal" class="modal-overlay">
          <!-- Rendered in openServiceModal() -->
        </div>
      </div>
    `;
  },

  renderAdminGate() {
    return `
      <div class="fade-in container-xs" style="padding-top: 3rem;">
        <div class="form-card" style="text-align: center;">
          <div style="font-size: 3.5rem; margin-bottom: 1rem;">🛡️</div>
          <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--navy-900); margin-bottom: 0.5rem;">
            สำหรับผู้ดูแลระบบเท่านั้น
          </h2>
          <p style="color: var(--navy-600); font-size: 0.95rem; margin-bottom: 1.75rem;">
            กรุณาเข้าสู่ระบบด้วยบัญชีผู้ดูแลระบบ (Admin) เพื่อจัดการระบบคิว
          </p>

          <button class="btn btn-primary btn-block btn-lg" onclick="AuthView.open('login')">
            เข้าสู่ระบบผู้ดูแล
          </button>

          <button class="btn btn-outline btn-block" style="margin-top: 0.75rem;" onclick="AdminView.quickLoginAdmin()">
            ⚡ เข้าสู่ระบบ Admin (คลิกเดียว)
          </button>
        </div>
      </div>
    `;
  },

  async quickLoginAdmin() {
    const res = await DB.login('admin@queue.com', 'password123');
    if (res.success) {
      App.showToast('เข้าสู่ระบบในฐานะ Admin สำเร็จ', 'success');
      App.updateNavbarUser();
      App.refreshCurrentView();
    }
  },

  switchCounter(num) {
    this.currentCounter = num;
    App.refreshCurrentView();
  },

  onSearchInput(val) {
    this.searchQuery = val;
    App.refreshCurrentView();
  },

  onDateChange(val) {
    this.dateFilter = val;
    App.refreshCurrentView();
  },

  onServiceFilterChange(val) {
    this.selectedServiceFilter = val;
    App.refreshCurrentView();
  },

  onStatusFilterChange(val) {
    this.statusFilter = val;
    App.refreshCurrentView();
  },

  async callNextQueue() {
    const res = await DB.callNextQueue(this.selectedServiceFilter, this.currentCounter);
    if (res.success) {
      App.showToast(res.message, 'success');
      // Play Audio Chime + Thai Speech Announcement!
      QueueAudio.announce(res.calledQueue.queueNumber, this.currentCounter);
      App.refreshCurrentView();
    } else {
      App.showToast(res.message || 'ไม่มีคิวที่กำลังรอรับบริการ', 'warning');
    }
  },

  async recallCurrentQueue(queueNumber) {
    App.showToast(`เรียกคิว ${queueNumber} ซ้ำ`, 'info');
    QueueAudio.announce(queueNumber, this.currentCounter);
  },

  async completeCurrentQueue(bookingId, queueNumber) {
    const res = await DB.updateBookingStatus(bookingId, 'completed');
    if (res.success) {
      App.showToast(`คิว ${queueNumber} ให้บริการเสร็จสิ้นแล้ว`, 'success');
      App.refreshCurrentView();
    }
  },

  async skipCurrentQueue(bookingId, queueNumber) {
    const ok = confirm(`ต้องการข้ามคิว ${queueNumber} เนื่องจากผู้รับบริการไม่มาใช่หรือไม่?`);
    if (!ok) return;

    const res = await DB.updateBookingStatus(bookingId, 'no_show');
    if (res.success) {
      App.showToast(`ข้ามคิว ${queueNumber} แล้ว`, 'info');
      App.refreshCurrentView();
    }
  },

  async updateStatus(bookingId, newStatus) {
    const res = await DB.updateBookingStatus(bookingId, newStatus, this.currentCounter);
    if (res.success) {
      App.showToast(res.message, 'success');
      App.refreshCurrentView();
    }
  },

  // Service Management CRUD
  async openServiceModal(serviceIdToEdit = null) {
    const services = await DB.getServices();
    const modal = document.getElementById('serviceManageModal');
    let serviceToEdit = null;

    if (serviceIdToEdit) {
      serviceToEdit = services.find(s => s.id === serviceIdToEdit);
    }

    modal.innerHTML = `
      <div class="modal-card" style="max-width: 650px;">
        <div class="modal-header">
          <h3 class="modal-title">🛠️ จัดการประเภทบริการ (Services Management)</h3>
          <button class="modal-close-btn" onclick="AdminView.closeServiceModal()">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Existing Services List -->
          <div style="margin-bottom: 1.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--navy-800); margin-bottom: 0.75rem;">
              รายการประเภทบริการปัจจุบัน (${services.length})
            </h4>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto;">
              ${services.map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.85rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-md);">
                  <div style="display: flex; align-items: center; gap: 0.6rem;">
                    <span class="service-prefix-tag" style="font-size: 0.7rem;">${s.codePrefix}</span>
                    <strong style="font-size: 0.9rem; color: var(--navy-900);">${s.name}</strong>
                    <span style="font-size: 0.75rem; color: var(--gray-500);">(~${s.durationMinutes} นาที, สูงสุด ${s.maxPerSlot || 3} คน/ช่วง)</span>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button class="btn btn-outline btn-sm" onclick="AdminView.openServiceModal('${s.id}')">แก้ไข</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="AdminView.deleteService('${s.id}')">ลบ</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Add / Edit Service Form -->
          <form onsubmit="AdminView.saveService(event, '${serviceIdToEdit || ''}')" style="border-top: 1px solid var(--gray-200); padding-top: 1.25rem;">
            <h4 style="font-size: 1rem; font-weight: 700; color: var(--navy-900); margin-bottom: 1rem;">
              ${serviceToEdit ? '✏️ แก้ไขข้อมูลบริการ' : '➕ เพิ่มประเภทบริการใหม่'}
            </h4>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">ชื่อประเภทบริการ <span class="required">*</span></label>
                <input type="text" id="srvName" class="form-control" value="${serviceToEdit ? serviceToEdit.name : ''}" placeholder="เช่น ตรวจสุขภาพประจำปี" required>
              </div>

              <div class="form-group">
                <label class="form-label">รหัสตัวอักษรนำหน้า (Prefix) <span class="required">*</span></label>
                <input type="text" id="srvPrefix" class="form-control" value="${serviceToEdit ? serviceToEdit.codePrefix : ''}" placeholder="เช่น E" maxlength="2" required style="text-transform: uppercase;">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">ระยะเวลาให้บริการโดยประมาณ (นาที)</label>
                <input type="number" id="srvDuration" class="form-control" value="${serviceToEdit ? serviceToEdit.durationMinutes : 15}" min="5" max="180" required>
              </div>

              <div class="form-group">
                <label class="form-label">จำนวนคิวสูงสุดต่อช่วงเวลา (คน/ช่วง)</label>
                <input type="number" id="srvMaxSlot" class="form-control" value="${serviceToEdit ? serviceToEdit.maxPerSlot || 3 : 3}" min="1" max="20" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">คำอธิบายบริการ</label>
              <textarea id="srvDesc" class="form-control" rows="2" placeholder="อธิบายรายละเอียดหรือเอกสารที่ต้องเตรียม">${serviceToEdit ? serviceToEdit.description || '' : ''}</textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
              ${serviceToEdit ? `<button type="button" class="btn btn-outline" onclick="AdminView.openServiceModal()">ยกเลิกการแก้ไข</button>` : ''}
              <button type="submit" class="btn btn-primary">
                ${serviceToEdit ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทบริการ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('open');
  },

  closeServiceModal() {
    document.getElementById('serviceManageModal').classList.remove('open');
  },

  async saveService(e, editId) {
    e.preventDefault();
    const serviceData = {
      name: document.getElementById('srvName').value.trim(),
      codePrefix: document.getElementById('srvPrefix').value.trim().toUpperCase(),
      durationMinutes: Number(document.getElementById('srvDuration').value) || 15,
      maxPerSlot: Number(document.getElementById('srvMaxSlot').value) || 3,
      description: document.getElementById('srvDesc').value.trim()
    };

    let res;
    if (editId) {
      res = await DB.updateService(editId, serviceData);
    } else {
      res = await DB.createService(serviceData);
    }

    if (res.success) {
      App.showToast(res.message, 'success');
      this.closeServiceModal();
      App.refreshCurrentView();
    } else {
      App.showToast(res.message || 'บันทึกบริการไม่สำเร็จ', 'error');
    }
  },

  async deleteService(id) {
    const ok = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประเภทบริการนี้?');
    if (!ok) return;

    const res = await DB.deleteService(id);
    if (res.success) {
      App.showToast(res.message, 'success');
      this.openServiceModal();
      App.refreshCurrentView();
    } else {
      App.showToast(res.message || 'ไม่สามารถลบได้', 'error');
    }
  },

  async resetSystemData() {
    const ok = confirm('⚠️ คำเตือน: คุณต้องการรีเซ็ตฐานข้อมูลทั้งหมดกลับสู่ค่าเริ่มต้น (Demo Data) หรือไม่?');
    if (!ok) return;

    await DB.resetData();
    App.showToast('รีเซ็ตฐานข้อมูลเรียบร้อยแล้ว', 'info');
    App.refreshCurrentView();
  }
};

window.AdminView = AdminView;
