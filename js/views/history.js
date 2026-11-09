/**
 * SmartQueue - Booking History View
 */

const HistoryView = {
  currentFilter: 'all',

  async render() {
    const currentUser = DB.getCurrentUser();
    const services = await DB.getServices();

    // If user is logged in, show their bookings; else show all local bookings
    const filter = currentUser ? { userId: currentUser.id } : {};
    let bookings = await DB.getBookings(filter);

    if (this.currentFilter !== 'all') {
      bookings = bookings.filter(b => b.status === this.currentFilter);
    }

    return `
      <div class="fade-in container">
        <div class="section-header" style="display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem;">
          <div>
            <h2 class="section-title">ประวัติการจองคิว</h2>
            <p class="section-desc">
              ${currentUser ? `ประวัติการจองคิวของคุณ (${currentUser.name})` : 'รายการจองคิวทั้งหมดในระบบ (เข้าสู่ระบบเพื่อดูเฉพาะของคุณ)'}
            </p>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('booking')">
            + จองคิวใหม่
          </button>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" onclick="HistoryView.setFilter('all')">
            ทั้งหมด
          </button>
          <button class="filter-tab ${this.currentFilter === 'waiting' ? 'active' : ''}" onclick="HistoryView.setFilter('waiting')">
            รอรับบริการ
          </button>
          <button class="filter-tab ${this.currentFilter === 'in_service' ? 'active' : ''}" onclick="HistoryView.setFilter('in_service')">
            กำลังให้บริการ
          </button>
          <button class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" onclick="HistoryView.setFilter('completed')">
            ให้บริการแล้ว
          </button>
          <button class="filter-tab ${this.currentFilter === 'cancelled' ? 'active' : ''}" onclick="HistoryView.setFilter('cancelled')">
            ยกเลิกแล้ว
          </button>
        </div>

        <!-- Bookings List -->
        ${bookings.length === 0 ? `
          <div class="tracker-card" style="text-align: center; padding: 3rem 1rem; color: var(--gray-500);">
            <div style="font-size: 3rem; margin-bottom: 0.75rem;">📋</div>
            <h4 style="font-size: 1.15rem; color: var(--navy-800); margin-bottom: 0.25rem;">ไม่พบรายการจองคิว</h4>
            <p style="font-size: 0.9rem;">คุณยังไม่มีประวัติการจองในหมวดนี้</p>
            <button class="btn btn-primary" style="margin-top: 1rem;" onclick="App.navigate('booking')">
              จองคิวตอนนี้
            </button>
          </div>
        ` : `
          <div class="booking-cards-list">
            ${bookings.map(b => {
              const srv = services.find(s => s.id === b.serviceId);
              return `
                <div class="booking-item-card">
                  <div class="booking-item-left">
                    <div class="queue-tag-large">
                      <span>คิว</span>
                      ${b.queueNumber}
                    </div>
                    <div class="booking-item-meta">
                      <div class="booking-item-title">
                        ${srv ? srv.name : 'บริการทั่วไป'}
                      </div>
                      <div class="booking-item-desc">
                        <span>📅 ${DB.formatThaiDate(b.date)}</span>
                        <span>⏰ ${b.timeSlot}</span>
                        <span>👤 ${b.customerName} (${b.customerPhone})</span>
                      </div>
                      ${b.note ? `<div style="font-size: 0.8rem; color: var(--gray-500); margin-top: 2px;">หมายเหตุ: ${b.note}</div>` : ''}
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                    ${DB.getStatusBadge(b.status)}

                    <div class="booking-item-actions">
                      <button class="btn btn-outline btn-sm" onclick="App.navigate('status', { queueNumber: '${b.queueNumber}' })">
                        ติดตามสถานะ
                      </button>
                      <button class="btn btn-light btn-sm" onclick="BookingView.showTicketModal(${JSON.stringify(b).replace(/"/g, '&quot;')})">
                        ดูบัตรคิว
                      </button>
                      ${b.status === 'waiting' ? `
                        <button class="btn btn-outline-danger btn-sm" onclick="HistoryView.cancelBookingPrompt('${b.id}', '${b.queueNumber}')">
                          ยกเลิก
                        </button>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  async setFilter(filter) {
    this.currentFilter = filter;
    App.refreshCurrentView();
  },

  async cancelBookingPrompt(id, queueNumber) {
    const ok = confirm(`คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองคิวหมายเลข ${queueNumber} ?`);
    if (!ok) return;

    const res = await DB.cancelBooking(id);
    if (res.success) {
      App.showToast(res.message, 'success');
      App.refreshCurrentView();
    } else {
      App.showToast(res.message || 'ไม่สามารถยกเลิกคิวได้', 'error');
    }
  }
};

window.HistoryView = HistoryView;
