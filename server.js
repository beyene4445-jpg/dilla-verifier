import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// SERVICE ACCOUNT LOADER (Base64 or JSON, BOM-safe)
// ============================================================
function getServiceAccountCredentials() {
  // Try Base64 first (most reliable)
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64;

  if (b64 && b64.trim().length > 100) {
    try {
      let decoded = Buffer.from(b64.trim(), 'base64').toString('utf-8');

      // Strip BOM if present
      if (decoded.charCodeAt(0) === 0xFEFF) {
        decoded = decoded.substring(1);
        console.log('🔧 Stripped BOM from decoded JSON');
      }

      const parsed = JSON.parse(decoded);

      if (parsed.private_key) {
        // Handle escaped \n (convert literal \n to real newlines)
        if (parsed.private_key.includes('\\n')) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
          console.log('🔧 Converted escaped \\n in private_key');
        }
        console.log('✅ Service account loaded from Base64');
        return parsed;
      }
    } catch (e) {
      console.error('❌ Base64 decode/parse failed:', e.message);
    }
  }

  // Fallback: plain JSON
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;

  if (raw && raw.trim().length > 100) {
    try {
      let toParse = raw.trim();

      // Strip BOM
      if (toParse.charCodeAt(0) === 0xFEFF) {
        toParse = toParse.substring(1);
      }

      // If it looks like base64, decode first
      if (!toParse.startsWith('{')) {
        try {
          toParse = Buffer.from(toParse, 'base64').toString('utf-8');
          if (toParse.charCodeAt(0) === 0xFEFF) {
            toParse = toParse.substring(1);
          }
        } catch {}
      }

      const parsed = JSON.parse(toParse);

      if (parsed.private_key) {
        if (parsed.private_key.includes('\\n')) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        console.log('✅ Service account loaded from JSON');
        return parsed;
      }
    } catch (e) {
      console.error('❌ JSON parse failed:', e.message);
    }
  }

  console.error('❌ No valid service account credentials found');
  return {};
}

// Load credentials
const credentials = getServiceAccountCredentials();

console.log('============================================================');
console.log('📧 Service account email:', credentials.client_email || 'NOT FOUND');
console.log('🏗️  Project ID:', credentials.project_id || 'NOT FOUND');
console.log('🔑 Private key present:', !!credentials.private_key);
console.log('============================================================');

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

const SHEET_ID = process.env.SHEET_ID;
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;
const SHEET_WEBAPP_URL = process.env.SHEET_WEBAPP_URL;

console.log('📊 SHEET_ID set:', !!SHEET_ID);
console.log('📁 DRIVE_FOLDER_ID set:', !!DRIVE_FOLDER_ID);
console.log('🔗 SHEET_WEBAPP_URL set:', !!SHEET_WEBAPP_URL);
console.log('============================================================');

// ============================================================
// Fayda QR Parser (FAN-only)
// ============================================================
function parseFaydaQR(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // JSON
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      return {
        fan: data.fan || data.FAN || data.faydaId || data.id || null,
        name: data.name || data.fullName || data.full_name || null,
        birthdate: data.dob || data.birthdate || data.dateOfBirth || null,
        gender: data.gender || data.sex || null,
      };
    }
  } catch {}

  // Base64
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    try {
      const data = JSON.parse(decoded);
      return {
        fan: data.fan || data.FAN || null,
        name: data.name || data.fullName || null,
        birthdate: data.dob || data.birthdate || null,
        gender: data.gender || null,
      };
    } catch {}
  } catch {}

  // URL
  try {
    if (raw.startsWith('http')) {
      const url = new URL(raw);
      const fan = url.searchParams.get('fan') || url.searchParams.get('FAN');
      if (fan) return { fan, name: null, birthdate: null, gender: null };
    }
  } catch {}

  // Separated
  const separators = ['|', ',', ';', '\t'];
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep).map(s => s.trim()).filter(s => s);
      if (parts.length >= 1) {
        return {
          fan: parts[0],
          name: parts[1] || null,
          birthdate: parts[2] || null,
          gender: parts[3] || null,
        };
      }
    }
  }

  // Plain FAN
  return { fan: raw.trim(), name: null, birthdate: null, gender: null };
}

// ============================================================
// Helpers
// ============================================================
function getMealType() {
  const now = new Date();
  const total = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (total >= 4 * 60 + 30 && total < 6 * 60) return 'breakfast';
  if (total >= 9 * 60 && total < 10 * 60 + 30) return 'lunch';
  if (total >= 14 * 60 && total < 17 * 60) return 'dinner';
  return 'off-hours';
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function euclideanDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.pow(a[i] - b[i], 2);
  return Math.sqrt(sum);
}

function isValidFan(fan) {
  return /^\d{16}$/.test(String(fan || '').trim());
}

// ============================================================
// Registry helpers
// ============================================================
async function getAllRegistry() {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Registry!A:S',
    });
    return res.data.values || [];
  } catch (e) {
    console.warn('Registry fetch failed:', e.message);
    return [];
  }
}

async function findByFan(fan) {
  const rows = await getAllRegistry();
  if (rows.length < 2) return null;

  const cleanFan = String(fan || '').trim();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (String(row[0] || '').trim() === cleanFan) {
      return {
        rowIndex: i + 1,
        fan: row[0] || '',
        name: row[2] || '',
        universityId: row[3] || '',
        department: row[4] || '',
        year: row[5] || '',
        phone: row[6] || '',
        region: row[7] || '',
        gender: row[8] || '',
        birthdate: row[9] || '',
        college: row[10] || '',
        departmentFull: row[11] || '',
        userType: row[12] || '',
        faceDescriptor: row[13] ? JSON.parse(row[13]) : null,
        fingerprintId: row[14] || '',
        nationalIdUrl: row[15] || '',
        status: (row[16] || 'pending').toLowerCase(),
      };
    }
  }
  return null;
}

async function findByFace(descriptor, threshold = 0.55) {
  const rows = await getAllRegistry();
  if (rows.length < 2) return { match: null, best: Infinity };

  let bestMatch = null;
  let bestDistance = Infinity;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[13]) continue;

    try {
      const stored = JSON.parse(row[13]);
      const distance = euclideanDistance(descriptor, stored);

      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          rowIndex: i + 1,
          fan: row[0] || '',
          name: row[2] || '',
          department: row[4] || '',
          year: row[5] || '',
          userType: row[12] || '',
          status: (row[16] || 'pending').toLowerCase(),
          distance,
        };
      }
    } catch {}
  }

  if (bestDistance < threshold) return { match: bestMatch, best: bestDistance };
  return { match: null, best: bestDistance };
}

async function verifyAgainstDU(fan) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'DU_Reference!A:D',
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return null;

    const cleanFan = String(fan || '').trim();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0] || '').trim() === cleanFan) {
        return {
          fan: rows[i][0] || '',
          name: rows[i][2] || '',
          status: rows[i][3] || '',
        };
      }
    }
    return null;
  } catch (e) {
    console.warn('DU_Reference error:', e.message);
    return null;
  }
}

// ============================================================
// Meal & Gate logging
// ============================================================
async function checkMealUsed(fan, mealType) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'MealLog!A:E',
    });
    const rows = res.data.values || [];
    const today = todayStr();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === fan && rows[i][1] === today && rows[i][2] === mealType) {
        return rows[i][3];
      }
    }
  } catch {}
  return null;
}

async function logMeal(fan, name, mealType, location) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'MealLog!A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[fan, todayStr(), mealType, new Date().toISOString(), location || 'cafeteria']],
      },
    });
  } catch (e) { console.error('logMeal:', e.message); }
}

async function logGate(fan, name, result, gate) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'GateLog!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[fan || '', name || '', todayStr(), new Date().toISOString(), result, gate || 'main']],
      },
    });
  } catch (e) { console.error('logGate:', e.message); }
}

// ============================================================
// Drive Upload
// ============================================================
async function uploadToDrive(base64Data, filename, mimeType = 'image/jpeg') {
  try {
    const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const { Readable } = await import('stream');
    const stream = Readable.from(buffer);

    const file = await drive.files.create({
      requestBody: {
        name: filename,
        parents: DRIVE_FOLDER_ID ? [DRIVE_FOLDER_ID] : [],
      },
      media: { mimeType, body: stream },
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    return file.data.webViewLink;
  } catch (e) {
    console.error('Drive upload error:', e.message);
    throw e;
  }
}

// ============================================================
// DEBUG endpoint (remove later if you want)
// ============================================================
app.get('/api/debug', (req, res) => {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_B64 || '';
  const json = process.env.GOOGLE_SERVICE_ACCOUNT || '';

  res.json({
    env_check: {
      GOOGLE_SERVICE_ACCOUNT_B64_exists: !!b64,
      GOOGLE_SERVICE_ACCOUNT_B64_length: b64.length,
      GOOGLE_SERVICE_ACCOUNT_B64_first30: b64.substring(0, 30),
      GOOGLE_SERVICE_ACCOUNT_exists: !!json,
      GOOGLE_SERVICE_ACCOUNT_length: json.length,
    },
    credentials: {
      client_email: credentials.client_email || null,
      project_id: credentials.project_id || null,
      has_private_key: !!credentials.private_key,
      private_key_length: credentials.private_key ? credentials.private_key.length : 0,
    },
    other_env: {
      SHEET_ID_exists: !!SHEET_ID,
      SHEET_ID_length: (SHEET_ID || '').length,
      DRIVE_FOLDER_ID_exists: !!DRIVE_FOLDER_ID,
      SHEET_WEBAPP_URL_exists: !!SHEET_WEBAPP_URL,
      ADMIN_KEY_exists: !!process.env.ADMIN_KEY,
    },
  });
});

// ============================================================
// API: Parse Fayda (FAN only, 16 digits)
// ============================================================
app.post('/api/parse-fayda', async (req, res) => {
  const { raw } = req.body;
  if (!raw) return res.json({ ok: false, message: 'FAN is required' });

  const parsed = parseFaydaQR(raw);

  // If QR parse gave us valid 16-digit FAN
  if (parsed && parsed.fan && isValidFan(parsed.fan)) {
    return res.json({
      ok: true,
      fan: String(parsed.fan).trim(),
      name: parsed.name || '',
      birthdate: parsed.birthdate || '',
      gender: parsed.gender || '',
    });
  }

  const trimmed = String(raw).trim().replace(/\s+/g, '');

  if (!isValidFan(trimmed)) {
    return res.json({ ok: false, message: 'FAN must be exactly 16 digits' });
  }

  // Look up in DU_Reference
  const duRecord = await verifyAgainstDU(trimmed);

  if (duRecord) {
    return res.json({
      ok: true,
      fan: trimmed,
      name: duRecord.name || '',
      birthdate: '',
      gender: '',
    });
  }

  return res.json({
    ok: true,
    fan: trimmed,
    name: '',
    birthdate: '',
    gender: '',
  });
});

// ============================================================
// API: Register (FAN only, 16 digits)
// ============================================================
app.post('/api/register', async (req, res) => {
  try {
    const {
      type, fan, name, universityId, phone, region, gender, birthdate,
      college, department, year, nationalIdImage,
    } = req.body;

    console.log('📝 Register request:', { type, fan, name, phone, region });

    // Validation
    if (!name || !phone || !region) {
      return res.json({ ok: false, message: 'Name, phone and region are required' });
    }

    if (!fan) {
      return res.json({ ok: false, message: 'FAN is required' });
    }

    if (!isValidFan(fan)) {
      return res.json({ ok: false, message: 'FAN must be exactly 16 digits' });
    }

    if (!type || !['staff', 'noncafe', 'cafe'].includes(type)) {
      return res.json({ ok: false, message: 'Invalid registration type' });
    }

    if (type === 'cafe' && !nationalIdImage) {
      return res.json({ ok: false, message: 'National ID photo is required for cafeteria' });
    }

    // Check if already registered
    const existing = await findByFan(fan);
    if (existing) {
      return res.json({
        ok: false,
        message: 'This FAN is already registered. Please contact admin.',
      });
    }

    // Upload National ID
    let nationalIdUrl = '';
    if (nationalIdImage) {
      const filename = `national-id-${fan}-${Date.now()}.jpg`;
      try {
        nationalIdUrl = await uploadToDrive(nationalIdImage, filename);
        console.log('✅ National ID uploaded:', nationalIdUrl);
      } catch (e) {
        console.error('Drive upload failed:', e.message);
      }
    }

    // Build row
    const row = [
      fan || '',                                  // A: FAN
      '',                                          // B: FIN (removed)
      name || '',                                  // C: Name
      universityId || '',                          // D: University ID
      department || '',                            // E: Department (short)
      year || '',                                  // F: Year
      phone || '',                                 // G: Phone
      region || '',                                // H: Region
      gender || '',                                // I: Gender
      birthdate || '',                             // J: Birthdate
      college || '',                               // K: College
      department || '',                            // L: Department (full)
      type || '',                                  // M: UserType
      '',                                          // N: FaceDescriptor
      '',                                          // O: FingerprintID
      nationalIdUrl,                               // P: NationalIDUrl
      'pending',                                   // Q: Status
      '',                                          // R: ApprovedAt
      new Date().toISOString(),                    // S: CreatedAt
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Registry!A:S',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    console.log('✅ Row added to Registry');

    // Notify admin via Apps Script webhook
    if (SHEET_WEBAPP_URL) {
      try {
        await fetch(SHEET_WEBAPP_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'new_registration',
            name, fan,
            phone, region, type,
            college: college || '',
            department: department || '',
            universityId: universityId || '',
          }),
        });
        console.log('✅ Admin notified via webhook');
      } catch (e) {
        console.warn('Webhook failed:', e.message);
      }
    }

    res.json({
      ok: true,
      message: 'Your registration is under evaluation. It will be verified soon.',
    });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ ok: false, message: 'Server error: ' + err.message });
  }
});

// ============================================================
// API: Verify (FAN only)
// ============================================================
app.post('/api/verify', async (req, res) => {
  try {
    const { raw, mode, gate, location } = req.body;
    const parsed = parseFaydaQR(raw);

    let fan = '';
    if (parsed && parsed.fan) {
      fan = String(parsed.fan).trim();
    } else {
      fan = String(raw || '').trim().replace(/\s+/g, '');
    }

    if (!isValidFan(fan)) {
      return res.json({
        allowed: false,
        reason: 'invalid_qr',
        message: 'FAN must be exactly 16 digits',
      });
    }

    const student = await findByFan(fan);
    if (!student) {
      await logGate(fan, parsed?.name, 'not_registered', gate || location);
      return res.json({
        allowed: false,
        reason: 'not_registered',
        message: 'Not registered',
      });
    }

    if (student.status !== 'active') {
      return res.json({
        allowed: false,
        reason: 'not_approved',
        message: 'Registration not approved yet',
        student,
      });
    }

    if (mode === 'cafeteria') {
      if (student.userType !== 'cafe') {
        return res.json({
          allowed: false,
          reason: 'not_cafe_user',
          message: 'No cafeteria access',
          student,
        });
      }

      const mealType = getMealType();
      const usedAt = await checkMealUsed(student.fan, mealType);
      if (usedAt) {
        return res.json({
          allowed: false,
          reason: 'already_used',
          message: 'Already used for this meal',
          student,
        });
      }

      await logMeal(student.fan, student.name, mealType, location);
      await logGate(student.fan, student.name, 'meal_ok', location);
      return res.json({
        allowed: true,
        reason: 'meal_ok',
        message: 'Enjoy your meal',
        mealType,
        student,
      });
    }

    await logGate(student.fan, student.name, 'allowed', gate);
    return res.json({
      allowed: true,
      reason: 'gate_ok',
      message: 'Verified',
      student,
    });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({
      allowed: false,
      reason: 'server_error',
      message: err.message,
    });
  }
});

// ============================================================
// API: Verify Face (cafeteria)
// ============================================================
app.post('/api/verify-face', async (req, res) => {
  try {
    const { descriptor, mode, location, gate } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.json({
        allowed: false,
        reason: 'invalid_face',
        message: 'Invalid face data',
      });
    }

    const { match } = await findByFace(descriptor, 0.55);

    if (!match) {
      return res.json({
        allowed: false,
        reason: 'not_recognized',
        message: 'Face not recognized',
      });
    }

    if (match.status !== 'active') {
      return res.json({
        allowed: false,
        reason: 'not_approved',
        message: 'Registration not approved',
        student: match,
      });
    }

    if (mode === 'cafeteria') {
      if (match.userType !== 'cafe') {
        return res.json({
          allowed: false,
          reason: 'not_cafe_user',
          message: 'No cafeteria access',
          student: match,
        });
      }

      const mealType = getMealType();
      const usedAt = await checkMealUsed(match.fan, mealType);
      if (usedAt) {
        return res.json({
          allowed: false,
          reason: 'already_used',
          message: 'Already used for this meal',
          student: match,
        });
      }

      await logMeal(match.fan, match.name, mealType, location);
      await logGate(match.fan, match.name, 'meal_ok', location);
      return res.json({
        allowed: true,
        reason: 'meal_ok',
        message: 'Enjoy your meal',
        mealType,
        student: match,
      });
    }

    await logGate(match.fan, match.name, 'allowed', gate);
    return res.json({
      allowed: true,
      reason: 'gate_ok',
      message: 'Verified',
      student: match,
    });
  } catch (err) {
    console.error('verify-face error:', err);
    res.status(500).json({
      allowed: false,
      reason: 'server_error',
      message: err.message,
    });
  }
});

// ============================================================
// API: Update Face Descriptor
// ============================================================
app.post('/api/update-face', async (req, res) => {
  try {
    const { fan, descriptor } = req.body;

    if (!fan) return res.json({ ok: false, message: 'FAN required' });
    if (!isValidFan(fan)) {
      return res.json({ ok: false, message: 'FAN must be 16 digits' });
    }
    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.json({ ok: false, message: 'Valid face descriptor required' });
    }

    const student = await findByFan(fan);
    if (!student) return res.json({ ok: false, message: 'Student not found' });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Registry!N${student.rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[JSON.stringify(descriptor)]] },
    });

    res.json({ ok: true, message: 'Face registered' });
  } catch (err) {
    console.error('update-face error:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ============================================================
// API: Stats (Admin)
// ============================================================
app.get('/api/stats', async (req, res) => {
  try {
    if (req.query.key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const safeGet = async (range) => {
      try {
        const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
        return r.data.values || [];
      } catch { return []; }
    };

    const [registry, meals, gates] = await Promise.all([
      safeGet('Registry!A:S'),
      safeGet('MealLog!A:E'),
      safeGet('GateLog!A:F'),
    ]);

    const regData = registry.slice(1);
    const mealsData = meals.slice(1);
    const gatesData = gates.slice(1);
    const today = todayStr();

    res.json({
      total: regData.length,
      pending: regData.filter(r => (r[16] || '').toLowerCase() === 'pending').length,
      active: regData.filter(r => (r[16] || '').toLowerCase() === 'active').length,
      rejected: regData.filter(r => (r[16] || '').toLowerCase() === 'rejected').length,
      staff: regData.filter(r => (r[12] || '').toLowerCase() === 'staff').length,
      noncafe: regData.filter(r => (r[12] || '').toLowerCase() === 'noncafe').length,
      cafe: regData.filter(r => (r[12] || '').toLowerCase() === 'cafe').length,
      todayMeals: mealsData.filter(r => r[1] === today).length,
      todayGates: gatesData.filter(r => r[2] === today).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Pending list (Admin)
// ============================================================
app.get('/api/admin/pending', async (req, res) => {
  try {
    if (req.query.key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const rows = await getAllRegistry();
    const pending = rows.slice(1)
      .map((row, i) => ({ rowIndex: i + 2, row }))
      .filter(({ row }) => (row[16] || '').toLowerCase() === 'pending')
      .map(({ rowIndex, row }) => ({
        rowIndex,
        fan: row[0] || '',
        name: row[2] || '',
        universityId: row[3] || '',
        phone: row[6] || '',
        region: row[7] || '',
        college: row[10] || '',
        department: row[11] || '',
        userType: row[12] || '',
        nationalIdUrl: row[15] || '',
        createdAt: row[18] || '',
      }));

    res.json({ ok: true, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Approve / Reject (Admin)
// ============================================================
app.post('/api/admin/approve', async (req, res) => {
  try {
    const { key, rowIndex, decision } = req.body;
    if (key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const status = decision === 'approve' ? 'active' : 'rejected';

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Registry!Q${rowIndex}:R${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[status, new Date().toISOString()]] },
    });

    res.json({ ok: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// API: Auto-verify pending (Admin)
// ============================================================
app.post('/api/admin/auto-verify', async (req, res) => {
  try {
    const { key } = req.body;
    if (key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let duRows = [];
    try {
      const r = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'DU_Reference!A:D',
      });
      duRows = r.data.values || [];
    } catch (e) {
      return res.json({ ok: false, message: 'DU_Reference sheet not found' });
    }

    if (duRows.length < 2) {
      return res.json({ ok: false, message: 'DU_Reference is empty' });
    }

    const registry = await getAllRegistry();
    if (registry.length < 2) {
      return res.json({ ok: true, approved: 0, rejected: 0, total: 0 });
    }

    let approved = 0;
    let rejected = 0;
    const updates = [];

    for (let i = 1; i < registry.length; i++) {
      const row = registry[i];
      const status = (row[16] || '').toLowerCase();
      if (status !== 'pending') continue;

      const fan = String(row[0] || '').trim();

      let found = false;
      for (let j = 1; j < duRows.length; j++) {
        if (String(duRows[j][0] || '').trim() === fan) {
          found = true;
          break;
        }
      }

      const rowIndex = i + 1;
      const newStatus = found ? 'active' : 'rejected';
      const approvedAt = found ? new Date().toISOString() : '';

      updates.push({
        range: `Registry!Q${rowIndex}:R${rowIndex}`,
        values: [[newStatus, approvedAt]],
      });

      if (found) approved++;
      else rejected++;
    }

    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
      });
    }

    res.json({
      ok: true,
      approved,
      rejected,
      total: approved + rejected,
      message: `Auto-verified: ${approved} approved, ${rejected} rejected`,
    });
  } catch (err) {
    console.error('auto-verify error:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ============================================================
// Clean URLs
// ============================================================
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'signin.html')));
app.get('/gateway', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gateway.html')));
app.get('/cafeteria', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cafeteria.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/capture-face', (req, res) => res.sendFile(path.join(__dirname, 'public', 'capture-face.html')));

// ============================================================
// Start
// ============================================================
app.listen(PORT, () => {
  console.log(`✅ Dilla Verifier running on http://localhost:${PORT}`);
});
