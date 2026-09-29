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
      if (!locationSelect || !locationSelect.value) {
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
      if (!locationSelect || !locationSelect.value) {
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
});
