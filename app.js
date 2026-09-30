/**
 * ==============================================================================
 * The Property Guardian - Frontend Form Submission Handler
 * ==============================================================================
 * Demonstrates async fetch() submission to send-mail.php with:
 *  - Dynamic button loading / spinner states
 *  - Clean JSON payload submission
 *  - Error handling & field-level validation feedback
 *  - Success state notification & modal/redirect handling
 * ==============================================================================
 */

/**
 * Submits an enquiry form to send-mail.php asynchronously.
 * 
 * @param {HTMLFormElement} formElement - The DOM form element being submitted
 * @param {Object} options - Custom configuration options
 */
async function submitEnquiryForm(formElement, options = {}) {
  const submitButton = formElement.querySelector('button[type="submit"]');
  const originalButtonHtml = submitButton ? submitButton.innerHTML : '';
  const endpoint = options.endpoint || 'send-mail.php';

  // 1. Set Loading UI State
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 0.8s linear infinite; vertical-align: middle; margin-right: 8px;">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
      </svg>
      Submitting...
    `;
  }

  // 2. Prepare Form Data Object
  const formData = new FormData(formElement);
  const payload = {};
  formData.forEach((value, key) => {
    payload[key] = value.trim();
  });

  try {
    // 3. Make Asynchronous POST Request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // 4. Handle Server Response
    if (response.ok && result.status === 'success') {
      // Trigger Success Callback or Default Alert
      if (typeof options.onSuccess === 'function') {
        options.onSuccess(result);
      } else {
        alert(result.message || 'Thank you! Your requirement has been submitted successfully.');
        formElement.reset();
      }
    } else {
      // Server returned validation or runtime error
      const errorMsg = result.message || 'There was an issue processing your request. Please try again.';
      if (typeof options.onError === 'function') {
        options.onError(result);
      } else {
        alert('Error: ' + errorMsg);
      }
    }
  } catch (networkError) {
    console.error('Submission Network Error:', networkError);
    if (typeof options.onError === 'function') {
      options.onError({ message: 'Network connection failed. Please check your connection and try again.' });
    } else {
      alert('Network error: Unable to reach server. Please try again later.');
    }
  } finally {
    // 5. Restore Button State
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHtml;
    }
  }
}

// -----------------------------------------------------------------------------
// USAGE EXAMPLE & INITIALIZATION
// -----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  const enquiryForm = document.getElementById('contact-form') || document.getElementById('popup-form');

  if (enquiryForm) {
    enquiryForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Collect data directly or let submitEnquiryForm extract FormData
      submitEnquiryForm(enquiryForm, {
        endpoint: 'send-mail.php',
        onSuccess: function (res) {
          // e.g. Open thank you page or show success modal
          console.log('Submission ID:', res.id);
          window.location.href = 'thank-you.html';
        },
        onError: function (err) {
          alert(err.message || 'Submission failed. Please check the inputs.');
        }
      });
    });
  }
});
