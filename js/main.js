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

  // Handle Brochure Form submission with custom validation
  var brochureForm = document.getElementById('brochure-form');
  if (brochureForm) {
    brochureForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var isValid = true;
      
      var nameInput = document.getElementById('bf-name');
      var mobileInput = document.getElementById('bf-mobile');
      var emailInput = document.getElementById('bf-email');
      
      // Validate Name (basic empty/length check, characters restricted via oninput)
      if (!nameInput.value.trim() || nameInput.value.length < 3) {
        nameInput.classList.add('has-error');
        isValid = false;
      }
      
      // Validate Mobile (minimum 10 digits)
      if (!mobileInput.value.trim() || mobileInput.value.length < 10) {
        mobileInput.classList.add('has-error');
        isValid = false;
      }
      
      // Validate Email (must contain @ and valid domain format)
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value)) {
        emailInput.classList.add('has-error');
        isValid = false;
      }
      
      if (isValid) {
        // Open PDF in new tab
        window.open('assets/The_Property_Guardian_Brochure.pdf', '_blank');
        brochureForm.reset();
      }
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
});
