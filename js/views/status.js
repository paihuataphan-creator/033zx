/**
 * SmartQueue - Queue Status Tracking View
 */

const StatusView = {
  activeSearchQueue: null,
  refreshTimer: null,

  async render(params = {}) {
    let initialQueueNumber = params.queueNumber || '';

    // If no queue parameter, check if current user has an active booking today
    if (!initialQueueNumber) {
      const currentUser = DB.getCurrentUser();
      if (currentUser) {
        const today = DB.getTodayString();
        const userBookings = await DB.getBookings({ userId: currentUser.id, date: today });
        const active = userBookings.find(b => b.status === 'waiting' || b.status === 'in_service');
        if (active) {
          initialQueueNumber = active.queueNumber;
        } else if (userBookings.length > 0) {
          initialQueueNumber = userBookings[0].queueNumber;
        }
      }
    }

    this.activeSearchQueue = initialQueueNumber;

    return `
      <div class="fade-in container-sm">
        <div class="section-header center">
          <h2 class="section-title">ตรวจสอบสถานะคิวของคุณ</h2>
          <p class="section-desc">ติดตามลำดับคิวแบบสด เรียลไทม์ ตรวจสอบเวลารอและช่องบริการ</p>
        </div>

        <!-- Search Bar -->
        <div class="tracker-card" style="padding: 1.5rem; margin-bottom: 1.5rem;">
          <form onsubmit="StatusView.handleSearch(event)" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 240px; position: relative;">
              <input type="text" id="inputQueueSearch" class="form-control"
                     placeholder="กรอกหมายเลขคิว (เช่น A002) หรือเบอร์โทรศัพท์"
                     value="${initialQueueNumber}">
            </div>
            <button type="submit" class="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              ค้นหาสถานะ
            </button>
          </form>
        </div>

        <!-- Result Container -->
        <div id="queueStatusResult">
          <!-- Rendered via updateQueueDisplay() -->
        </div>
      </div>
    `;
  },

  async afterRender() {
    if (this.activeSearchQueue) {
      await this.updateQueueDisplay(this.activeSearchQueue);
    } else {
      document.getElementById('queueStatusResult').innerHTML = `
        <div class="tracker-card" style="text-align: center; padding: 3rem 1.5rem; color: var(--gray-500);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🎫</div>
          <h4 style="color: var(--navy-800); font-size: 1.15rem; margin-bottom: 0.5rem;">ยังไม่มีหมายเลขคิวที่ตรวจสอบ</h4>
          <p style="font-size: 0.9rem;">กรุณากรอกหมายเลขคิวของคุณ หรือเลือกจองคิวใหม่</p>
          <button class="btn btn-primary" style="margin-top: 1.25rem;" onclick="App.navigate('booking')">
            จองคิวรับบริการ
          </button>
        </div>
      `;
    }

    // Auto-refresh every 6 seconds on this page
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => {
      if (this.activeSearchQueue && App.currentRoute === 'status') {
        this.updateQueueDisplay(this.activeSearchQueue, true);
      }
    }, 6000);
  },

  async handleSearch(e) {
    if (e) e.preventDefault();
    const query = document.getElementById('inputQueueSearch').value.trim();
    if (!query) {
      App.showToast('กรุณากรอกหมายเลขคิวหรือเบอร์โทรศัพท์', 'warning');
      return;
    }

    this.activeSearchQueue = query;
    await this.updateQueueDisplay(query);
  },

  async updateQueueDisplay(query, isSilentRefresh = false) {
    const container = document.getElementById('queueStatusResult');
    if (!container) return;

    // Search by queue number or phone
    const bookings = await DB.getBookings();
    const qLower = query.toLowerCase();
    const booking = bookings.find(b =>
      b.queueNumber.toLowerCase() === qLower ||
      b.customerPhone === query
    );

    if (!booking) {
      if (!isSilentRefresh) {
        container.innerHTML = `
          <div class="tracker-card" style="text-align: center; padding: 2.5rem; color: var(--danger);">
            <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">⚠️</div>
            <h4 style="font-size: 1.2rem; font-weight: 700; margin-bottom: 0.25rem;">ไม่พบข้อมูลคิว "${query}"</h4>
            <p style="color: var(--gray-600); font-size: 0.9rem;">กรุณาตรวจสอบหมายเลขคิวหรือเบอร์โทรศัพท์อีกครั้ง</p>
          </div>
        `;
      }
      return;
    }

    const services = await DB.getServices();
    const service = services.find(s => s.id === booking.serviceId);

    // Calculate how many queues are ahead for this service
    const today = DB.getTodayString();
    const sameServiceWaiting = bookings.filter(b =>
      b.serviceId === booking.serviceId &&
      b.date === booking.date &&
      b.status === 'waiting'
    );

    // Sort FIFO
    sameServiceWaiting.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const myIndex = sameServiceWaiting.findIndex(b => b.id === booking.id);
    const queuesAhead = myIndex >= 0 ? myIndex : 0;
    const estWaitMinutes = queuesAhead * (service ? service.durationMinutes : 15);

    // Current in-service queue for this service or counter
    const currentInService = bookings.find(b =>
      b.serviceId === booking.serviceId &&
      b.date === booking.date &&
      b.status === 'in_service'
    );

    // Check if user is being called right now!
    const isNowCalled = booking.status === 'in_service';

    // Journey steps
    const isDone = booking.status === 'completed';
    const isCancelled = booking.status === 'cancelled';

    container.innerHTML = `
      ${isNowCalled ? `
        <div class="queue-called-banner">
          <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.25rem;">
            🔔 ถึงคิวของคุณแล้ว!
          </div>
          <div style="font-size: 1.1rem;">
            กรุณาไปที่ <strong>ช่องบริการที่ ${booking.counterNumber || 1}</strong>
          </div>
          <button class="btn btn-white btn-sm" style="margin-top: 0.75rem;" onclick="QueueAudio.announce('${booking.queueNumber}', '${booking.counterNumber || 1}')">
            🔊 เล่นเสียงเรียกคิวซ้ำ
          </button>
        </div>
      ` : ''}

      <div class="tracker-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; border-bottom: 1px solid var(--gray-100); padding-bottom: 1.25rem;">
          <div>
            <div style="font-size: 0.85rem; color: var(--navy-600); font-weight: 500;">ประเภทบริการ</div>
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--navy-900);">${service ? service.name : 'บริการทั่วไป'}</h3>
            <div style="font-size: 0.825rem; color: var(--gray-500); margin-top: 2px;">
              วันที่: ${DB.formatThaiDate(booking.date)} (${booking.timeSlot})
            </div>
          </div>
          <div style="text-align: right;">
            ${DB.getStatusBadge(booking.status)}
            <div style="font-size: 0.75rem; color: var(--gray-400); margin-top: 4px;">อัปเดตล่าสุด: ${new Date().toLocaleTimeString('th-TH')}</div>
          </div>
        </div>

        <!-- 3 Highlight Metrics -->
        <div class="tracker-highlight-grid">
          <div class="tracker-metric-box active">
            <div class="tracker-metric-label">หมายเลขคิวของคุณ</div>
            <div class="tracker-metric-val" style="color: var(--primary);">${booking.queueNumber}</div>
            <div style="font-size: 0.75rem; color: var(--navy-600); margin-top: 4px;">${booking.customerName}</div>
          </div>

          <div class="tracker-metric-box">
            <div class="tracker-metric-label">คิวที่กำลังให้บริการ</div>
            <div class="tracker-metric-val">
              ${currentInService ? currentInService.queueNumber : '---'}
            </div>
            <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px;">
              ${currentInService ? `ช่องบริการ ${currentInService.counterNumber || 1}` : 'รอเรียกคิวถัดไป'}
            </div>
          </div>

          <div class="tracker-metric-box">
            <div class="tracker-metric-label">จำนวนคิวข้างหน้า</div>
            <div class="tracker-metric-val" style="color: ${queuesAhead === 0 ? 'var(--success)' : 'var(--navy-900)'};">
              ${isNowCalled ? '0' : (isDone ? '-' : queuesAhead)}
            </div>
            <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px;">
              ${isNowCalled ? 'กำลังรับบริการ' : (isDone ? 'เสร็จสิ้นแล้ว' : `รอประมาณ ~${estWaitMinutes} นาที`)}
            </div>
          </div>
        </div>

        <!-- Visual Progress Journey -->
        <div style="margin-top: 2rem;">
          <h4 style="font-size: 0.95rem; font-weight: 600; color: var(--navy-800); margin-bottom: 0.5rem;">
            ลำดับความคืบหน้าของคิว
          </h4>
          <div class="journey-bar">
            <!-- Step 1: Booked -->
            <div class="journey-step done">
              <div class="journey-dot">✓</div>
              <span class="journey-label">จองสำเร็จ</span>
            </div>

            <!-- Step 2: Waiting -->
            <div class="journey-step ${booking.status === 'waiting' ? 'current' : (isNowCalled || isDone ? 'done' : '')}">
              <div class="journey-dot">${isNowCalled || isDone ? '✓' : '2'}</div>
              <span class="journey-label">รอเรียกคิว</span>
            </div>

            <!-- Step 3: In Service -->
            <div class="journey-step ${isNowCalled ? 'current' : (isDone ? 'done' : '')}">
              <div class="journey-dot">${isDone ? '✓' : '3'}</div>
              <span class="journey-label">เข้ารับบริการ</span>
            </div>

            <!-- Step 4: Done -->
            <div class="journey-step ${isDone ? 'done' : ''}">
              <div class="journey-dot">${isDone ? '✓' : '4'}</div>
              <span class="journey-label">เสร็จสิ้น</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; pt-4; border-top: 1px solid var(--gray-100); flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-outline btn-sm" onclick="StatusView.updateQueueDisplay('${booking.queueNumber}')">
              🔄 รีเฟรชสถานะ
            </button>
            <button class="btn btn-light btn-sm" onclick="BookingView.showTicketModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})">
              🎫 ดูบัตรคิว
            </button>
          </div>

          ${booking.status === 'waiting' ? `
            <button class="btn btn-outline-danger btn-sm" onclick="HistoryView.cancelBookingPrompt('${booking.id}', '${booking.queueNumber}')">
              ยกเลิกคิวนี้
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
};

window.StatusView = StatusView;
