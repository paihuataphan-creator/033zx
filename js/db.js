/**
 * SmartQueue - Unified Data Store & API Adapter
 * Supports both REST API (Node server) and LocalStorage fallback for zero-setup execution.
 */

const DB = {
  isServerMode: false,
  apiBase: '/api',
  STORAGE_KEY: 'smartqueue_db_v1',
  AUTH_KEY: 'smartqueue_current_user',

  // Check if API backend is reachable
  async init() {
    try {
      const res = await fetch(`${this.apiBase}/health`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          this.isServerMode = true;
          console.log('✅ Connected to SmartQueue Node.js REST API Backend');
          return;
        }
      }
    } catch (e) {
      // Fallback to local storage
    }
    this.isServerMode = false;
    console.log('💾 Running in Standalone Client Mode (LocalStorage Active)');
    this.initLocalStorage();
  },

  // Initialize LocalStorage with default seeds if empty
  initLocalStorage() {
    const existing = localStorage.getItem(this.STORAGE_KEY);
    if (!existing) {
      this.resetLocalToDefault();
    }
  },

  getTodayString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  resetLocalToDefault() {
    const today = this.getTodayString();
    const now = new Date();

    const initial = {
      users: [
        {
          id: "u_admin",
          name: "ผู้ดูแลระบบ (Admin)",
          phone: "0891234567",
          email: "admin@queue.com",
          password: "password123",
          role: "admin",
          createdAt: new Date().toISOString()
        },
        {
          id: "u_demo",
          name: "สมชาย ใจดี",
          phone: "0812345678",
          email: "user@queue.com",
          password: "password123",
          role: "user",
          createdAt: new Date().toISOString()
        },
        {
          id: "u_demo2",
          name: "สมศรี รักสงบ",
          phone: "0898765432",
          email: "somsri@example.com",
          password: "password123",
          role: "user",
          createdAt: new Date().toISOString()
        }
      ],
      services: [
        {
          id: "srv_1",
          name: "ยื่นเอกสารและงานทะเบียน",
          codePrefix: "A",
          durationMinutes: 15,
          maxPerSlot: 3,
          description: "บริการจัดทำเอกสาร ทำบัตร ย้ายทะเบียน และรับรองเอกสารทั่วไป",
          icon: "file-text",
          active: true
        },
        {
          id: "srv_2",
          name: "ปรึกษาผู้เชี่ยวชาญและให้คำแนะนำ",
          codePrefix: "B",
          durationMinutes: 30,
          maxPerSlot: 2,
          description: "ให้คำปรึกษาเฉพาะทาง ตรวจสอบข้อมูลเชิงลึก และวางแผนดำเนินการ",
          icon: "user-check",
          active: true
        },
        {
          id: "srv_3",
          name: "ชำระค่าธรรมเนียมและการเงิน",
          codePrefix: "C",
          durationMinutes: 10,
          maxPerSlot: 4,
          description: "ชำระค่าบริการ ค่าธรรมเนียม ออกใบเสร็จรับเงิน และรับเงินคืน",
          icon: "credit-card",
          active: true
        },
        {
          id: "srv_4",
          name: "ตรวจสอบสิทธิและสวัสดิการ",
          codePrefix: "D",
          durationMinutes: 20,
          maxPerSlot: 3,
          description: "ลงทะเบียนรับสิทธิ ตรวจสอบเงื่อนไข และยื่นคำร้องสวัสดิการ",
          icon: "shield-check",
          active: true
        }
      ],
      bookings: [
        {
          id: "bk_001",
          queueNumber: "A001",
          userId: "u_demo2",
          customerName: "สมศรี รักสงบ",
          customerPhone: "0898765432",
          customerEmail: "somsri@example.com",
          serviceId: "srv_1",
          date: today,
          timeSlot: "09:00 - 09:30",
          note: "ติดต่อทำเรื่องต่ออายุเอกสารประจำปี",
          status: "completed",
          counterNumber: 1,
          calledAt: new Date(now.getTime() - 3600000).toISOString(),
          completedAt: new Date(now.getTime() - 2400000).toISOString(),
          createdAt: new Date(now.getTime() - 7200000).toISOString()
        },
        {
          id: "bk_002",
          queueNumber: "A002",
          userId: "u_demo",
          customerName: "สมชาย ใจดี",
          customerPhone: "0812345678",
          customerEmail: "user@queue.com",
          serviceId: "srv_1",
          date: today,
          timeSlot: "09:30 - 10:00",
          note: "ขอคัดสำเนาเอกสารและรับรองความถูกต้อง",
          status: "in_service",
          counterNumber: 1,
          calledAt: new Date(now.getTime() - 600000).toISOString(),
          completedAt: null,
          createdAt: new Date(now.getTime() - 5000000).toISOString()
        },
        {
          id: "bk_003",
          queueNumber: "B001",
          userId: "u_guest1",
          customerName: "วิภาดา สดใส",
          customerPhone: "0855551234",
          customerEmail: "vipada@example.com",
          serviceId: "srv_2",
          date: today,
          timeSlot: "10:00 - 10:30",
          note: "นัดพบเจ้าหน้าที่ฝ่ายสิทธิประโยชน์",
          status: "in_service",
          counterNumber: 2,
          calledAt: new Date(now.getTime() - 300000).toISOString(),
          completedAt: null,
          createdAt: new Date(now.getTime() - 4000000).toISOString()
        },
        {
          id: "bk_004",
          queueNumber: "A003",
          userId: "u_guest2",
          customerName: "กิตติพงษ์ มั่นคง",
          customerPhone: "0861112233",
          customerEmail: "kittipong@example.com",
          serviceId: "srv_1",
          date: today,
          timeSlot: "10:30 - 11:00",
          note: "สอบถามขั้นตอนการโอนสิทธิ",
          status: "waiting",
          counterNumber: null,
          calledAt: null,
          completedAt: null,
          createdAt: new Date(now.getTime() - 3000000).toISOString()
        },
        {
          id: "bk_005",
          queueNumber: "C001",
          userId: "u_guest3",
          customerName: "นภัสวรรณ รุ่งเรือง",
          customerPhone: "0879998877",
          customerEmail: "napassawan@example.com",
          serviceId: "srv_3",
          date: today,
          timeSlot: "10:30 - 11:00",
          note: "ชำระค่าธรรมเนียมใบอนุญาต",
          status: "waiting",
          counterNumber: null,
          calledAt: null,
          completedAt: null,
          createdAt: new Date(now.getTime() - 2000000).toISOString()
        },
        {
          id: "bk_006",
          queueNumber: "B002",
          userId: "u_guest4",
          customerName: "ธนกร ยิ่งยง",
          customerPhone: "0823334455",
          customerEmail: "thanakorn@example.com",
          serviceId: "srv_2",
          date: today,
          timeSlot: "11:00 - 11:30",
          note: "ปรึกษาขั้นตอนการขออนุมัติโครงการ",
          status: "waiting",
          counterNumber: null,
          calledAt: null,
          completedAt: null,
          createdAt: new Date(now.getTime() - 1000000).toISOString()
        }
      ]
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial));
    return initial;
  },

  getLocalDB() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return this.resetLocalToDefault();
    try {
      return JSON.parse(raw);
    } catch (e) {
      return this.resetLocalToDefault();
    }
  },

  saveLocalDB(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  },

  // Auth Management
  getCurrentUser() {
    const raw = localStorage.getItem(this.AUTH_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.AUTH_KEY);
    }
  },

  logout() {
    this.setCurrentUser(null);
  },

  async login(identifier, password) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });
      const data = await res.json();
      if (data.success) {
        this.setCurrentUser(data.user);
      }
      return data;
    } else {
      const db = this.getLocalDB();
      const user = db.users.find(u =>
        (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) &&
        u.password === password
      );
      if (!user) {
        return { success: false, message: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' };
      }
      const { password: _, ...userSafe } = user;
      this.setCurrentUser(userSafe);
      return { success: true, message: 'เข้าสู่ระบบสำเร็จ', user: userSafe };
    }
  },

  async register(name, phone, email, password) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, password })
      });
      const data = await res.json();
      if (data.success) {
        this.setCurrentUser(data.user);
      }
      return data;
    } else {
      const db = this.getLocalDB();
      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
      if (existing) {
        return { success: false, message: 'อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' };
      }
      const newUser = {
        id: 'u_' + Date.now(),
        name,
        phone,
        email: email.toLowerCase(),
        password,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      this.saveLocalDB(db);
      const { password: _, ...userSafe } = newUser;
      this.setCurrentUser(userSafe);
      return { success: true, message: 'สมัครสมาชิกสำเร็จ', user: userSafe };
    }
  },

  // Services CRUD
  async getServices() {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/services`);
      const data = await res.json();
      return data.services || [];
    } else {
      const db = this.getLocalDB();
      return db.services || [];
    }
  },

  async createService(serviceData) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const newService = {
        id: 'srv_' + Date.now(),
        name: serviceData.name,
        codePrefix: (serviceData.codePrefix || 'A').toUpperCase(),
        durationMinutes: Number(serviceData.durationMinutes) || 15,
        maxPerSlot: Number(serviceData.maxPerSlot) || 3,
        description: serviceData.description || '',
        icon: serviceData.icon || 'tag',
        active: true
      };
      db.services.push(newService);
      this.saveLocalDB(db);
      return { success: true, service: newService, message: 'เพิ่มประเภทบริการสำเร็จ' };
    }
  },

  async updateService(id, serviceData) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const idx = db.services.findIndex(s => s.id === id);
      if (idx === -1) return { success: false, message: 'ไม่พบบริการนี้' };
      db.services[idx] = {
        ...db.services[idx],
        ...serviceData,
        codePrefix: (serviceData.codePrefix || db.services[idx].codePrefix).toUpperCase()
      };
      this.saveLocalDB(db);
      return { success: true, service: db.services[idx], message: 'แก้ไขข้อมูลบริการสำเร็จ' };
    }
  },

  async deleteService(id) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/services/${id}`, { method: 'DELETE' });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const idx = db.services.findIndex(s => s.id === id);
      if (idx === -1) return { success: false, message: 'ไม่พบบริการนี้' };

      const activeBookings = db.bookings.filter(b => b.serviceId === id && b.status === 'waiting');
      if (activeBookings.length > 0) {
        return {
          success: false,
          message: `ไม่สามารถลบได้เนื่องจากมีคิวที่รอรับบริการอยู่ ${activeBookings.length} คิว`
        };
      }

      db.services.splice(idx, 1);
      this.saveLocalDB(db);
      return { success: true, message: 'ลบประเภทบริการสำเร็จ' };
    }
  },

  // Bookings
  async getBookings(filter = {}) {
    if (this.isServerMode) {
      const params = new URLSearchParams();
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.date) params.append('date', filter.date);
      if (filter.serviceId) params.append('serviceId', filter.serviceId);
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);

      const res = await fetch(`${this.apiBase}/bookings?${params.toString()}`);
      const data = await res.json();
      return data.bookings || [];
    } else {
      const db = this.getLocalDB();
      let list = [...db.bookings];

      if (filter.userId) {
        list = list.filter(b => b.userId === filter.userId);
      }
      if (filter.date) {
        list = list.filter(b => b.date === filter.date);
      }
      if (filter.serviceId && filter.serviceId !== 'all') {
        list = list.filter(b => b.serviceId === filter.serviceId);
      }
      if (filter.status && filter.status !== 'all') {
        list = list.filter(b => b.status === filter.status);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(b =>
          b.queueNumber.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.includes(q)
        );
      }

      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list;
    }
  },

  async getBookingById(id) {
    const list = await this.getBookings();
    return list.find(b => b.id === id) || null;
  },

  async getBookingByQueue(queueNumber) {
    const list = await this.getBookings();
    return list.find(b => b.queueNumber.toUpperCase() === queueNumber.trim().toUpperCase()) || null;
  },

  async createBooking(bookingData) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const service = db.services.find(s => s.id === bookingData.serviceId);
      if (!service) return { success: false, message: 'ไม่พบประเภทบริการที่เลือก' };

      // Check slot capacity
      const maxCapacity = service.maxPerSlot || 3;
      const currentSlotBookings = db.bookings.filter(
        b => b.serviceId === bookingData.serviceId &&
             b.date === bookingData.date &&
             b.timeSlot === bookingData.timeSlot &&
             b.status !== 'cancelled'
      );

      if (currentSlotBookings.length >= maxCapacity) {
        return {
          success: false,
          message: `ช่วงเวลา ${bookingData.timeSlot} ในวันที่ ${bookingData.date} เต็มแล้ว กรุณาเลือกช่วงเวลาอื่น`
        };
      }

      // Check duplicate
      const duplicateUser = currentSlotBookings.find(
        b => b.customerPhone === bookingData.customerPhone ||
             (bookingData.userId && b.userId === bookingData.userId)
      );
      if (duplicateUser) {
        return {
          success: false,
          message: `คุณได้ทำการจองบริการนี้ในช่วงเวลา ${bookingData.timeSlot} ไว้อยู่แล้ว (คิว ${duplicateUser.queueNumber})`
        };
      }

      // Generate Queue Number
      const prefix = service.codePrefix || 'Q';
      const countForService = db.bookings.filter(
        b => b.serviceId === bookingData.serviceId && b.date === bookingData.date
      ).length;
      const seqStr = String(countForService + 1).padStart(3, '0');
      const queueNumber = `${prefix}${seqStr}`;

      const newBooking = {
        id: 'bk_' + Date.now(),
        queueNumber,
        userId: bookingData.userId || 'u_guest_' + Date.now(),
        customerName: bookingData.customerName,
        customerPhone: bookingData.customerPhone,
        customerEmail: bookingData.customerEmail || '',
        serviceId: bookingData.serviceId,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        note: bookingData.note || '',
        status: 'waiting',
        counterNumber: null,
        calledAt: null,
        completedAt: null,
        createdAt: new Date().toISOString()
      };

      db.bookings.push(newBooking);
      this.saveLocalDB(db);

      return {
        success: true,
        booking: newBooking,
        message: `จองคิวสำเร็จ! หมายเลขคิวของคุณคือ ${queueNumber}`
      };
    }
  },

  async cancelBooking(id) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/bookings/${id}/cancel`, { method: 'PUT' });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const idx = db.bookings.findIndex(b => b.id === id);
      if (idx === -1) return { success: false, message: 'ไม่พบข้อมูลการจองนี้' };

      if (db.bookings[idx].status === 'completed') {
        return { success: false, message: 'ไม่สามารถยกเลิกคิวที่ให้บริการเสร็จสิ้นแล้วได้' };
      }

      db.bookings[idx].status = 'cancelled';
      db.bookings[idx].cancelledAt = new Date().toISOString();
      this.saveLocalDB(db);

      return { success: true, booking: db.bookings[idx], message: 'ยกเลิกการจองคิวเรียบร้อยแล้ว' };
    }
  },

  async updateBookingStatus(id, status, counterNumber) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, counterNumber })
      });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const idx = db.bookings.findIndex(b => b.id === id);
      if (idx === -1) return { success: false, message: 'ไม่พบคิวนี้' };

      const bk = db.bookings[idx];
      bk.status = status;
      if (counterNumber !== undefined) {
        bk.counterNumber = Number(counterNumber);
      }
      if (status === 'in_service') {
        bk.calledAt = new Date().toISOString();
      } else if (status === 'completed') {
        bk.completedAt = new Date().toISOString();
      }

      this.saveLocalDB(db);
      return { success: true, booking: bk, message: `อัปเดตสถานะคิว ${bk.queueNumber} สำเร็จ` };
    }
  },

  async callNextQueue(serviceId, counterNumber = 1) {
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/queues/call-next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, counterNumber })
      });
      return await res.json();
    } else {
      const db = this.getLocalDB();
      const today = this.getTodayString();

      let candidates = db.bookings.filter(b => b.date === today && b.status === 'waiting');
      if (serviceId && serviceId !== 'all') {
        candidates = candidates.filter(b => b.serviceId === serviceId);
      }

      candidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      if (candidates.length === 0) {
        return { success: false, message: 'ไม่มีคิวที่กำลังรอรับบริการในขณะนี้' };
      }

      const nextQueue = candidates[0];
      nextQueue.status = 'in_service';
      nextQueue.counterNumber = Number(counterNumber);
      nextQueue.calledAt = new Date().toISOString();

      this.saveLocalDB(db);
      const service = db.services.find(s => s.id === nextQueue.serviceId);

      return {
        success: true,
        calledQueue: nextQueue,
        serviceName: service ? service.name : '',
        message: `เรียกคิว ${nextQueue.queueNumber} ไปยังช่องบริการ ${counterNumber}`
      };
    }
  },

  async getStats(date) {
    const today = date || this.getTodayString();
    if (this.isServerMode) {
      const res = await fetch(`${this.apiBase}/stats?date=${today}`);
      const data = await res.json();
      return data.stats;
    } else {
      const db = this.getLocalDB();
      const todayBookings = db.bookings.filter(b => b.date === today);

      const waiting = todayBookings.filter(b => b.status === 'waiting').length;
      const inService = todayBookings.filter(b => b.status === 'in_service');
      const completed = todayBookings.filter(b => b.status === 'completed').length;
      const cancelled = todayBookings.filter(b => b.status === 'cancelled').length;

      return {
        date: today,
        totalToday: todayBookings.length,
        waiting,
        inServiceCount: inService.length,
        inServiceQueues: inService,
        completed,
        cancelled,
        estimatedWaitMinutes: waiting * 15
      };
    }
  },

  async resetData() {
    if (this.isServerMode) {
      await fetch(`${this.apiBase}/reset`, { method: 'POST' });
    }
    this.resetLocalToDefault();
    return { success: true };
  },

  // Formatting utilities
  formatThaiDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    const year = parseInt(parts[0], 10) + 543;
    const month = thaiMonths[parseInt(parts[1], 10) - 1];
    const day = parseInt(parts[2], 10);

    return `${day} ${month} ${year}`;
  },

  getStatusBadge(status) {
    switch (status) {
      case 'waiting':
        return '<span class="badge badge-waiting"><span class="pulse-dot"></span> รอรับบริการ</span>';
      case 'in_service':
        return '<span class="badge badge-in_service"><span class="pulse-dot pulse"></span> กำลังให้บริการ</span>';
      case 'completed':
        return '<span class="badge badge-completed">✓ ให้บริการแล้ว</span>';
      case 'cancelled':
        return '<span class="badge badge-cancelled">✕ ยกเลิกคิวแล้ว</span>';
      case 'no_show':
        return '<span class="badge badge-no_show">ข้าม / ไม่มา</span>';
      default:
        return `<span class="badge">${status}</span>`;
    }
  }
};

window.DB = DB;
