// Pure Intensions Mobile Car Wash & Detail - Interactive Logic (All Makes & Models)

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initBeforeAfterSliders();
  initPackageCustomizer();
  initGalleryFilter();
  initGalleryLightbox();
  initBookingModal();
  initClipboardButtons();
  initSmoothScroll();
});

/* 1. Header & Navbar scroll */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('shadow-2xl', 'bg-opacity-95');
      navbar.classList.remove('bg-opacity-85');
    } else {
      navbar.classList.remove('shadow-2xl', 'bg-opacity-95');
      navbar.classList.add('bg-opacity-85');
    }
  });

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

/* 2. Before/After Image Comparison Slider */
function initBeforeAfterSliders() {
  const sliders = document.querySelectorAll('.before-after-container');

  sliders.forEach(container => {
    const overlay = container.querySelector('.before-after-overlay');
    const handle = container.querySelector('.before-after-handle');
    let isDragging = false;

    function updateSlider(xPos) {
      const rect = container.getBoundingClientRect();
      let pos = (xPos - rect.left) / rect.width;
      if (pos < 0) pos = 0;
      if (pos > 1) pos = 1;

      const percentage = pos * 100;
      overlay.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }

    // Mouse events
    container.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    });

    // Touch events for mobile phones
    container.addEventListener('touchstart', (e) => {
      isDragging = true;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });
  });
}

/* 3. Interactive Package & Quote Configurator (No Hardcoded Prices) */
function initPackageCustomizer() {
  const vehicleBtns = document.querySelectorAll('.calc-vehicle-btn');
  const packageCards = document.querySelectorAll('.calc-pkg-card');
  const addonCheckboxes = document.querySelectorAll('.calc-addon-check');
  const estimatedTimeEl = document.getElementById('calc-est-time');
  const selectedPkgNameEl = document.getElementById('calc-selected-pkg-name');
  const selectedVehicleEl = document.getElementById('calc-selected-vehicle');
  const selectedAddonsCountEl = document.getElementById('calc-addons-count');
  const bookingBtn = document.getElementById('calc-book-cta');

  let currentVehicleName = "Sedan / Coupe / Daily Driver";
  let basePackageName = "Complete Signature Full Detail";
  let basePackageHours = "2.5 - 3.5 hrs";

  function updateSummary() {
    const selectedAddons = [];
    addonCheckboxes.forEach(cb => {
      if (cb.checked) {
        selectedAddons.push(cb.dataset.name);
      }
    });

    if (selectedPkgNameEl) {
      selectedPkgNameEl.textContent = basePackageName;
    }
    if (selectedVehicleEl) {
      selectedVehicleEl.textContent = currentVehicleName;
    }
    if (estimatedTimeEl) {
      estimatedTimeEl.textContent = basePackageHours;
    }
    if (selectedAddonsCountEl) {
      selectedAddonsCountEl.textContent = selectedAddons.length > 0 
        ? `${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''} Selected (${selectedAddons.join(', ')})` 
        : 'None selected';
    }

    // Attach data for modal/booking integration
    if (bookingBtn) {
      bookingBtn.dataset.calcVehicle = currentVehicleName;
      bookingBtn.dataset.calcPackage = basePackageName;
      bookingBtn.dataset.calcAddons = selectedAddons.join(', ') || 'None';
    }
  }

  vehicleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      vehicleBtns.forEach(b => {
        b.classList.remove('border-yellow-500', 'bg-yellow-500/10', 'text-yellow-400');
        b.classList.add('border-slate-800', 'bg-slate-900/60', 'text-slate-400');
      });
      btn.classList.add('border-yellow-500', 'bg-yellow-500/10', 'text-yellow-400');
      btn.classList.remove('border-slate-800', 'bg-slate-900/60', 'text-slate-400');

      currentVehicleName = btn.dataset.vehicle;
      updateSummary();
    });
  });

  packageCards.forEach(card => {
    card.addEventListener('click', () => {
      packageCards.forEach(c => {
        c.classList.remove('border-yellow-500', 'bg-yellow-500/10');
        c.classList.add('border-slate-800', 'bg-slate-900/50');
      });
      card.classList.add('border-yellow-500', 'bg-yellow-500/10');
      card.classList.remove('border-slate-800', 'bg-slate-900/50');

      basePackageName = card.dataset.name;
      basePackageHours = card.dataset.time || "2.5 - 3.5 hrs";
      updateSummary();
    });
  });

  addonCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateSummary);
  });

  // Initial trigger
  updateSummary();
}

/* 4. Gallery Filter Tabs */
function initGalleryFilter() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-yellow-500', 'text-black', 'font-semibold');
        b.classList.add('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');
      });
      btn.classList.add('bg-yellow-500', 'text-black', 'font-semibold');
      btn.classList.remove('bg-slate-900', 'text-slate-300', 'hover:bg-slate-800');

      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category.includes(filter)) {
          item.style.display = 'block';
          item.classList.add('animate-fadeIn');
        } else {
          item.style.display = 'none';
        }
      });
    });
  });
}

/* 5. Gallery Lightbox Modal */
function initGalleryLightbox() {
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const closeBtn = document.getElementById('lightbox-close');
  const galleryCards = document.querySelectorAll('.gallery-card');

  if (!lightbox) return;

  galleryCards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('.gallery-card-title')?.textContent || 'Pure Intensions Detailing';
      const desc = card.querySelector('.gallery-card-desc')?.textContent || 'Mobile Car Wash & Detail';

      lightboxImg.src = img.src;
      lightboxTitle.textContent = title;
      lightboxDesc.textContent = desc;

      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* 6. Booking & Dispatch Modal */
function initBookingModal() {
  const modal = document.getElementById('booking-modal');
  const openButtons = document.querySelectorAll('.open-booking-modal-btn');
  const closeBtn = document.getElementById('booking-modal-close');
  const bookingForm = document.getElementById('booking-form');
  const calcBookCTA = document.getElementById('calc-book-cta');

  function openModal(prefillData = {}) {
    if (!modal) return;
    if (prefillData.package) {
      const pkgSelect = document.getElementById('modal-package-select');
      if (pkgSelect) {
        for (let opt of pkgSelect.options) {
          if (opt.value.includes(prefillData.package) || prefillData.package.includes(opt.value)) {
            opt.selected = true;
            break;
          }
        }
      }
    }
    if (prefillData.notes) {
      const notesEl = document.getElementById('modal-notes');
      if (notesEl && !notesEl.value) {
        notesEl.value = prefillData.notes;
      }
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const pkg = btn.dataset.service || '';
      openModal({ package: pkg });
    });
  });

  if (calcBookCTA) {
    calcBookCTA.addEventListener('click', () => {
      const vehicle = calcBookCTA.dataset.calcVehicle || 'Vehicle';
      const pkg = calcBookCTA.dataset.calcPackage || 'Complete Full Detail';
      const addons = calcBookCTA.dataset.calcAddons || 'None';

      const notes = `Selected Vehicle Class: ${vehicle} | Package: ${pkg} | Add-ons: ${addons}`;
      openModal({ package: pkg, notes: notes });
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Handle Form Submission with simulated dispatch and WhatsApp/SMS bridge
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('modal-name')?.value || 'Client';
      const phone = document.getElementById('modal-phone')?.value || '';
      const address = document.getElementById('modal-address')?.value || 'Los Angeles, CA';
      const carModel = document.getElementById('modal-carmodel')?.value || 'Vehicle';
      const service = document.getElementById('modal-package-select')?.value || 'Mobile Detail';
      const date = document.getElementById('modal-date')?.value || 'ASAP';
      const time = document.getElementById('modal-time')?.value || 'Open 24/7';
      const notes = document.getElementById('modal-notes')?.value || '';

      const summary = `*PURE INTENSIONS MOBILE CAR WASH & DETAIL*\n` +
        `• Client: ${name}\n` +
        `• Phone: ${phone}\n` +
        `• Address: ${address}\n` +
        `• Vehicle: ${carModel}\n` +
        `• Service Requested: ${service}\n` +
        `• Requested Slot: ${date} at ${time}\n` +
        `• Details: ${notes}`;

      // Open Success Toast
      showToast(`Booking request received for ${name}! Our 24/7 mobile dispatcher will call or text ${phone} shortly.`);
      closeModal();

      // Trigger pre-filled SMS link on mobile devices
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const smsUri = `sms:+13463773170?body=${encodeURIComponent(summary)}`;
        setTimeout(() => {
          if (confirm("Would you also like to send this request directly to our dispatch phone via SMS for immediate confirmation?")) {
            window.location.href = smsUri;
          }
        }, 800);
      }
    });
  }
}

/* 7. Clipboard and Location Utilities */
function initClipboardButtons() {
  const copyButtons = document.querySelectorAll('.copy-text-btn');

  copyButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.dataset.copyText;
      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = `<span class="text-green-400 font-bold">✓ Copied!</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      });
    });
  });
}

/* 8. Toast Notifications */
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed bottom-24 right-6 z-50 max-w-md bg-slate-900 border-2 border-yellow-500 text-white px-5 py-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-10 opacity-0 flex items-start gap-3';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="text-yellow-400 text-2xl">✨</div>
    <div>
      <h4 class="font-bold text-yellow-400 text-sm">Pure Intensions Dispatch</h4>
      <p class="text-xs text-slate-200 mt-1">${message}</p>
    </div>
  `;

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, 6000);
}

/* 9. Smooth scrolling for internal anchor links */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}
