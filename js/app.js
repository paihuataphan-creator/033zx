/**
 * SmartQueue - Core Application & SPA Router
 */

const App = {
  currentRoute: 'home',
  currentParams: {},

  async init() {
    console.log('🚀 Initializing SmartQueue App...');

    // Initialize Database
    await DB.init();

    // Render Auth Modal into DOM
    const modalHost = document.getElementById('modalHost');
    if (modalHost) {
      modalHost.innerHTML = AuthView.renderAuthModal();
    }

    // Bind URL hash change
    window.addEventListener('hashchange', () => this.handleHashChange());

    // Bind click outside dropdowns
    document.addEventListener('click', (e) => {
      const userBox = document.querySelector('.user-menu-box');
      const dropdown = document.getElementById('userDropdownMenu');
      if (dropdown && userBox && !userBox.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Update Navbar with logged in state
    this.updateNavbarUser();

    // Route initial page
    this.handleHashChange();
  },

  // Parse Hash and query params
  handleHashChange() {
    const rawHash = window.location.hash.slice(1) || 'home';
    const [routePart, queryPart] = rawHash.split('?');
    const route = routePart || 'home';

    const params = {};
    if (queryPart) {
      const urlParams = new URLSearchParams(queryPart);
      for (const [key, val] of urlParams.entries()) {
        params[key] = val;
      }
    }

    this.navigate(route, params, false);
  },

  // Navigate to route
  async navigate(route, params = {}, updateHash = true) {
    this.currentRoute = route;
    this.currentParams = params;

    if (updateHash) {
      const searchParams = new URLSearchParams(params).toString();
      const hashStr = searchParams ? `#${route}?${searchParams}` : `#${route}`;
      window.location.hash = hashStr;
      return;
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile nav drawer if open
    this.closeMobileDrawer();

    // Layout configuration: Fullscreen for TV display mode
    const siteHeader = document.getElementById('siteHeader');
    const siteFooter = document.getElementById('siteFooter');
    const appContainer = document.getElementById('appViewContainer');

    if (route === 'tv') {
      if (siteHeader) siteHeader.classList.add('hidden');
      if (siteFooter) siteFooter.classList.add('hidden');
    } else {
      if (siteHeader) siteHeader.classList.remove('hidden');
      if (siteFooter) siteFooter.classList.remove('hidden');
    }

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const target = link.getAttribute('data-route');
      link.classList.toggle('active', target === route);
    });

    // Render View
    let html = '';
    let afterRenderFn = null;

    try {
      switch (route) {
        case 'home':
          html = await HomeView.render();
          break;
        case 'booking':
          html = await BookingView.render(params);
          afterRenderFn = () => BookingView.afterRender();
          break;
        case 'status':
          html = await StatusView.render(params);
          afterRenderFn = () => StatusView.afterRender();
          break;
        case 'history':
          html = await HistoryView.render();
          break;
        case 'admin':
          html = await AdminView.render();
          break;
        case 'tv':
          html = await TvDisplayView.render();
          afterRenderFn = () => TvDisplayView.afterRender();
          break;
        default:
          html = await HomeView.render();
          break;
      }

      appContainer.innerHTML = html;

      if (afterRenderFn) {
        await afterRenderFn();
      }
    } catch (err) {
      console.error('Error rendering route:', route, err);
      appContainer.innerHTML = `
        <div class="container" style="padding: 3rem 0; text-align: center;">
          <h3 style="color: var(--danger);">เกิดข้อผิดพลาดในการโหลดหน้าเว็บ</h3>
          <p style="color: var(--navy-600); margin-top: 0.5rem;">${err.message}</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="App.navigate('home')">กลับสู่หน้าหลัก</button>
        </div>
      `;
    }
  },

  async refreshCurrentView() {
    await this.navigate(this.currentRoute, this.currentParams, false);
  },

  // Navbar user auth UI
  updateNavbarUser() {
    const user = DB.getCurrentUser();
    const guestBox = document.getElementById('navGuestActions');
    const userBox = document.getElementById('navUserActions');
    const adminLink = document.getElementById('navAdminLink');
    const mobileAdminLink = document.getElementById('mobileNavAdminLink');

    if (user) {
      if (guestBox) guestBox.classList.add('hidden');
      if (userBox) userBox.classList.remove('hidden');

      const nameEl = document.getElementById('navUserName');
      const avatarEl = document.getElementById('navUserAvatar');
      const dropNameEl = document.getElementById('dropUserName');
      const dropRoleEl = document.getElementById('dropUserRole');

      if (nameEl) nameEl.innerText = user.name.split(' ')[0];
      if (avatarEl) avatarEl.innerText = user.name.charAt(0).toUpperCase();
      if (dropNameEl) dropNameEl.innerText = user.name;
      if (dropRoleEl) dropRoleEl.innerText = user.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'สมาชิกผู้ใช้งาน';

      const showAdmin = user.role === 'admin';
      if (adminLink) adminLink.classList.toggle('hidden', !showAdmin);
      if (mobileAdminLink) mobileAdminLink.classList.toggle('hidden', !showAdmin);
    } else {
      if (guestBox) guestBox.classList.remove('hidden');
      if (userBox) userBox.classList.add('hidden');
      if (adminLink) adminLink.classList.add('hidden');
      if (mobileAdminLink) mobileAdminLink.classList.add('hidden');
    }
  },

  toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  },

  handleLogout() {
    DB.logout();
    this.updateNavbarUser();
    this.showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
    this.navigate('home');
  },

  // Mobile Drawer Toggle
  toggleMobileDrawer() {
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) {
      drawer.classList.toggle('open');
    }
  },

  closeMobileDrawer() {
    const drawer = document.getElementById('mobileNavDrawer');
    if (drawer) {
      drawer.classList.remove('open');
    }
  },

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-weight: 700; font-size: 1.1rem; line-height: 1;">${icon}</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3800);
  }
};

window.App = App;

// Bootstrap on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
