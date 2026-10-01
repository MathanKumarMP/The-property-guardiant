<?php
/**
 * ==============================================================================
 * The Property Guardian - Secure Direct Excel/CSV Exporter
 * ==============================================================================
 * Flow:
 *  - Official Brand Logo: assets/logo-color.png
 *  - Enter Email Address & Password
 *  - Click "Download Excel (.csv)"
 *  - If credentials are CORRECT -> Immediately downloads the .csv file
 *  - If credentials are WRONG   -> Shows clear error alert
 * ==============================================================================
 */

date_default_timezone_set('Asia/Kolkata');

// -----------------------------------------------------------------------------
// 1. SET YOUR ADMIN CREDENTIALS HERE
// -----------------------------------------------------------------------------
define('PROJECT_NAME', 'The Property Guardian');
define('ADMIN_EMAIL', 'crm@landsandlands.com'); // Admin Email
define('ADMIN_PASSWORD', 'Landsandlands@1234');             // Admin Password
define('DATA_FILE', __DIR__ . '/submissions.json');

$errorMessage = '';

// -----------------------------------------------------------------------------
// 2. FORM SUBMISSION & DIRECT DOWNLOAD HANDLER
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputEmail    = trim($_POST['email'] ?? '');
    $inputPassword = trim($_POST['password'] ?? '');

    // Validate credentials
    if ($inputEmail === ADMIN_EMAIL && $inputPassword === ADMIN_PASSWORD) {
        // Read submissions data
        $submissions = [];
        if (file_exists(DATA_FILE)) {
            $content = file_get_contents(DATA_FILE);
            $decoded = json_decode($content, true);
            if (is_array($decoded)) {
                $submissions = $decoded;
            }
        }

        // Generate Filename
        $safeProjectName = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '', PROJECT_NAME));
        $dateStamp = date('Y-m-d');
        $filename = "{$safeProjectName}_Submissions_{$dateStamp}.csv";

        // Send HTTP Download Headers
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

        $output = fopen('php://output', 'w');

        // Output UTF-8 BOM for Microsoft Excel & Tamil text compatibility
        fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

        // CSV Column Headers
        $headers = [
            'S.No',
            'Date & Time (IST)',
            'Full Name',
            'Phone Number',
            'Email Address',
            'Property Location',
            'Property Type',
            'Owner Status',
            'Preferred Contact Mode',
            'Requirement / Message'
        ];
        fputcsv($output, $headers);

        // Output Data Rows (Newest first)
        $sno = 1;
        $reversed = array_reverse($submissions);
        foreach ($reversed as $row) {
            $csvRow = [
                $sno++,
                trim(($row['date'] ?? '') . ' ' . ($row['time'] ?? '')) ?: ($row['timestamp'] ?? 'N/A'),
                $row['name'] ?? 'N/A',
                $row['phone'] ?? 'N/A',
                $row['email'] ?? 'N/A',
                $row['location'] ?? 'N/A',
                $row['property_type'] ?? 'N/A',
                $row['owner_status'] ?? 'N/A',
                $row['preferred_contact'] ?? 'N/A',
                str_replace(["\r", "\n"], ' ', $row['requirement'] ?? '')
            ];
            fputcsv($output, $csvRow);
        }

        fclose($output);
        exit;
    } else {
        $errorMessage = 'Invalid Email Address or Password. Access denied.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><?php echo htmlspecialchars(PROJECT_NAME); ?> &mdash; Download Leads</title>
  <link rel="icon" type="image/png" href="assets/logo-color.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #080d1a;
      --bg-card: #0f172a;
      --border-color: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-emerald: #10b981;
      --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
      -webkit-font-smoothing: antialiased;
      position: relative;
    }

    /* Ambient Glow */
    .bg-glow {
      position: fixed;
      top: -100px;
      left: 50%;
      transform: translateX(-50%);
      width: 700px;
      height: 400px;
      background: radial-gradient(circle, rgba(201, 158, 71, 0.15) 0%, rgba(16, 185, 129, 0.1) 40%, rgba(8, 13, 26, 0) 70%);
      pointer-events: none;
      z-index: 0;
    }

    /* Centered Download Card */
    .export-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 44px 38px;
      width: 100%;
      max-width: 460px;
      text-align: center;
      box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.6);
      position: relative;
      z-index: 1;
      overflow: hidden;
    }

    .export-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #c99e47, #10b981, #38bdf8);
    }

    /* White Logo Container */
    .logo-box {
      background: #ffffff;
      padding: 14px 22px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 22px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    .logo-box img {
      height: 52px;
      width: auto;
      object-fit: contain;
      display: block;
    }

    .card-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.3px;
      margin-bottom: 6px;
    }

    .card-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 26px;
    }

    /* Error Alert */
    .alert-error {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.35);
      color: #fca5a5;
      padding: 12px 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 22px;
      text-align: left;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Input Fields */
    .form-group {
      text-align: left;
      margin-bottom: 18px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 8px;
    }

    .form-control {
      width: 100%;
      padding: 13px 15px;
      background: #1e293b;
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: #ffffff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
      background: #1e293b;
    }

    /* Custom Field Validation Error Styles */
    .field-error {
      display: none;
      font-size: 12px;
      color: #f87171;
      margin-top: 6px;
      font-weight: 500;
      text-align: left;
    }

    .form-group.has-error .field-error {
      display: block;
      animation: fadeInError 0.2s ease;
    }

    .form-group.has-error .form-control {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
      background: rgba(239, 68, 68, 0.08) !important;
    }

    @keyframes fadeInError {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Download Excel Button */
    .btn-download {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px 20px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      font-size: 15px;
      font-weight: 700;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
      transition: all 0.2s ease;
      margin-top: 10px;
    }

    .btn-download:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      transform: translateY(-2px);
      box-shadow: 0 12px 28px rgba(16, 185, 129, 0.45);
    }

    .btn-download:active {
      transform: translateY(0);
    }

    .btn-download svg {
      width: 20px;
      height: 20px;
      stroke-width: 2.2;
    }

    .info-note {
      margin-top: 20px;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }

    footer {
      margin-top: 24px;
      font-size: 12px;
      color: #475569;
      text-align: center;
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>

  <div class="export-card">
    <!-- Official Logo -->
    <div class="logo-box">
      <img src="assets/logo-color.png" alt="The Property Guardian">
    </div>

    <h1 class="card-title"><?php echo htmlspecialchars(PROJECT_NAME); ?></h1>
    <p class="card-subtitle">Enter credentials to download form submissions</p>

    <!-- Error Message -->
    <?php if (!empty($errorMessage)): ?>
      <div class="alert-error" id="error-alert">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span><?php echo htmlspecialchars($errorMessage); ?></span>
      </div>
    <?php endif; ?>

    <!-- Direct Download Form -->
    <form method="POST" action="admin-export.php" id="export-form" novalidate>
      <div class="form-group" id="fg-email">
        <label for="email">Email Address</label>
        <input 
          type="email" 
          id="email" 
          name="email" 
          class="form-control" 
          placeholder="Enter Your Email"
          value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>"
          autocomplete="username"
        >
        <div class="field-error" id="email-error">Please enter a valid email address.</div>
      </div>

      <div class="form-group" id="fg-password">
        <label for="password">Password</label>
        <div style="position: relative; display: flex; align-items: center;">
          <input 
            type="password" 
            id="password" 
            name="password" 
            class="form-control" 
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
            autocomplete="current-password"
            style="padding-right: 44px;"
          >
          <button 
            type="button" 
            id="togglePassword" 
            aria-label="Toggle password visibility" 
            style="position: absolute; right: 12px; background: transparent; border: none; color: #94a3b8; cursor: pointer; display: flex; align-items: center; padding: 4px;"
          >
            <svg id="eyeIcon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
        <div class="field-error" id="password-error">Please enter your password.</div>
      </div>

      <button type="submit" class="btn-download" id="submitBtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download Excel (.csv)
      </button>
    </form>

    
  </div>

  <footer>
    &copy; <?php echo date('Y'); ?> <?php echo htmlspecialchars(PROJECT_NAME); ?>
  </footer>

  <script>
    const errorAlert = document.getElementById('error-alert');
    const form = document.getElementById('export-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const fgEmail = document.getElementById('fg-email');
    const fgPassword = document.getElementById('fg-password');
    const emailError = document.getElementById('email-error');
    const passwordError = document.getElementById('password-error');

    function isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if (emailInput) {
      emailInput.addEventListener('input', () => {
        if (fgEmail) fgEmail.classList.remove('has-error');
        if (errorAlert) errorAlert.style.display = 'none';
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('input', () => {
        if (fgPassword) fgPassword.classList.remove('has-error');
        if (errorAlert) errorAlert.style.display = 'none';
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        let hasClientError = false;
        const emailVal = emailInput ? emailInput.value.trim() : '';
        const passwordVal = passwordInput ? passwordInput.value : '';

        if (fgEmail) fgEmail.classList.remove('has-error');
        if (fgPassword) fgPassword.classList.remove('has-error');

        // Check Email
        if (!emailVal) {
          if (emailError) emailError.textContent = 'Please enter your email address.';
          if (fgEmail) fgEmail.classList.add('has-error');
          hasClientError = true;
        } else if (!isValidEmail(emailVal)) {
          if (emailError) emailError.textContent = 'Please enter a valid email address (e.g. name@domain.com).';
          if (fgEmail) fgEmail.classList.add('has-error');
          hasClientError = true;
        }

        // Check Password
        if (!passwordVal) {
          if (passwordError) passwordError.textContent = 'Please enter your password.';
          if (fgPassword) fgPassword.classList.add('has-error');
          hasClientError = true;
        }

        if (hasClientError) {
          e.preventDefault();
          if (errorAlert) errorAlert.style.display = 'none';
          if (fgEmail && fgEmail.classList.contains('has-error')) {
            emailInput.focus();
          } else if (fgPassword && fgPassword.classList.contains('has-error')) {
            passwordInput.focus();
          }
        }
      });
    }

    // Toggle password visibility
    const toggleBtn = document.getElementById('togglePassword');
    const eyeIcon = document.getElementById('eyeIcon');

    if (toggleBtn && passwordInput && eyeIcon) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        eyeIcon.innerHTML = isPassword 
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      });
    }
  </script>
</body>
</html>
