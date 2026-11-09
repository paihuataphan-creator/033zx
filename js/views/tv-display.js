/**
 * SmartQueue - TV Display Screen View (Public Monitor Board)
 */

const TvDisplayView = {
  timer: null,
  clockTimer: null,
  lastKnownServing: {},

  async render() {
    return `
      <div class="tv-screen-container fade-in">
        <!-- TV Top Bar -->
        <div class="tv-top-bar">
          <div class="tv-brand">
            <div class="brand-icon-box" style="width: 48px; height: 48px; border-radius: 12px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <span>SMARTQUEUE</span>
              <span style="font-size: 1.1rem; color: #94a3b8; font-weight: 400; margin-left: 0.75rem;">
                จอแสดงลำดับคิวผู้รับบริการ
              </span>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 1.5rem;">
            <div class="tv-clock" id="tvDigitalClock">00:00:00</div>
            <button class="btn btn-outline btn-sm" style="color: #fff; border-color: rgba(255,255,255,0.2);" onclick="App.navigate('home')">
              ✕ ออกจากโหมด TV
            </button>
          </div>
        </div>

        <!-- TV Main Content Grid -->
        <div class="tv-main-grid" id="tvMainContent">
          <!-- Rendered in updateTvData() -->
        </div>

        <!-- TV Ticker Footer -->
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 0.95rem;">
          <div>📢 ยินดีต้อนรับสู่ระบบจองคิวออนไลน์ กรุณาเตรียมเอกสารประจำตัวให้พร้อมเมื่อถึงลำดับคิวของท่าน</div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="pulse-dot pulse" style="color: #10b981;"></span>
            <span>สถานะระบบ: เชื่อมต่อเรียลไทม์</span>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    this.startClock();
    await this.updateTvData();

    // Auto-update TV screen every 4 seconds
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (App.currentRoute === 'tv') {
        this.updateTvData();
      }
    }, 4000);
  },

  startClock() {
    const clockEl = document.getElementById('tvDigitalClock');
    const updateTime = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('th-TH');
      }
    };
    updateTime();
    if (this.clockTimer) clearInterval(this.clockTimer);
    this.clockTimer = setInterval(updateTime, 1000);
  },

  async updateTvData() {
    const container = document.getElementById('tvMainContent');
    if (!container) return;

    const today = DB.getTodayString();
    const bookings = await DB.getBookings({ date: today });
    const services = await DB.getServices();

    const inServiceQueues = bookings.filter(b => b.status === 'in_service');
    const waitingQueues = bookings.filter(b => b.status === 'waiting');
    waitingQueues.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const counter1 = inServiceQueues.find(b => b.counterNumber === 1);
    const counter2 = inServiceQueues.find(b => b.counterNumber === 2);
    const counter3 = inServiceQueues.find(b => b.counterNumber === 3);

    container.innerHTML = `
      <!-- Left: Active Counters -->
      <div>
        <!-- Counter 1 -->
        <div class="tv-counter-item">
          <div>
            <div class="tv-counter-label">ช่องบริการที่ 1</div>
            <div style="font-size: 1.15rem; color: #cbd5e1; margin-top: 0.25rem;">
              ${counter1 ? (services.find(s => s.id === counter1.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
            </div>
            ${counter1 ? `<div style="font-size: 0.95rem; color: #38bdf8; margin-top: 0.35rem;">คุณ ${counter1.customerName}</div>` : ''}
          </div>
          <div class="tv-counter-queue">
            ${counter1 ? counter1.queueNumber : '---'}
          </div>
        </div>

        <!-- Counter 2 -->
        <div class="tv-counter-item">
          <div>
            <div class="tv-counter-label">ช่องบริการที่ 2</div>
            <div style="font-size: 1.15rem; color: #cbd5e1; margin-top: 0.25rem;">
              ${counter2 ? (services.find(s => s.id === counter2.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
            </div>
            ${counter2 ? `<div style="font-size: 0.95rem; color: #38bdf8; margin-top: 0.35rem;">คุณ ${counter2.customerName}</div>` : ''}
          </div>
          <div class="tv-counter-queue">
            ${counter2 ? counter2.queueNumber : '---'}
          </div>
        </div>

        <!-- Counter 3 -->
        <div class="tv-counter-item">
          <div>
            <div class="tv-counter-label">ช่องบริการที่ 3</div>
            <div style="font-size: 1.15rem; color: #cbd5e1; margin-top: 0.25rem;">
              ${counter3 ? (services.find(s => s.id === counter3.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
            </div>
            ${counter3 ? `<div style="font-size: 0.95rem; color: #38bdf8; margin-top: 0.35rem;">คุณ ${counter3.customerName}</div>` : ''}
          </div>
          <div class="tv-counter-queue">
            ${counter3 ? counter3.queueNumber : '---'}
          </div>
        </div>
      </div>

      <!-- Right: Waiting Queue List -->
      <div class="tv-side-panel">
        <div class="tv-side-title">
          <span>⏳ ลำดับคิวรอรับบริการถัดไป (${waitingQueues.length})</span>
        </div>
        <div class="tv-waiting-list">
          ${waitingQueues.length === 0 ? `
            <div style="text-align: center; padding: 2rem 0; color: #64748b;">
              ไม่มีคิวที่กำลังรอรับบริการ
            </div>
          ` : waitingQueues.slice(0, 7).map((wq, idx) => {
            const srv = services.find(s => s.id === wq.serviceId);
            return `
              <div class="tv-waiting-item">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  <span style="color: #64748b; font-size: 0.9rem; font-weight: 600;">#${idx + 1}</span>
                  <div>
                    <div class="tv-waiting-num">${wq.queueNumber}</div>
                    <div style="font-size: 0.8rem; color: #94a3b8;">${srv ? srv.name : ''}</div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span class="badge badge-waiting" style="font-size: 0.75rem;">รอเรียก</span>
                  <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${wq.timeSlot}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
};

window.TvDisplayView = TvDisplayView;
