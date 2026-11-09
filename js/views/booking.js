/**
 * SmartQueue - Booking View
 */

const BookingView = {
  currentStep: 1,
  selectedServiceId: null,
  selectedDate: null,
  selectedSlot: null,

  TIME_SLOTS: [
    '09:00 - 09:30',
    '09:30 - 10:00',
    '10:00 - 10:30',
    '10:30 - 11:00',
    '11:00 - 11:30',
    '13:00 - 13:30',
    '13:30 - 14:00',
    '14:00 - 14:30',
    '14:30 - 15:00',
    '15:00 - 15:30',
    '15:30 - 16:00'
  ],

  async render(params = {}) {
    const services = await DB.getServices();
    const activeServices = services.filter(s => s.active);
    const today = DB.getTodayString();

    if (params.serviceId) {
      this.selectedServiceId = params.serviceId;
    } else if (!this.selectedServiceId && activeServices.length > 0) {
      this.selectedServiceId = activeServices[0].id;
    }

    if (!this.selectedDate) {
      this.selectedDate = today;
    }

    const currentUser = DB.getCurrentUser();

    return `
      <div class="fade-in container-sm">
        <div class="section-header center">
          <h2 class="section-title">จองคิวเข้ารับบริการ</h2>
          <p class="section-desc">กรุณาเลือกบริการ วันที่ และช่วงเวลาที่ต้องการเข้ารับบริการ</p>
        </div>

        <!-- Stepper Indicator -->
        <div class="booking-stepper">
          <div class="step-indicator ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}">
            <div class="step-dot">${this.currentStep > 1 ? '✓' : '1'}</div>
            <span class="step-name">เลือกบริการ</span>
          </div>
          <div class="step-indicator ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}">
            <div class="step-dot">${this.currentStep > 2 ? '✓' : '2'}</div>
            <span class="step-name">วันและเวลา</span>
          </div>
          <div class="step-indicator ${this.currentStep >= 3 ? 'active' : ''}">
            <div class="step-dot">3</div>
            <span class="step-name">ข้อมูลผู้จอง</span>
          </div>
        </div>

        <div class="form-card">
          <!-- Step 1: Select Service -->
          <div id="bookingStep1" class="${this.currentStep === 1 ? '' : 'hidden'}">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: var(--navy-900);">
              1. เลือกประเภทบริการที่ต้องการ
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem;">
              ${activeServices.map(srv => `
                <div class="service-card ${this.selectedServiceId === srv.id ? 'selected' : ''}"
                     style="padding: 1rem 1.25rem; flex-direction: row; align-items: center; justify-content: space-between;"
                     onclick="BookingView.selectService('${srv.id}')">
                  <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="service-card-icon" style="width: 40px; height: 40px;">
                      ${HomeView.getServiceIconSvg(srv.icon)}
                    </div>
                    <div>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="service-prefix-tag" style="font-size: 0.7rem;">${srv.codePrefix}</span>
                        <strong style="color: var(--navy-900); font-size: 1rem;">${srv.name}</strong>
                      </div>
                      <div style="font-size: 0.825rem; color: var(--navy-600); margin-top: 2px;">
                        ${srv.description || ''} • ใช้เวลา ~${srv.durationMinutes} นาที
                      </div>
                    </div>
                  </div>
                  <input type="radio" name="selectedService" value="${srv.id}" ${this.selectedServiceId === srv.id ? 'checked' : ''}>
                </div>
              `).join('')}
            </div>
            <div style="display: flex; justify-content: flex-end;">
              <button class="btn btn-primary btn-lg" onclick="BookingView.goToStep(2)">
                ถัดไป: เลือกวันและเวลา &rarr;
              </button>
            </div>
          </div>

          <!-- Step 2: Select Date & Time Slot -->
          <div id="bookingStep2" class="${this.currentStep === 2 ? '' : 'hidden'}">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: var(--navy-900);">
              2. เลือกวันที่และช่วงเวลา
            </h3>

            <div class="form-group">
              <label class="form-label">วันที่ต้องการเข้ารับบริการ <span class="required">*</span></label>
              <input type="date" id="bookingDateInput" class="form-control"
                     value="${this.selectedDate}"
                     min="${today}"
                     onchange="BookingView.onDateChange(this.value)">
              <div class="form-helper">จองคิวล่วงหน้าได้สูงสุด 14 วันทำการ</div>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
              <label class="form-label">
                ช่วงเวลาที่เปิดรับบริการ <span class="required">*</span>
                <span id="slotLoadingText" style="font-size: 0.8rem; font-weight: normal; color: var(--gray-500); margin-left: 0.5rem;"></span>
              </label>
              <div id="slotsContainer" class="slots-grid">
                <!-- Loaded dynamically -->
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: 2rem;">
              <button class="btn btn-outline" onclick="BookingView.goToStep(1)">
                &larr; ย้อนกลับ
              </button>
              <button class="btn btn-primary btn-lg" id="btnStep2Next" onclick="BookingView.goToStep(3)" ${!this.selectedSlot ? 'disabled' : ''}>
                ถัดไป: กรอกข้อมูล &rarr;
              </button>
            </div>
          </div>

          <!-- Step 3: Customer Information & Confirmation -->
          <div id="bookingStep3" class="${this.currentStep === 3 ? '' : 'hidden'}">
            <h3 style="font-size: 1.15rem; font-weight: 700; margin-bottom: 1rem; color: var(--navy-900);">
              3. ข้อมูลผู้เข้ารับบริการ
            </h3>

            <form onsubmit="BookingView.submitBooking(event)">
              <div class="form-group">
                <label class="form-label">ชื่อ - นามสกุล ผู้รับบริการ <span class="required">*</span></label>
                <input type="text" id="bookerName" class="form-control"
                       value="${currentUser ? currentUser.name : ''}"
                       placeholder="เช่น นายสมชาย ใจดี" required>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">เบอร์โทรศัพท์ติดต่อ <span class="required">*</span></label>
                  <input type="tel" id="bookerPhone" class="form-control"
                         value="${currentUser ? currentUser.phone : ''}"
                         placeholder="เช่น 0812345678" pattern="[0-9]{9,10}" required>
                  <div class="form-helper">ใช้สำหรับค้นหาและรับการแจ้งเตือนคิว</div>
                </div>

                <div class="form-group">
                  <label class="form-label">อีเมล</label>
                  <input type="email" id="bookerEmail" class="form-control"
                         value="${currentUser ? currentUser.email : ''}"
                         placeholder="เช่น name@example.com">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea id="bookerNote" class="form-control" rows="2" placeholder="ระบุรายละเอียดเอกสารหรือเรื่องที่ต้องการติดต่อ"></textarea>
              </div>

              <!-- Booking Summary Box -->
              <div style="background-color: var(--primary-light); border: 1.5px solid var(--primary-border); border-radius: var(--radius-lg); padding: 1.25rem; margin: 1.5rem 0;">
                <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--primary-dark); margin-bottom: 0.75rem;">
                  📋 สรุปข้อมูลการจองคิว
                </h4>
                <div style="font-size: 0.875rem; color: var(--navy-800); display: flex; flex-direction: column; gap: 0.4rem;">
                  <div><strong>บริการ:</strong> <span id="summaryServiceName">-</span></div>
                  <div><strong>วันที่:</strong> <span id="summaryDate">-</span></div>
                  <div><strong>ช่วงเวลา:</strong> <span id="summarySlot">-</span></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center;">
                <button type="button" class="btn btn-outline" onclick="BookingView.goToStep(2)">
                  &larr; ย้อนกลับ
                </button>
                <button type="submit" id="btnConfirmBooking" class="btn btn-primary btn-lg">
                  ยืนยันการจองคิว
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Ticket Success Modal -->
      <div id="ticketModal" class="modal-overlay">
        <div class="modal-card" style="max-width: 460px;">
          <div class="modal-header">
            <h3 class="modal-title">🎉 บัตรคิวออนไลน์สำเร็จ</h3>
            <button class="modal-close-btn" onclick="BookingView.closeTicketModal()">&times;</button>
          </div>
          <div class="modal-body" style="padding: 1rem;" id="printableTicketContainer">
            <!-- Dynamic Ticket Content -->
          </div>
          <div class="modal-footer" style="justify-content: space-between;">
            <button class="btn btn-outline" onclick="window.print()">
              🖨️ พิมพ์บัตรคิว
            </button>
            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-light" onclick="BookingView.viewInTracker()">
                ติดตามคิวแบบสด
              </button>
              <button class="btn btn-primary" onclick="BookingView.closeTicketModal()">
                ตกลง
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    if (this.currentStep === 2) {
      await this.loadTimeSlots();
    }
  },

  selectService(serviceId) {
    this.selectedServiceId = serviceId;
    document.querySelectorAll('#bookingStep1 .service-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    const radio = event.currentTarget.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  },

  async goToStep(step) {
    this.currentStep = step;
    document.getElementById('bookingStep1').classList.toggle('hidden', step !== 1);
    document.getElementById('bookingStep2').classList.toggle('hidden', step !== 2);
    document.getElementById('bookingStep3').classList.toggle('hidden', step !== 3);

    // Update Stepper indicators
    const dots = document.querySelectorAll('.booking-stepper .step-indicator');
    dots.forEach((dot, idx) => {
      dot.classList.remove('active', 'completed');
      if (idx + 1 < step) dot.classList.add('completed');
      if (idx + 1 === step) dot.classList.add('active');
    });

    if (step === 2) {
      await this.loadTimeSlots();
    } else if (step === 3) {
      const services = await DB.getServices();
      const srv = services.find(s => s.id === this.selectedServiceId);
      document.getElementById('summaryServiceName').innerText = srv ? `${srv.name} (${srv.codePrefix})` : '-';
      document.getElementById('summaryDate').innerText = DB.formatThaiDate(this.selectedDate);
      document.getElementById('summarySlot').innerText = this.selectedSlot || '-';
    }
  },

  async onDateChange(newDate) {
    this.selectedDate = newDate;
    this.selectedSlot = null;
    document.getElementById('btnStep2Next').disabled = true;
    await this.loadTimeSlots();
  },

  async loadTimeSlots() {
    const container = document.getElementById('slotsContainer');
    if (!container) return;

    container.innerHTML = '<div style="color: var(--gray-500); grid-column: 1/-1;">กำลังตรวจสอบช่วงเวลาว่าง...</div>';

    const bookings = await DB.getBookings({ date: this.selectedDate, serviceId: this.selectedServiceId });
    const services = await DB.getServices();
    const service = services.find(s => s.id === this.selectedServiceId);
    const maxCapacity = service ? (service.maxPerSlot || 3) : 3;

    container.innerHTML = this.TIME_SLOTS.map(slot => {
      const bookedCount = bookings.filter(b => b.timeSlot === slot && b.status !== 'cancelled').length;
      const isFull = bookedCount >= maxCapacity;
      const remaining = maxCapacity - bookedCount;
      const isSelected = this.selectedSlot === slot;

      let statusText = `ว่าง (${remaining}/${maxCapacity})`;
      let btnClass = 'slot-btn';

      if (isFull) {
        statusText = 'เต็มแล้ว';
        btnClass += ' disabled';
      } else if (isSelected) {
        btnClass += ' selected';
      }

      return `
        <button type="button" class="${btnClass}" ${isFull ? 'disabled' : ''} onclick="BookingView.selectSlot('${slot}')">
          <span class="slot-time">${slot}</span>
          <span class="slot-status">${statusText}</span>
        </button>
      `;
    }).join('');
  },

  selectSlot(slot) {
    this.selectedSlot = slot;
    document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    document.getElementById('btnStep2Next').disabled = false;
  },

  async submitBooking(e) {
    e.preventDefault();
    const btn = document.getElementById('btnConfirmBooking');
    btn.disabled = true;
    btn.innerText = 'กำลังดำเนินการออกบัตรคิว...';

    const currentUser = DB.getCurrentUser();
    const bookingData = {
      serviceId: this.selectedServiceId,
      date: this.selectedDate,
      timeSlot: this.selectedSlot,
      customerName: document.getElementById('bookerName').value.trim(),
      customerPhone: document.getElementById('bookerPhone').value.trim(),
      customerEmail: document.getElementById('bookerEmail').value.trim(),
      note: document.getElementById('bookerNote').value.trim(),
      userId: currentUser ? currentUser.id : null
    };

    const res = await DB.createBooking(bookingData);

    btn.disabled = false;
    btn.innerText = 'ยืนยันการจองคิว';

    if (res.success) {
      App.showToast(res.message, 'success');
      this.lastCreatedBooking = res.booking;
      this.showTicketModal(res.booking);
    } else {
      App.showToast(res.message || 'ไม่สามารถทำการจองได้', 'error');
    }
  },

  async showTicketModal(booking) {
    const services = await DB.getServices();
    const service = services.find(s => s.id === booking.serviceId);
    const container = document.getElementById('printableTicketContainer');

    container.innerHTML = `
      <div class="ticket-card" id="printableTicket">
        <div class="ticket-header">
          <div class="ticket-brand">SMARTQUEUE ONLINE BOOKING</div>
          <div class="ticket-service-title">${service ? service.name : 'บริการทั่วไป'}</div>
        </div>
        <div class="ticket-body">
          <div class="ticket-queue-label">หมายเลขคิวของคุณ</div>
          <div class="ticket-queue-number">${booking.queueNumber}</div>
          ${DB.getStatusBadge(booking.status)}

          <div class="ticket-divider">
            <div class="ticket-notch-left"></div>
            <div class="ticket-notch-right"></div>
          </div>

          <ul class="ticket-details">
            <li class="ticket-detail-item">
              <span class="label">ผู้รับบริการ:</span>
              <span class="val">${booking.customerName}</span>
            </li>
            <li class="ticket-detail-item">
              <span class="label">เบอร์โทรศัพท์:</span>
              <span class="val">${booking.customerPhone}</span>
            </li>
            <li class="ticket-detail-item">
              <span class="label">วันที่เข้ารับบริการ:</span>
              <span class="val">${DB.formatThaiDate(booking.date)}</span>
            </li>
            <li class="ticket-detail-item">
              <span class="label">ช่วงเวลานัดหมาย:</span>
              <span class="val">${booking.timeSlot}</span>
            </li>
            <li class="ticket-detail-item">
              <span class="label">รหัสอ้างอิง:</span>
              <span class="val" style="font-family: monospace;">#${booking.id}</span>
            </li>
          </ul>

          <div class="ticket-barcode-mock">
            <div class="barcode-lines"></div>
            <div class="barcode-text">* ${booking.queueNumber} *</div>
          </div>
          <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.5rem;">
            กรุณาแสดงบัตรคิวนี้หรือแจ้งหมายเลขคิวแก่เจ้าหน้าที่ ณ จุดบริการ
          </div>
        </div>
      </div>
    `;

    document.getElementById('ticketModal').classList.add('open');
  },

  closeTicketModal() {
    document.getElementById('ticketModal').classList.remove('open');
    App.navigate('history');
  },

  viewInTracker() {
    if (this.lastCreatedBooking) {
      document.getElementById('ticketModal').classList.remove('open');
      App.navigate('status', { queueNumber: this.lastCreatedBooking.queueNumber });
    }
  }
};

window.BookingView = BookingView;
