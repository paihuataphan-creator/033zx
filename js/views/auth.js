/**
 * SmartQueue - Auth View & Modals
 */

const AuthView = {
  renderAuthModal() {
    return `
      <div id="authModal" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title" id="authModalTitle">เข้าสู่ระบบ SmartQueue</h3>
            <button class="modal-close-btn" onclick="AuthView.close()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Tabs: Login / Register -->
            <div class="filter-tabs" style="margin-bottom: 1.25rem;">
              <button class="filter-tab active" id="tabBtnLogin" onclick="AuthView.switchTab('login')">เข้าสู่ระบบ</button>
              <button class="filter-tab" id="tabBtnRegister" onclick="AuthView.switchTab('register')">สมัครสมาชิกใหม่</button>
            </div>

            <!-- Login Form -->
            <form id="formLogin" onsubmit="AuthView.handleLogin(event)">
              <div class="form-group">
                <label class="form-label">อีเมล หรือ เบอร์โทรศัพท์ <span class="required">*</span></label>
                <input type="text" id="loginIdentifier" class="form-control" placeholder="เช่น user@queue.com หรือ 0812345678" required>
              </div>
              <div class="form-group">
                <label class="form-label">รหัสผ่าน <span class="required">*</span></label>
                <input type="password" id="loginPassword" class="form-control" placeholder="กรอกรหัสผ่านของคุณ" required>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 1.5rem;">
                เข้าสู่ระบบ
              </button>

              <!-- Quick Demo Access Box -->
              <div style="margin-top: 1.5rem; padding: 1rem; background-color: var(--gray-50); border-radius: var(--radius-md); border: 1px dashed var(--gray-300);">
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--navy-700); margin-bottom: 0.5rem; text-align: center;">
                  ⚡ เข้าใช้งานด่วนสำหรับการทดสอบ (คลิกครั้งเดียว)
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" class="btn btn-outline btn-sm btn-block" onclick="AuthView.fillDemo('user')">
                    👤 ผู้ใช้ทั่วไป (Demo)
                  </button>
                  <button type="button" class="btn btn-secondary btn-sm btn-block" onclick="AuthView.fillDemo('admin')">
                    🛡️ ผู้ดูแลระบบ (Admin)
                  </button>
                </div>
              </div>
            </form>

            <!-- Register Form -->
            <form id="formRegister" class="hidden" onsubmit="AuthView.handleRegister(event)">
              <div class="form-group">
                <label class="form-label">ชื่อ - นามสกุล <span class="required">*</span></label>
                <input type="text" id="regName" class="form-control" placeholder="เช่น นายสมชาย ใจดี" required>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">เบอร์โทรศัพท์ <span class="required">*</span></label>
                  <input type="tel" id="regPhone" class="form-control" placeholder="เช่น 0812345678" pattern="[0-9]{9,10}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">อีเมล <span class="required">*</span></label>
                  <input type="email" id="regEmail" class="form-control" placeholder="name@example.com" required>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">รหัสผ่าน <span class="required">*</span></label>
                  <input type="password" id="regPassword" class="form-control" placeholder="อย่างน้อย 6 ตัวอักษร" minlength="6" required>
                </div>
                <div class="form-group">
                  <label class="form-label">ยืนยันรหัสผ่าน <span class="required">*</span></label>
                  <input type="password" id="regPasswordConfirm" class="form-control" placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง" minlength="6" required>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-block btn-lg" style="margin-top: 1rem;">
                สร้างบัญชีผู้ใช้งาน
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  open(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.add('open');
      this.switchTab(tab);
    }
  },

  close() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('open');
    }
  },

  switchTab(tab) {
    const btnLogin = document.getElementById('tabBtnLogin');
    const btnReg = document.getElementById('tabBtnRegister');
    const formLogin = document.getElementById('formLogin');
    const formReg = document.getElementById('formRegister');
    const title = document.getElementById('authModalTitle');

    if (tab === 'login') {
      btnLogin.classList.add('active');
      btnReg.classList.remove('active');
      formLogin.classList.remove('hidden');
      formReg.classList.add('hidden');
      title.innerText = 'เข้าสู่ระบบ SmartQueue';
    } else {
      btnLogin.classList.remove('active');
      btnReg.classList.add('active');
      formLogin.classList.add('hidden');
      formReg.classList.remove('hidden');
      title.innerText = 'สมัครสมาชิกใหม่';
    }
  },

  fillDemo(type) {
    if (type === 'admin') {
      document.getElementById('loginIdentifier').value = 'admin@queue.com';
      document.getElementById('loginPassword').value = 'password123';
    } else {
      document.getElementById('loginIdentifier').value = 'user@queue.com';
      document.getElementById('loginPassword').value = 'password123';
    }
    App.showToast('กรอกข้อมูลทดสอบเรียบร้อยแล้ว กดเข้าสู่ระบบได้เลย', 'info');
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;

    const res = await DB.login(identifier, password);
    if (res.success) {
      App.showToast(`ยินดีต้อนรับคุณ ${res.user.name}`, 'success');
      this.close();
      App.updateNavbarUser();
      
      // If admin, ask or route to admin
      if (res.user.role === 'admin') {
        App.navigate('admin');
      } else {
        App.refreshCurrentView();
      }
    } else {
      App.showToast(res.message || 'เข้าสู่ระบบไม่สำเร็จ', 'error');
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const passConfirm = document.getElementById('regPasswordConfirm').value;

    if (pass !== passConfirm) {
      App.showToast('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน', 'error');
      return;
    }

    const res = await DB.register(name, phone, email, pass);
    if (res.success) {
      App.showToast('สมัครสมาชิกและเข้าสู่ระบบสำเร็จ', 'success');
      this.close();
      App.updateNavbarUser();
      App.refreshCurrentView();
    } else {
      App.showToast(res.message || 'สมัครสมาชิกไม่สำเร็จ', 'error');
    }
  }
};

window.AuthView = AuthView;
