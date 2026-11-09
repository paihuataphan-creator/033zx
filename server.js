/**
 * Online Queue Booking System - Backend Server
 * Built with native Node.js (Zero external dependencies needed!)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const DEFAULT_DATA_FILE = path.join(DATA_DIR, 'default-data.json');

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Format current date YYYY-MM-DD
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Load or initialize Database
function getInitialData() {
  const today = getTodayString();
  const now = new Date();
  
  let raw = fs.readFileSync(DEFAULT_DATA_FILE, 'utf8');
  raw = raw.replace(/TODAY_DATE/g, today);
  raw = raw.replace(/TODAY_TIME_0/g, new Date(now.getTime() - 3600000 * 2).toISOString());
  raw = raw.replace(/TODAY_TIME_1/g, new Date(now.getTime() - 1800000).toISOString());
  raw = raw.replace(/TODAY_TIME_2/g, new Date(now.getTime() - 600000).toISOString());
  raw = raw.replace(/TODAY_TIME_3/g, new Date(now.getTime() - 300000).toISOString());
  raw = raw.replace(/TODAY_TIME_4/g, new Date(now.getTime() - 120000).toISOString());

  return JSON.parse(raw);
}

function loadDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initData = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db, resetting to default:', err);
    const initData = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initData, null, 2), 'utf8');
    return initData;
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Helper to parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 2e6) { // 2MB limit
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Helper to send JSON response
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

// Generate next queue number for a service on a given date
function generateQueueNumber(db, serviceId, dateStr) {
  const service = db.services.find(s => s.id === serviceId);
  const prefix = service ? (service.codePrefix || 'Q') : 'Q';
  
  // Count existing bookings for this service on this date
  const bookingsForService = db.bookings.filter(b => b.serviceId === serviceId && b.date === dateStr);
  const nextSeq = bookingsForService.length + 1;
  const formattedSeq = String(nextSeq).padStart(3, '0');
  
  return `${prefix}${formattedSeq}`;
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    const db = loadDB();

    try {
      // 1. Health check
      if (pathname === '/api/health' && method === 'GET') {
        return sendJSON(res, 200, { status: 'ok', serverTime: new Date().toISOString() });
      }

      // 2. Auth: Register
      if (pathname === '/api/auth/register' && method === 'POST') {
        const body = await parseBody(req);
        const { name, phone, email, password } = body;

        if (!name || !phone || !email || !password) {
          return sendJSON(res, 400, { success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง' });
        }

        const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.phone === phone);
        if (existing) {
          return sendJSON(res, 400, { success: false, message: 'อีเมลหรือเบอร์โทรศัพท์นี้ถูกใช้งานแล้ว' });
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
        saveDB(db);

        const { password: _, ...userSafe } = newUser;
        return sendJSON(res, 201, { success: true, message: 'สมัครสมาชิกสำเร็จ', user: userSafe });
      }

      // 3. Auth: Login
      if (pathname === '/api/auth/login' && method === 'POST') {
        const body = await parseBody(req);
        const { identifier, password } = body; // identifier can be email or phone

        if (!identifier || !password) {
          return sendJSON(res, 400, { success: false, message: 'กรุณากรอกอีเมล/เบอร์โทรและรหัสผ่าน' });
        }

        const user = db.users.find(u => 
          (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) &&
          u.password === password
        );

        if (!user) {
          return sendJSON(res, 401, { success: false, message: 'อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง' });
        }

        const { password: _, ...userSafe } = user;
        return sendJSON(res, 200, {
          success: true,
          message: 'เข้าสู่ระบบสำเร็จ',
          user: userSafe,
          token: 'token_' + user.id + '_' + Date.now()
        });
      }

      // 4. Services: GET
      if (pathname === '/api/services' && method === 'GET') {
        return sendJSON(res, 200, { success: true, services: db.services });
      }

      // 5. Services: POST (Create)
      if (pathname === '/api/services' && method === 'POST') {
        const body = await parseBody(req);
        const { name, codePrefix, durationMinutes, description, icon, maxPerSlot } = body;

        if (!name || !codePrefix) {
          return sendJSON(res, 400, { success: false, message: 'กรุณากรอกชื่อบริการและรหัสตัวอักษรนำหน้า' });
        }

        const newService = {
          id: 'srv_' + Date.now(),
          name,
          codePrefix: codePrefix.toUpperCase(),
          durationMinutes: Number(durationMinutes) || 15,
          maxPerSlot: Number(maxPerSlot) || 3,
          description: description || '',
          icon: icon || 'tag',
          active: true
        };

        db.services.push(newService);
        saveDB(db);
        return sendJSON(res, 201, { success: true, service: newService, message: 'เพิ่มประเภทบริการสำเร็จ' });
      }

      // 6. Services: PUT /api/services/:id
      if (pathname.startsWith('/api/services/') && method === 'PUT') {
        const id = pathname.replace('/api/services/', '');
        const body = await parseBody(req);
        const index = db.services.findIndex(s => s.id === id);

        if (index === -1) {
          return sendJSON(res, 404, { success: false, message: 'ไม่พบบริการนี้' });
        }

        db.services[index] = {
          ...db.services[index],
          ...body,
          codePrefix: (body.codePrefix || db.services[index].codePrefix).toUpperCase()
        };
        saveDB(db);
        return sendJSON(res, 200, { success: true, service: db.services[index], message: 'แก้ไขข้อมูลบริการสำเร็จ' });
      }

      // 7. Services: DELETE /api/services/:id
      if (pathname.startsWith('/api/services/') && method === 'DELETE') {
        const id = pathname.replace('/api/services/', '');
        const index = db.services.findIndex(s => s.id === id);

        if (index === -1) {
          return sendJSON(res, 404, { success: false, message: 'ไม่พบบริการนี้' });
        }

        // Check if there are active bookings
        const activeBookings = db.bookings.filter(b => b.serviceId === id && b.status === 'waiting');
        if (activeBookings.length > 0) {
          return sendJSON(res, 400, {
            success: false,
            message: `ไม่สามารถลบได้เนื่องจากมีคิวที่กำลังรอรับบริการอยู่ ${activeBookings.length} คิว`
          });
        }

        db.services.splice(index, 1);
        saveDB(db);
        return sendJSON(res, 200, { success: true, message: 'ลบประเภทบริการสำเร็จ' });
      }

      // 8. Bookings: GET (Filtered)
      if (pathname === '/api/bookings' && method === 'GET') {
        const query = parsedUrl.query;
        let list = [...db.bookings];

        if (query.userId) {
          list = list.filter(b => b.userId === query.userId);
        }
        if (query.date) {
          list = list.filter(b => b.date === query.date);
        }
        if (query.serviceId) {
          list = list.filter(b => b.serviceId === query.serviceId);
        }
        if (query.status && query.status !== 'all') {
          list = list.filter(b => b.status === query.status);
        }
        if (query.search) {
          const q = query.search.toLowerCase();
          list = list.filter(b =>
            b.queueNumber.toLowerCase().includes(q) ||
            b.customerName.toLowerCase().includes(q) ||
            b.customerPhone.includes(q)
          );
        }

        // Sort: newest first or by queue order
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return sendJSON(res, 200, { success: true, bookings: list });
      }

      // 9. Bookings: POST (Create Booking)
      if (pathname === '/api/bookings' && method === 'POST') {
        const body = await parseBody(req);
        const { serviceId, date, timeSlot, customerName, customerPhone, customerEmail, note, userId } = body;

        if (!serviceId || !date || !timeSlot || !customerName || !customerPhone) {
          return sendJSON(res, 400, { success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
        }

        const service = db.services.find(s => s.id === serviceId);
        if (!service) {
          return sendJSON(res, 400, { success: false, message: 'ไม่พบประเภทบริการที่เลือก' });
        }

        // Check slot capacity (prevent duplicate overbooking)
        const maxCapacity = service.maxPerSlot || 3;
        const currentSlotBookings = db.bookings.filter(
          b => b.serviceId === serviceId && b.date === date && b.timeSlot === timeSlot && b.status !== 'cancelled'
        );

        if (currentSlotBookings.length >= maxCapacity) {
          return sendJSON(res, 400, {
            success: false,
            message: `ช่วงเวลา ${timeSlot} ในวันที่ ${date} มีผู้จองเต็มแล้ว กรุณาเลือกช่วงเวลาอื่น`
          });
        }

        // Check if user already booked the exact same slot
        const duplicateUser = currentSlotBookings.find(
          b => b.customerPhone === customerPhone || (userId && b.userId === userId)
        );
        if (duplicateUser) {
          return sendJSON(res, 400, {
            success: false,
            message: `คุณได้ทำการจองบริการนี้ในช่วงเวลา ${timeSlot} ไว้อยู่แล้ว (คิว ${duplicateUser.queueNumber})`
          });
        }

        // Generate automatic queue number
        const queueNumber = generateQueueNumber(db, serviceId, date);

        const newBooking = {
          id: 'bk_' + Date.now(),
          queueNumber,
          userId: userId || 'u_guest_' + Date.now(),
          customerName,
          customerPhone,
          customerEmail: customerEmail || '',
          serviceId,
          date,
          timeSlot,
          note: note || '',
          status: 'waiting', // waiting, in_service, completed, cancelled, no_show
          counterNumber: null,
          calledAt: null,
          completedAt: null,
          createdAt: new Date().toISOString()
        };

        db.bookings.push(newBooking);
        saveDB(db);

        return sendJSON(res, 201, {
          success: true,
          booking: newBooking,
          message: `จองคิวสำเร็จ! หมายเลขคิวของคุณคือ ${queueNumber}`
        });
      }

      // 10. Bookings: Cancel PUT /api/bookings/:id/cancel
      if (pathname.match(/^\/api\/bookings\/([^\/]+)\/cancel$/) && method === 'PUT') {
        const id = pathname.split('/')[3];
        const index = db.bookings.findIndex(b => b.id === id);

        if (index === -1) {
          return sendJSON(res, 404, { success: false, message: 'ไม่พบข้อมูลการจองนี้' });
        }

        if (db.bookings[index].status === 'completed') {
          return sendJSON(res, 400, { success: false, message: 'ไม่สามารถยกเลิกคิวที่ให้บริการเสร็จสิ้นแล้วได้' });
        }

        db.bookings[index].status = 'cancelled';
        db.bookings[index].cancelledAt = new Date().toISOString();
        saveDB(db);

        return sendJSON(res, 200, {
          success: true,
          booking: db.bookings[index],
          message: 'ยกเลิกการจองคิวเรียบร้อยแล้ว'
        });
      }

      // 11. Bookings: Change Status PUT /api/bookings/:id/status
      if (pathname.match(/^\/api\/bookings\/([^\/]+)\/status$/) && method === 'PUT') {
        const id = pathname.split('/')[3];
        const body = await parseBody(req);
        const { status, counterNumber } = body;

        const index = db.bookings.findIndex(b => b.id === id);
        if (index === -1) {
          return sendJSON(res, 404, { success: false, message: 'ไม่พบข้อมูลคิวนี้' });
        }

        const booking = db.bookings[index];
        booking.status = status;

        if (counterNumber !== undefined) {
          booking.counterNumber = counterNumber;
        }

        if (status === 'in_service') {
          booking.calledAt = new Date().toISOString();
        } else if (status === 'completed') {
          booking.completedAt = new Date().toISOString();
        }

        saveDB(db);
        return sendJSON(res, 200, {
          success: true,
          booking,
          message: `อัปเดตสถานะคิว ${booking.queueNumber} เป็น ${status} สำเร็จ`
        });
      }

      // 12. Call Next Queue: POST /api/queues/call-next
      if (pathname === '/api/queues/call-next' && method === 'POST') {
        const body = await parseBody(req);
        const { serviceId, counterNumber = 1 } = body;
        const today = getTodayString();

        // Complete any current queue at this counter if desired, or find next waiting queue
        let candidates = db.bookings.filter(b => b.date === today && b.status === 'waiting');

        if (serviceId && serviceId !== 'all') {
          candidates = candidates.filter(b => b.serviceId === serviceId);
        }

        // Sort by createdAt ascending (FIFO)
        candidates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        if (candidates.length === 0) {
          return sendJSON(res, 200, {
            success: false,
            message: 'ไม่มีคิวที่กำลังรอรับบริการในขณะนี้'
          });
        }

        const nextQueue = candidates[0];
        nextQueue.status = 'in_service';
        nextQueue.counterNumber = Number(counterNumber);
        nextQueue.calledAt = new Date().toISOString();

        saveDB(db);

        const service = db.services.find(s => s.id === nextQueue.serviceId);

        return sendJSON(res, 200, {
          success: true,
          calledQueue: nextQueue,
          serviceName: service ? service.name : '',
          message: `เรียกคิว ${nextQueue.queueNumber} ไปยังช่องบริการ ${counterNumber}`
        });
      }

      // 13. Stats & Overview: GET /api/stats
      if (pathname === '/api/stats' && method === 'GET') {
        const today = parsedUrl.query.date || getTodayString();
        const todayBookings = db.bookings.filter(b => b.date === today);

        const waiting = todayBookings.filter(b => b.status === 'waiting').length;
        const inService = todayBookings.filter(b => b.status === 'in_service');
        const completed = todayBookings.filter(b => b.status === 'completed').length;
        const cancelled = todayBookings.filter(b => b.status === 'cancelled').length;

        // Calculate estimated average wait time
        const avgMinutes = 15;
        const estimatedWait = waiting > 0 ? (waiting * avgMinutes) : 0;

        return sendJSON(res, 200, {
          success: true,
          stats: {
            date: today,
            totalToday: todayBookings.length,
            waiting,
            inServiceCount: inService.length,
            inServiceQueues: inService,
            completed,
            cancelled,
            estimatedWaitMinutes: estimatedWait
          }
        });
      }

      // 14. Reset Demo Data: POST /api/reset
      if (pathname === '/api/reset' && method === 'POST') {
        const fresh = getInitialData();
        saveDB(fresh);
        return sendJSON(res, 200, { success: true, message: 'รีเซ็ตข้อมูลระบบกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว' });
      }

      // Unknown API route
      return sendJSON(res, 404, { success: false, message: 'API Route Not Found' });

    } catch (err) {
      console.error('Server error:', err);
      return sendJSON(res, 500, { success: false, message: 'Server Internal Error: ' + err.message });
    }
  }

  // Serve Static Files
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  // Security check: ensure path stays inside root directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routing
      filePath = path.join(__dirname, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading ' + pathname);
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 SmartQueue - ระบบจองคิวออนไลน์ กำลังทำงาน`);
  console.log(`🔗 เข้าใช้งานเว็บไซต์: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
