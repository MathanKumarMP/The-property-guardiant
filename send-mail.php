<?php
/**
 * ==============================================================================
 * The Property Guardian - Direct SMTP Form Handler & JSON Logger
 * ==============================================================================
 * Features:
 *  - Accepts JSON payload & standard FormData (application/x-www-form-urlencoded / multipart)
 *  - Validates required fields, email format, and phone number
 *  - Thread-safe storage to submissions.json using atomic file locking (flock)
 *  - Native Gmail SMTP Socket client (ssl://smtp.gmail.com:465) without PHPMailer / Composer
 *  - Responsive, high-conversion HTML email template with IST timestamp
 *  - Clean JSON response format: { status: "success"|"error", message: "..." }
 * ==============================================================================
 */

// -----------------------------------------------------------------------------
// 1. GLOBAL SETTINGS & CREDENTIALS CONFIGURATION
// -----------------------------------------------------------------------------
date_default_timezone_set('Asia/Kolkata'); // Indian Standard Time (IST)

define('PROJECT_NAME', 'The Property Guardian');

// Gmail SMTP Credentials (Replace with your actual Gmail ID & 16-character App Password)
// How to generate an App Password: 
// Go to Google Account -> Security -> 2-Step Verification -> App Passwords
define('SMTP_HOST', 'ssl://smtp.gmail.com');
define('SMTP_PORT', 465);
define('SMTP_USER', 'crm@landsandlands.com');          // Your Gmail address
define('SMTP_PASS', 'krzy fcdq hthq pdxy');          // Your 16-digit Google App Password
define('SMTP_FROM_NAME', 'The Property Guardian');   // Sender Name
define('NOTIFICATION_EMAIL', 'crm@landsandlands.com');// Where lead alerts are delivered

// Local Storage Path
define('DATA_FILE', __DIR__ . '/submissions.json');

// -----------------------------------------------------------------------------
// 2. HTTP HEADERS & CORS
// -----------------------------------------------------------------------------
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Reject non-POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Method Not Allowed. Only POST requests are accepted.'
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// 3. PARSE & SANITIZE REQUEST DATA
// -----------------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
if (empty($rawInput) && php_sapi_name() === 'cli') {
    $rawInput = file_get_contents('php://stdin');
}
$parsedData = [];

// Determine whether payload is raw JSON or FormData
$contentType = isset($_SERVER['CONTENT_TYPE']) ? trim($_SERVER['CONTENT_TYPE']) : '';
if (stripos($contentType, 'application/json') !== false || (!empty($rawInput) && $rawInput[0] === '{')) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $parsedData = $decoded;
    }
}

// Fallback / merge with standard $_POST
if (empty($parsedData) && !empty($_POST)) {
    $parsedData = $_POST;
}

// Honeypot anti-spam check (if bot filled hidden field)
if (!empty($parsedData['website']) || !empty($parsedData['bot_check'])) {
    // Pretend success to fool bots
    echo json_encode(['status' => 'success', 'message' => 'Enquiry submitted successfully.']);
    exit;
}

// Helper to sanitize text
function clean_input($val) {
    if ($val === null) return '';
    return htmlspecialchars(trim((string)$val), ENT_QUOTES, 'UTF-8');
}

// Field Extraction (supports common naming conventions)
$fullName       = clean_input($parsedData['name'] ?? $parsedData['full_name'] ?? '');
$phone          = clean_input($parsedData['phone'] ?? $parsedData['mobile'] ?? '');
$email          = clean_input($parsedData['email'] ?? '');
$location       = clean_input($parsedData['location'] ?? $parsedData['property_location'] ?? 'Not Specified');
$propertyType   = clean_input($parsedData['property_type'] ?? $parsedData['service'] ?? 'Not Specified');
$ownerStatus    = clean_input($parsedData['owner'] ?? $parsedData['is_owner'] ?? 'Not Specified');
$preferredMode  = clean_input($parsedData['preferred_contact'] ?? $parsedData['contact_mode'] ?? 'Phone / Call');
$requirement    = clean_input($parsedData['requirement'] ?? $parsedData['message'] ?? $parsedData['comments'] ?? '');

// -----------------------------------------------------------------------------
// 4. VALIDATION
// -----------------------------------------------------------------------------
$errors = [];

if (empty($fullName) || mb_strlen($fullName) < 2) {
    $errors['name'] = 'Full Name is required (minimum 2 characters).';
}

// Clean phone digits
$cleanPhone = preg_replace('/[^0-9]/', '', $phone);
if (empty($cleanPhone) || strlen($cleanPhone) < 10) {
    $errors['phone'] = 'A valid 10-digit mobile number is required.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'A valid email address is required.';
}

if (empty($requirement) && empty($propertyType)) {
    $errors['requirement'] = 'Please enter your requirement or property type.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Please fill in all required fields correctly.',
        'errors'  => $errors
    ]);
    exit;
}

// -----------------------------------------------------------------------------
// 5. PREPARE SUBMISSION RECORD (WITH IST TIMESTAMP)
// -----------------------------------------------------------------------------
$submissionId = 'SUB-' . date('Ymd-His') . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
$istTimestamp = date('Y-m-d H:i:s T'); // e.g. 2026-09-30 17:55:00 IST
$ipAddress    = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'Unknown';

$submissionRecord = [
    'date'              => date('d-M-Y'),
    'time'              => date('h:i:s A'),
    'name'              => $fullName,
    'phone'             => $phone,
    'email'             => $email,
    'location'          => $location,
    'property_type'     => $propertyType,
    'owner_status'      => $ownerStatus,
    'preferred_contact' => $preferredMode,
    'requirement'       => $requirement
];

// -----------------------------------------------------------------------------
// 6. SAVE TO SUBMISSIONS.JSON (WITH ATOMIC FILE LOCKING)
// -----------------------------------------------------------------------------
try {
    saveRecordToJson(DATA_FILE, $submissionRecord);
} catch (Exception $e) {
    error_log("Failed to save submission to JSON: " . $e->getMessage());
    // Continue execution to still attempt sending email
}

function saveRecordToJson($filePath, $record) {
    // Open file in c+ mode (creates file if not exists, allows read & write, pointer at beginning)
    $fp = fopen($filePath, 'c+');
    if (!$fp) {
        throw new Exception("Unable to open data storage file: " . $filePath);
    }

    // Acquire an exclusive lock (wait if another process is writing)
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        throw new Exception("Could not acquire exclusive file lock.");
    }

    $existingData = [];
    clearstatcache(true, $filePath);
    $fileSize = filesize($filePath);

    if ($fileSize > 0) {
        $content = fread($fp, $fileSize);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $existingData = $decoded;
        }
    }

    // Append new submission
    $existingData[] = $record;

    // Truncate file, rewind and write updated array
    ftruncate($fp, 0);
    rewind($fp);
    $jsonOutput = json_encode($existingData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    fwrite($fp, $jsonOutput);
    fflush($fp);

    // Release lock & close handle
    flock($fp, LOCK_UN);
    fclose($fp);

    return true;
}

// -----------------------------------------------------------------------------
// 7. BUILD LUXURY HTML EMAIL NOTIFICATION TEMPLATE
// -----------------------------------------------------------------------------
$emailSubject = "New Property Enquiry: " . $fullName . " (" . $location . ")";

$htmlMessage = '
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New Property Enquiry</title>
</head>
<body style="margin: 0; padding: 30px 10px; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 20px 45px rgba(0,0,0,0.35);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 30px; text-align: center; border-bottom: 3px solid #2563eb;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 8px;">
                ' . htmlspecialchars(PROJECT_NAME) . ' &bull; Lead Alert
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">
                New Client Requirement Received
              </h1>
              <p style="margin: 8px 0 0 0; font-size: 13px; color: #94a3b8;">
                Submitted on ' . htmlspecialchars($istTimestamp) . '
              </p>
            </td>
          </tr>

          <!-- Quick Action Bar -->
          <tr>
            <td style="padding: 16px 30px; background-color: #f1f5f9; border-bottom: 1px solid #e2e8f0; text-align: center;">
              <a href="tel:' . urlencode($cleanPhone) . '" style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-right: 8px;">
                &#9742; Call Client (' . htmlspecialchars($phone) . ')
              </a>
              <a href="mailto:' . htmlspecialchars($email) . '" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 9px 18px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                &#9993; Reply via Email
              </a>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 30px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <tr>
                  <td colspan="2" style="padding-bottom: 12px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; border-bottom: 2px solid #e2e8f0;">
                    Lead Details
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; width: 35%; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Lead ID
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9; font-family: monospace;">
                    ' . htmlspecialchars($submissionId) . '
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Client Name
                  </td>
                  <td style="padding: 12px 6px; font-size: 14px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                    ' . htmlspecialchars($fullName) . '
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Phone Number
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #2563eb; border-bottom: 1px solid #f1f5f9;">
                    <a href="tel:' . urlencode($cleanPhone) . '" style="color: #2563eb; text-decoration: none;">' . htmlspecialchars($phone) . '</a>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Email Address
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9;">
                    <a href="mailto:' . htmlspecialchars($email) . '" style="color: #2563eb; text-decoration: none;">' . htmlspecialchars($email) . '</a>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Property Location
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                    ' . htmlspecialchars($location) . '
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Property Type
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                    <span style="display: inline-block; background-color: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: 600; font-size: 12px;">' . htmlspecialchars($propertyType) . '</span>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Owner Status
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9;">
                    ' . htmlspecialchars($ownerStatus) . '
                  </td>
                </tr>

                <tr>
                  <td style="padding: 12px 6px; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 1px solid #f1f5f9;">
                    Preferred Contact
                  </td>
                  <td style="padding: 12px 6px; font-size: 13px; color: #334155; border-bottom: 1px solid #f1f5f9;">
                    ' . htmlspecialchars($preferredMode) . '
                  </td>
                </tr>

                <tr>
                  <td colspan="2" style="padding-top: 16px; padding-bottom: 6px; font-size: 13px; font-weight: 600; color: #475569;">
                    Client Requirement / Message:
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 14px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #2563eb; font-size: 13px; line-height: 1.6; color: #1e293b;">
                    ' . nl2br(htmlspecialchars($requirement ?: 'No additional notes provided.')) . '
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
              This notification was generated automatically by <strong>' . htmlspecialchars(PROJECT_NAME) . '</strong> system.<br/>
              Time: ' . htmlspecialchars($istTimestamp) . '
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
';

// -----------------------------------------------------------------------------
// 8. DIRECT GMAIL SMTP SOCKET CLIENT (NO THIRD-PARTY LIBRARIES)
// -----------------------------------------------------------------------------
$mailResult = ['success' => false, 'error' => ''];

// If credentials are placeholder values, don't attempt connection
if (SMTP_USER === 'your-email@gmail.com' || strpos(SMTP_PASS, 'xxxx') !== false) {
    // Graceful notice: submission saved to JSON, but mail credentials not yet configured
    echo json_encode([
        'status'  => 'success',
        'message' => 'Thank you! Your enquiry has been received successfully.',
        'notice'  => 'Data saved to submissions.json. Configure your Gmail App Password in send-mail.php to enable instant email alerts.',
        'id'      => $submissionId
    ]);
    exit;
}

$mailResult = sendDirectGmailSmtp(
    NOTIFICATION_EMAIL,
    $emailSubject,
    $htmlMessage,
    $email,
    $fullName
);

if ($mailResult['success']) {
    echo json_encode([
        'status'  => 'success',
        'message' => 'Thank you! Your enquiry has been received and our team has been notified.',
        'id'      => $submissionId
    ]);
} else {
    // The data is safely saved in submissions.json, report success to user but log email error
    error_log("Direct SMTP Error: " . $mailResult['error']);
    echo json_encode([
        'status'  => 'success',
        'message' => 'Thank you! Your enquiry has been recorded successfully.',
        'debug'   => 'Email alert could not be sent: ' . $mailResult['error'],
        'id'      => $submissionId
    ]);
}
exit;


/**
 * Sends an email directly via Gmail SMTP SSL socket connection (Port 465).
 * Follows RFC 5321 with multi-line response handling and UTF-8 Base64 encoding.
 */
function sendDirectGmailSmtp($toEmail, $subject, $htmlBody, $replyToEmail = '', $replyToName = '') {
    $timeout = 15; // 15 seconds connection timeout
    
    // SSL Stream Context Options
    $context = stream_context_create([
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client(
        SMTP_HOST . ':' . SMTP_PORT,
        $errno,
        $errstr,
        $timeout,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        return ['success' => false, 'error' => "Socket connection failed: $errstr ($errno)"];
    }

    stream_set_timeout($socket, $timeout);

    // Read initial 220 banner
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '220')) {
        fclose($socket);
        return ['success' => false, 'error' => "Unexpected banner: $res"];
    }

    // EHLO
    sendSmtpCommand($socket, "EHLO " . ($_SERVER['SERVER_NAME'] ?? 'localhost'));
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "EHLO failed: $res"];
    }

    // AUTH LOGIN
    sendSmtpCommand($socket, "AUTH LOGIN");
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '334')) {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN rejected: $res"];
    }

    // Username (Base64)
    sendSmtpCommand($socket, base64_encode(SMTP_USER));
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '334')) {
        fclose($socket);
        return ['success' => false, 'error' => "Username rejected: $res"];
    }

    // Password (Base64) - stripped of spaces
    $cleanPass = str_replace(' ', '', SMTP_PASS);
    sendSmtpCommand($socket, base64_encode($cleanPass));
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '235')) {
        fclose($socket);
        return ['success' => false, 'error' => "Authentication failed. Check your Gmail App Password: $res"];
    }

    // MAIL FROM
    sendSmtpCommand($socket, "MAIL FROM:<" . SMTP_USER . ">");
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "MAIL FROM rejected: $res"];
    }

    // RCPT TO
    sendSmtpCommand($socket, "RCPT TO:<$toEmail>");
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "RCPT TO rejected: $res"];
    }

    // DATA
    sendSmtpCommand($socket, "DATA");
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '354')) {
        fclose($socket);
        return ['success' => false, 'error' => "DATA rejected: $res"];
    }

    // Prepare MIME Headers
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedFromName = "=?UTF-8?B?" . base64_encode(SMTP_FROM_NAME) . "?=";
    
    $headers = [];
    $headers[] = "From: $encodedFromName <" . SMTP_USER . ">";
    $headers[] = "To: <$toEmail>";
    if (!empty($replyToEmail)) {
        $replyName = !empty($replyToName) ? "=?UTF-8?B?" . base64_encode($replyToName) . "?=" : '';
        $headers[] = "Reply-To: $replyName <$replyToEmail>";
    }
    $headers[] = "Subject: $encodedSubject";
    $headers[] = "Date: " . date('r');
    $headers[] = "Message-ID: <" . md5(uniqid(microtime(), true)) . "@" . ($_SERVER['SERVER_NAME'] ?? 'localhost') . ">";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";
    $headers[] = "Content-Transfer-Encoding: base64";
    $headers[] = "X-Mailer: PHP-Socket-SMTP/1.0";

    // Split base64 body into 76-character chunks (RFC compliant)
    $encodedBody = chunk_split(base64_encode($htmlBody));

    // Combine headers and body
    $emailData = implode("\r\n", $headers) . "\r\n\r\n" . $encodedBody . "\r\n.\r\n";

    // Send complete message
    fwrite($socket, $emailData);
    $res = readSmtpResponse($socket);
    if (!checkSmtpCode($res, '250')) {
        fclose($socket);
        return ['success' => false, 'error' => "Failed to deliver message: $res"];
    }

    // QUIT
    sendSmtpCommand($socket, "QUIT");
    readSmtpResponse($socket);
    fclose($socket);

    return ['success' => true, 'error' => ''];
}

function sendSmtpCommand($socket, $command) {
    fwrite($socket, $command . "\r\n");
}

function readSmtpResponse($socket) {
    $response = '';
    while (!feof($socket)) {
        $line = fgets($socket, 512);
        if ($line === false) break;
        $response .= $line;
        // RFC 5321: multiline responses have a hyphen at pos 3 (e.g. '250-'), last line has space '250 '
        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }
    return $response;
}

function checkSmtpCode($response, $expectedCode) {
    return (substr(trim($response), 0, strlen($expectedCode)) === $expectedCode);
}
