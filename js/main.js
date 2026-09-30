document.addEventListener('DOMContentLoaded', function () {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        var headerOffset = 70;
        var elementPosition = target.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Sticky Nav & Active Link Highlight on Scroll
  var bannerNav = document.querySelector('.banner-nav');
  var navLinks = document.querySelectorAll('.nav-links a:not(.btn)');
  var trackedSections = [];
  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.startsWith('#') && href.length > 1) {
      var sec = document.querySelector(href);
      if (sec) {
        trackedSections.push({ id: href, el: sec, link: link });
      }
    }
  });

  window.addEventListener('scroll', function () {
    if (bannerNav) {
      if (window.scrollY > 50) {
        bannerNav.classList.add('nav-scrolled');
      } else {
        bannerNav.classList.remove('nav-scrolled');
      }
    }

    if (trackedSections.length > 0) {
      var scrollPos = window.pageYOffset + 140;
      var activeFound = false;
      for (var i = trackedSections.length - 1; i >= 0; i--) {
        var item = trackedSections[i];
        if (scrollPos >= item.el.offsetTop) {
          navLinks.forEach(function (l) { l.classList.remove('active'); });
          item.link.classList.add('active');
          activeFound = true;
          break;
        }
      }
      if (!activeFound && navLinks.length > 0) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        navLinks[0].classList.add('active');
      }
    }
  });

  // Scroll & Button Popup Modal Logic
  var propertyModal = document.getElementById('property-modal');
  var modalCloseBtn = document.getElementById('modal-close-btn');
  var popupShown = false;

  // Open modal via Enquiry button or any .open-modal-trigger
  var enquiryModalTriggers = document.querySelectorAll('.open-modal-trigger, #open-enquiry-modal-btn');
  enquiryModalTriggers.forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      e.preventDefault();
      if (propertyModal) {
        if (typeof resetModalForm === 'function') {
          resetModalForm();
        }
        propertyModal.classList.add('active');
      }
    });
  });

  if (propertyModal && modalCloseBtn) {
    window.addEventListener('scroll', function () {
      // Show modal on first scroll past 50px
      if (window.scrollY > 50 && !popupShown) {
        propertyModal.classList.add('active');
        popupShown = true;
      }
    });

    // Close modal on 'X' click
    modalCloseBtn.addEventListener('click', function () {
      propertyModal.classList.remove('active');
    });

    // Close modal when clicking outside
    propertyModal.addEventListener('click', function (e) {
      if (e.target === propertyModal) {
        propertyModal.classList.remove('active');
      }
    });

    // Handle segmented toggle active state
    var toggles = document.querySelectorAll('.modal-toggle');
    toggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        toggles.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        this.querySelector('input').checked = true;
      });
    });
  }

  // Helper to clear modal field error
  window.clearModalError = function (groupId) {
    var group = document.getElementById(groupId);
    if (group) {
      group.classList.remove('has-error');
    }
  };

  // Popup Modal Form Validation & Submission
  var popupForm = document.getElementById('popup-form');
  var modalSuccess = document.getElementById('modal-success');
  var modalSuccessClose = document.getElementById('modal-success-close');

  function resetModalForm() {
    if (popupForm) {
      popupForm.reset();
      popupForm.style.display = '';
      document.querySelectorAll('#popup-form .has-error, #fg-privacy.has-error').forEach(function (el) {
        el.classList.remove('has-error');
      });
      document.querySelectorAll('.location-dropdown').forEach(function (d) {
        d.classList.remove('is-open');
        d.innerHTML = '';
      });
      var defaultRadio = document.querySelector('input[name="preferred_contact"][value="Request a call back"]');
      if (defaultRadio) {
        defaultRadio.checked = true;
      }
    }
    if (modalSuccess) {
      modalSuccess.classList.remove('active');
    }
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', function () {
      setTimeout(resetModalForm, 400);
    });
  }
  if (propertyModal) {
    propertyModal.addEventListener('click', function (e) {
      if (e.target === propertyModal) {
        setTimeout(resetModalForm, 400);
      }
    });
  }

  if (modalSuccessClose && propertyModal) {
    modalSuccessClose.addEventListener('click', function () {
      propertyModal.classList.remove('active');
      setTimeout(resetModalForm, 400);
    });
  }

  if (popupForm) {
    popupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var isValid = true;
      var firstInvalidElement = null;

      var nameInput = document.getElementById('modal-name');
      var mobileInput = document.getElementById('modal-mobile');
      var emailInput = document.getElementById('modal-email');
      var locationSelect = document.getElementById('modal-location');
      var propertyTypeSelect = document.getElementById('modal-property-type');
      var ownerSelect = document.getElementById('modal-owner');
      var reqTextarea = document.getElementById('modal-requirement');
      var privacyCheckbox = document.getElementById('modal-privacy');

      // 1. Full Name: Required, min 3 characters, alphabets
      var nameVal = nameInput ? nameInput.value.trim() : '';
      if (!nameVal || nameVal.length < 3) {
        document.getElementById('fg-name').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = nameInput;
      }

      // 2. Mobile: Required, exactly 10 digits
      var mobileVal = mobileInput ? mobileInput.value.trim() : '';
      if (!mobileVal || !/^[6-9]\d{9}$/.test(mobileVal) && !/^\d{10}$/.test(mobileVal)) {
        document.getElementById('fg-mobile').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = mobileInput;
      }

      // 3. Email: Required, valid email format
      var emailVal = emailInput ? emailInput.value.trim() : '';
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        document.getElementById('fg-email').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = emailInput;
      }

      // 4. Location: Required
      var locationVal = locationSelect ? locationSelect.value.trim() : '';
      if (!locationVal) {
        document.getElementById('fg-location').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = locationSelect;
      }

      // 5. Property Type: Required
      if (!propertyTypeSelect || !propertyTypeSelect.value) {
        document.getElementById('fg-property-type').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = propertyTypeSelect;
      }

      // 6. Are you property owner: Required
      if (!ownerSelect || !ownerSelect.value) {
        document.getElementById('fg-owner').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = ownerSelect;
      }

      // 7. Preferred Mode of Contact: Required
      var contactModeChecked = document.querySelector('input[name="preferred_contact"]:checked');
      if (!contactModeChecked) {
        document.getElementById('fg-contact-mode').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = document.querySelector('input[name="preferred_contact"]');
      }

      // 8. Requirement: Required, min 10 characters
      var reqVal = reqTextarea ? reqTextarea.value.trim() : '';
      if (!reqVal || reqVal.length < 10) {
        document.getElementById('fg-requirement').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = reqTextarea;
      }

      // 9. Privacy policy: Required
      if (!privacyCheckbox || !privacyCheckbox.checked) {
        document.getElementById('fg-privacy').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = privacyCheckbox;
      }

      if (!isValid) {
        if (firstInvalidElement && typeof firstInvalidElement.focus === 'function') {
          firstInvalidElement.focus();
        }
        return;
      }

      // If valid, show success confirmation
      popupForm.style.display = 'none';
      if (modalSuccess) {
        modalSuccess.classList.add('active');
        var successMsg = document.getElementById('modal-success-msg');
        var selectedMode = contactModeChecked ? contactModeChecked.value : 'Call Back';
        if (successMsg) {
          successMsg.textContent = 'Thank you, ' + nameVal + '! Your property requirement has been recorded (Selected: ' + selectedMode + '). Our team in Tamilnadu will connect with you on +91 ' + mobileVal + ' shortly.';
        }
      }
    });
  }

  // Handle Brochure Form submission with custom validation for all fields
  var brochureForm = document.getElementById('brochure-form');
  if (brochureForm) {
    brochureForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var isValid = true;
      var firstInvalidElement = null;

      var nameInput = document.getElementById('bf-name');
      var mobileInput = document.getElementById('bf-mobile');
      var emailInput = document.getElementById('bf-email');
      var locationSelect = document.getElementById('bf-location');
      var propertyTypeSelect = document.getElementById('bf-property-type');
      var ownerSelect = document.getElementById('bf-owner');
      var reqTextarea = document.getElementById('bf-requirement');
      var privacyCheckbox = document.getElementById('bf-privacy');

      // 1. Full Name: Required, min 3 characters
      var nameVal = nameInput ? nameInput.value.trim() : '';
      if (!nameVal || nameVal.length < 3) {
        document.getElementById('bf-fg-name').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = nameInput;
      }

      // 2. Mobile: Required, 10 digits
      var mobileVal = mobileInput ? mobileInput.value.trim() : '';
      if (!mobileVal || (!/^[6-9]\d{9}$/.test(mobileVal) && !/^\d{10}$/.test(mobileVal))) {
        document.getElementById('bf-fg-mobile').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = mobileInput;
      }

      // 3. Email: Required, valid email format
      var emailVal = emailInput ? emailInput.value.trim() : '';
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        document.getElementById('bf-fg-email').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = emailInput;
      }

      // 4. Location: Required
      var locationVal = locationSelect ? locationSelect.value.trim() : '';
      if (!locationVal) {
        document.getElementById('bf-fg-location').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = locationSelect;
      }

      // 5. Property Type: Required
      if (!propertyTypeSelect || !propertyTypeSelect.value) {
        document.getElementById('bf-fg-property-type').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = propertyTypeSelect;
      }

      // 6. Are you property owner: Required
      if (!ownerSelect || !ownerSelect.value) {
        document.getElementById('bf-fg-owner').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = ownerSelect;
      }

      // 7. Preferred Mode of Contact: Required
      var contactModeChecked = document.querySelector('input[name="bf_preferred_contact"]:checked');
      if (!contactModeChecked) {
        document.getElementById('bf-fg-contact-mode').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = document.querySelector('input[name="bf_preferred_contact"]');
      }

      // 8. Requirement: Required, min 10 characters
      var reqVal = reqTextarea ? reqTextarea.value.trim() : '';
      if (!reqVal || reqVal.length < 10) {
        document.getElementById('bf-fg-requirement').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = reqTextarea;
      }

      // 9. Privacy policy: Required
      if (!privacyCheckbox || !privacyCheckbox.checked) {
        document.getElementById('bf-fg-privacy').classList.add('has-error');
        isValid = false;
        if (!firstInvalidElement) firstInvalidElement = privacyCheckbox;
      }

      if (!isValid) {
        if (firstInvalidElement && typeof firstInvalidElement.focus === 'function') {
          firstInvalidElement.focus();
        }
        return;
      }

      // Open PDF in new tab
      window.open('assets/The_Property_Guardian_Brochure.pdf', '_blank');

      // Show success message inside card
      var successBox = document.getElementById('bf-success-msg');
      var successText = document.getElementById('bf-success-text');
      var selectedMode = contactModeChecked ? contactModeChecked.value : 'Call Back';
      if (successBox && successText) {
        successText.textContent = 'Thank you, ' + nameVal + '! Your brochure download has started. Our team will contact you via ' + selectedMode + ' on +91 ' + mobileVal + ' shortly.';
        successBox.style.display = 'flex';
      }

      brochureForm.reset();
    });
  }

  // Global helper to clear error on input
  window.clearError = function(inputElement) {
    inputElement.classList.remove('has-error');
  };


  // Number Counter Animation
  const statsSection = document.getElementById('stats-grid');
  if (statsSection) {
    const statNumbers = document.querySelectorAll('.stat-number');
    let animated = false;

    const animateNumbers = () => {
      statNumbers.forEach(stat => {
        const target = parseFloat(stat.getAttribute('data-target'));
        const isDecimal = stat.getAttribute('data-decimal') === 'true';
        const duration = 2000;
        const frameRate = 1000 / 60;
        const totalFrames = Math.round(duration / frameRate);
        let frame = 0;

        const counter = setInterval(() => {
          frame++;
          const progress = frame / totalFrames;
          const current = (progress === 1) ? target : target * (1 - Math.pow(2, -10 * progress));

          if (isDecimal) {
            stat.innerText = current.toFixed(1);
          } else {
            stat.innerText = Math.floor(current);
          }

          if (frame >= totalFrames) {
            clearInterval(counter);
            stat.innerText = isDecimal ? target.toFixed(1) : target;
          }
        }, frameRate);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !animated) {
        animated = true;
        animateNumbers();
      }
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  }

  // Testimonials One-by-One Slider Logic
  var testiSlides = document.querySelectorAll('.testi-slide');
  var testiDots = document.querySelectorAll('.testi-dot');
  var testiPrevBtn = document.getElementById('testi-prev');
  var testiNextBtn = document.getElementById('testi-next');
  var testiCounter = document.getElementById('testi-counter');
  var testiSliderWrapper = document.querySelector('.testi-slider-wrapper');

  if (testiSlides.length > 0) {
    var currentSlide = 0;
    var totalSlides = testiSlides.length;
    var autoPlayTimer = null;

    function goToSlide(index) {
      testiSlides.forEach(function (slide) {
        slide.classList.remove('active');
      });
      testiDots.forEach(function (dot) {
        dot.classList.remove('active');
      });

      currentSlide = (index + totalSlides) % totalSlides;
      testiSlides[currentSlide].classList.add('active');
      if (testiDots[currentSlide]) {
        testiDots[currentSlide].classList.add('active');
      }
      if (testiCounter) {
        var num = currentSlide + 1;
        testiCounter.textContent = (num < 10 ? '0' + num : num) + ' / ' + (totalSlides < 10 ? '0' + totalSlides : totalSlides);
      }
    }

    if (testiNextBtn) {
      testiNextBtn.addEventListener('click', function () {
        goToSlide(currentSlide + 1);
        resetAutoPlay();
      });
    }

    if (testiPrevBtn) {
      testiPrevBtn.addEventListener('click', function () {
        goToSlide(currentSlide - 1);
        resetAutoPlay();
      });
    }

    testiDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var slideIndex = parseInt(this.getAttribute('data-slide'), 10);
        goToSlide(slideIndex);
        resetAutoPlay();
      });
    });

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayTimer = setInterval(function () {
        goToSlide(currentSlide + 1);
      }, 5500);
    }

    function stopAutoPlay() {
      if (autoPlayTimer) {
        clearInterval(autoPlayTimer);
        autoPlayTimer = null;
      }
    }

    function resetAutoPlay() {
      stopAutoPlay();
      startAutoPlay();
    }

    if (testiSliderWrapper) {
      testiSliderWrapper.addEventListener('mouseenter', stopAutoPlay);
      testiSliderWrapper.addEventListener('mouseleave', startAutoPlay);

      // Touch swipe support for mobile devices
      var touchStartX = 0;
      var touchEndX = 0;
      testiSliderWrapper.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      testiSliderWrapper.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 40) {
          goToSlide(currentSlide + 1);
          resetAutoPlay();
        } else if (touchEndX > touchStartX + 40) {
          goToSlide(currentSlide - 1);
          resetAutoPlay();
        }
      }, { passive: true });
    }

    startAutoPlay();
  }

  // Live Location Autocomplete (OpenStreetMap / Photon - 100% Free, No API Key needed)
  function setupLocationAutocomplete(inputId, errorGroupId) {
    var input = document.getElementById(inputId);
    if (!input) return;

    var container = input.closest('.input-with-icon');
    if (!container) return;

    var dropdown = document.createElement('div');
    dropdown.className = 'location-dropdown';
    container.appendChild(dropdown);

    var debounceTimer = null;
    var currentAbortController = null;
    var selectedIndex = -1;
    var currentItems = [];

    function closeDropdown() {
      dropdown.classList.remove('is-open');
      dropdown.innerHTML = '';
      selectedIndex = -1;
      currentItems = [];
    }

    input.addEventListener('input', function () {
      var query = input.value.trim();
      clearTimeout(debounceTimer);

      if (query.length < 2) {
        closeDropdown();
        return;
      }

      debounceTimer = setTimeout(function () {
        if (currentAbortController) {
          try { currentAbortController.abort(); } catch (err) {}
        }
        if (typeof AbortController !== 'undefined') {
          currentAbortController = new AbortController();
        }

        dropdown.innerHTML = '<div class="location-loading">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle><path d="M12 2a10 10 0 0 1 10 10"></path></svg>' +
          'Searching locations...</div>';
        dropdown.classList.add('is-open');

        var url = 'https://photon.komoot.io/api/?q=' + encodeURIComponent(query) + '&limit=6&lat=11.1271&lon=78.6569';
        var fetchOpts = currentAbortController ? { signal: currentAbortController.signal } : {};

        fetch(url, fetchOpts)
          .then(function (res) { return res.json(); })
          .then(function (data) {
            dropdown.innerHTML = '';
            selectedIndex = -1;
            currentItems = [];

            if (!data || !data.features || data.features.length === 0) {
              dropdown.innerHTML = '<div class="location-loading" style="color:#94a3b8;">No matching places found. You can still type your location.</div>';
              return;
            }

            var seen = new Set();
            var places = [];

            data.features.forEach(function (f) {
              var props = f.properties || {};
              var name = props.name || '';
              if (!name) return;

              var parts = [];
              if (props.city && props.city !== name) parts.push(props.city);
              if (props.district && props.district !== name && props.district !== props.city) parts.push(props.district);
              if (props.state) parts.push(props.state);
              else if (props.country) parts.push(props.country);

              var subText = parts.join(', ');
              var fullLabel = subText ? (name + ', ' + subText) : name;
              var key = fullLabel.toLowerCase();

              if (!seen.has(key)) {
                seen.add(key);
                places.push({ name: name, sub: subText, full: fullLabel });
              }
            });

            if (places.length === 0) {
              dropdown.innerHTML = '<div class="location-loading" style="color:#94a3b8;">No matching places found. You can still type your location.</div>';
              return;
            }

            places.slice(0, 5).forEach(function (item) {
              var div = document.createElement('div');
              div.className = 'location-item';
              div.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>' +
                '<circle cx="12" cy="10" r="3"></circle>' +
                '</svg>' +
                '<div class="location-item-text">' +
                '<span class="location-item-name">' + escapeHtml(item.name) + '</span>' +
                (item.sub ? '<span class="location-item-sub">(' + escapeHtml(item.sub) + ')</span>' : '') +
                '</div>';

              div.addEventListener('click', function () {
                input.value = item.full;
                if (typeof clearModalError === 'function') {
                  clearModalError(errorGroupId);
                }
                closeDropdown();
              });

              dropdown.appendChild(div);
              currentItems.push({ element: div, full: item.full });
            });
          })
          .catch(function (err) {
            if (err && err.name !== 'AbortError') {
              closeDropdown();
            }
          });
      }, 250);
    });

    input.addEventListener('keydown', function (e) {
      if (!dropdown.classList.contains('is-open') || currentItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % currentItems.length;
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
        updateSelection();
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
          e.preventDefault();
          input.value = currentItems[selectedIndex].full;
          if (typeof clearModalError === 'function') {
            clearModalError(errorGroupId);
          }
          closeDropdown();
        }
      } else if (e.key === 'Escape') {
        closeDropdown();
      }
    });

    function updateSelection() {
      currentItems.forEach(function (it, idx) {
        if (idx === selectedIndex) {
          it.element.classList.add('is-selected');
          it.element.scrollIntoView({ block: 'nearest' });
        } else {
          it.element.classList.remove('is-selected');
        }
      });
    }

    document.addEventListener('click', function (e) {
      if (!container.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, function (tag) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag);
    });
  }

  setupLocationAutocomplete('modal-location', 'fg-location');
  setupLocationAutocomplete('bf-location', 'bf-fg-location');
});
