/**
 * SmartQueue - Home View
 */

const HomeView = {
  async render() {
    const stats = await DB.getStats();
    const services = await DB.getServices();
    const activeServices = services.filter(s => s.active);

    // Get active in-service queues for counters
    const inServiceQueues = stats.inServiceQueues || [];
    const counter1 = inServiceQueues.find(q => q.counterNumber === 1);
    const counter2 = inServiceQueues.find(q => q.counterNumber === 2);
    const counter3 = inServiceQueues.find(q => q.counterNumber === 3);

    return `
      <div class="fade-in">
        <!-- Hero Section -->
        <div class="hero-card">
          <div class="hero-pattern"></div>
          <div class="hero-content">
            <div class="hero-pill">
              <span class="pulse-dot pulse"></span>
              ระบบเปิดให้บริการตามปกติในวันนี้
            </div>
            <h1 class="hero-title">ระบบจองคิวออนไลน์<br><span style="color: #93c5fd; font-weight: 300;">SmartQueue</span></h1>
            <p class="hero-subtitle">
              ลดเวลารอคอย จัดการเวลาง่ายขึ้น สะดวก รวดเร็ว จองคิวล่วงหน้าได้จากทุกที่ทุกเวลา พร้อมระบบติดตามสถานะแบบเรียลไทม์
            </p>
            <div class="hero-actions">
              <button class="btn btn-white btn-lg" onclick="App.navigate('booking')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                จองคิวเลย
              </button>
              <button class="btn btn-glass btn-lg" onclick="App.navigate('status')">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                ตรวจสอบสถานะคิว
              </button>
            </div>
          </div>
        </div>

        <!-- Live Statistics Summary -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-amber">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value" id="statWaiting">${stats.waiting}</span>
              <span class="stat-label">คิวที่กำลังรอรับบริการ</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-blue">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <polyline points="16 11 18 13 22 9"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value" id="statInService">${stats.inServiceCount}</span>
              <span class="stat-label">กำลังให้บริการขณะนี้</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-emerald">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value" id="statCompleted">${stats.completed}</span>
              <span class="stat-label">ให้บริการเสร็จสิ้นวันนี้</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrap stat-icon-indigo">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                <path d="M2 12h20"/>
              </svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">~${stats.estimatedWaitMinutes} <small style="font-size: 0.9rem; font-weight: normal;">นาที</small></span>
              <span class="stat-label">เวลารอเฉลี่ยโดยประมาณ</span>
            </div>
          </div>
        </div>

        <!-- Live Queue Display Board Preview -->
        <div class="live-board-card">
          <div class="board-header">
            <div class="board-title-group">
              <div class="pulse-dot pulse" style="color: var(--primary);"></div>
              <h3 class="board-title">มอนิเตอร์คิวปัจจุบัน (Live Counter Board)</h3>
            </div>
            <div style="display: flex; gap: 0.75rem; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="QueueAudio.playChime()">
                🔔 ทดสอบเสียงกริ่ง
              </button>
              <button class="btn btn-light btn-sm" onclick="App.navigate('tv')">
                🖥️ เปิดหน้าจอมอนิเตอร์ใหญ่ (TV Display)
              </button>
            </div>
          </div>

          <div class="counters-grid">
            <!-- Counter 1 -->
            <div class="counter-display-card">
              <span class="counter-badge">ช่องบริการ 1</span>
              <div class="counter-queue-num">
                ${counter1 ? counter1.queueNumber : '---'}
              </div>
              <div class="counter-service-name">
                ${counter1 ? (services.find(s => s.id === counter1.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
              </div>
              <div class="counter-status-tag">
                ${counter1 ? '<span class="badge badge-in_service"><span class="pulse-dot pulse"></span> กำลังให้บริการ</span>' : '<span class="badge badge-completed">ว่าง</span>'}
              </div>
            </div>

            <!-- Counter 2 -->
            <div class="counter-display-card">
              <span class="counter-badge">ช่องบริการ 2</span>
              <div class="counter-queue-num">
                ${counter2 ? counter2.queueNumber : '---'}
              </div>
              <div class="counter-service-name">
                ${counter2 ? (services.find(s => s.id === counter2.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
              </div>
              <div class="counter-status-tag">
                ${counter2 ? '<span class="badge badge-in_service"><span class="pulse-dot pulse"></span> กำลังให้บริการ</span>' : '<span class="badge badge-completed">ว่าง</span>'}
              </div>
            </div>

            <!-- Counter 3 -->
            <div class="counter-display-card">
              <span class="counter-badge">ช่องบริการ 3</span>
              <div class="counter-queue-num">
                ${counter3 ? counter3.queueNumber : '---'}
              </div>
              <div class="counter-service-name">
                ${counter3 ? (services.find(s => s.id === counter3.serviceId)?.name || 'กำลังให้บริการ') : 'พร้อมให้บริการ'}
              </div>
              <div class="counter-status-tag">
                ${counter3 ? '<span class="badge badge-in_service"><span class="pulse-dot pulse"></span> กำลังให้บริการ</span>' : '<span class="badge badge-completed">ว่าง</span>'}
              </div>
            </div>
          </div>
        </div>

        <!-- Services Section -->
        <div class="section-header">
          <h2 class="section-title">ประเภทบริการที่เปิดให้จอง</h2>
          <p class="section-desc">เลือกประเภทบริการที่ต้องการและจองคิวล่วงหน้าเพื่อความสะดวกและรวดเร็ว</p>
        </div>

        <div class="services-grid">
          ${activeServices.map(srv => `
            <div class="service-card" onclick="App.navigate('booking', { serviceId: '${srv.id}' })">
              <div class="service-card-top">
                <div class="service-card-icon">
                  ${this.getServiceIconSvg(srv.icon)}
                </div>
                <span class="service-prefix-tag">หมวด ${srv.codePrefix}</span>
              </div>
              <h3 class="service-card-title">${srv.name}</h3>
              <p class="service-card-desc">${srv.description || 'บริการที่ได้รับมาตรฐานและรวดเร็ว'}</p>
              <div class="service-card-meta">
                <span>⏱️ ใช้เวลาประมาณ ~${srv.durationMinutes} นาที</span>
                <span style="color: var(--primary); font-weight: 600;">จองคิว &rarr;</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- 4 Steps Booking Guide -->
        <div class="section-header center">
          <h2 class="section-title">ขั้นตอนการใช้งานง่ายๆ เพียง 4 สเต็ป</h2>
          <p class="section-desc">ไม่ว่าจะอยู่ที่ไหน ก็จองคิวและรับบริการได้อย่างเป็นระเบียบ ไม่ต้องยืนรอนาน</p>
        </div>

        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h4 class="step-title">เลือกบริการที่ต้องการ</h4>
            <p class="step-desc">เลือกประเภทบริการและตรวจสอบระยะเวลาที่ใช้ในการให้บริการ</p>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <h4 class="step-title">เลือกวันและเวลา</h4>
            <p class="step-desc">เลือกวันที่และช่วงเวลาที่ท่านสะดวกเข้ารับบริการตามช่วงเวลาที่เปิดรับ</p>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <h4 class="step-title">รับบัตรคิวดิจิทัล</h4>
            <p class="step-desc">ระบบจะสร้างหมายเลขคิวและบัตรคิวพร้อมคิวอาร์โค้ดให้อัตโนมัติทันที</p>
          </div>
          <div class="step-card">
            <div class="step-number">4</div>
            <h4 class="step-title">เข้ารับบริการตามคิว</h4>
            <p class="step-desc">ตรวจสอบลำดับคิวแบบเรียลไทม์ และเดินเข้าช่องบริการเมื่อถูกเรียก</p>
          </div>
        </div>
      </div>
    `;
  },

  getServiceIconSvg(iconName) {
    switch (iconName) {
      case 'file-text':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
      case 'user-check':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`;
      case 'credit-card':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
      case 'shield-check':
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>`;
      default:
        return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
    }
  }
};

window.HomeView = HomeView;
