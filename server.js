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
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============ Google Sheets ============
const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = process.env.SHEET_ID;

// ============ የFayda QR Parser ============
function parseFaydaQR(raw) {
  if (!raw || typeof raw !== 'string') return null;

  // 1. JSON ሞክር
  try {
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      return {
        fan: data.fan || data.FAN || data.faydaId || data.id || null,
        fin: data.fin || data.FIN || null,
        name: data.name || data.fullName || data.full_name || null,
        birthdate: data.dob || data.birthdate || data.dateOfBirth || null,
        gender: data.gender || data.sex || null,
        raw: data,
      };
    }
  } catch {}

  // 2. Base64 ሞክር
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    return {
      fan: data.fan || data.FAN || null,
      fin: data.fin || data.FIN || null,
      name: data.name || data.fullName || null,
      birthdate: data.dob || data.birthdate || null,
      gender: data.gender || null,
      raw: data,
    };
  } catch {}

  // 3. Separators
  const separators = ['|', ',', ';', '\t'];
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep).map(s => s.trim());
      if (parts.length >= 2) {
        return {
          fan: parts[0], fin: parts[1] || null, name: parts[2] || null,
          birthdate: parts[3] || null, gender: parts[4] || null, raw: parts,
        };
      }
    }
  }

  return { fan: raw.trim(), fin: null, name: null, birthdate: null, gender: null, raw };
}

// ============ አጋዥዎች ============
function getMealType() {
  const now = new Date();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const total = hours * 60 + minutes;  // ጠቅላላ ደቂቃ

  // 4:30–6:00 UTC → breakfast
  if (total >= 4 * 60 + 30 && total < 6 * 60) return 'breakfast';

  // 9:00–10:30 UTC → lunch
  if (total >= 9 * 60 && total < 10 * 60 + 30) return 'lunch';

  // 14:00–17:00 UTC → dinner
  if (total >= 14 * 60 && total < 17 * 60) return 'dinner';

  return 'off-hours';
}

// ============ የተማሪ/ሰራተኛ ፍለጋ (በሦስቱም ሉሆች) ============
async function findStudent(fan, fin) {
  const sheetsToSearch = ['CafeRegistry', 'NonCafeRegistry', 'StaffRegistry'];

  for (const sheetName of sheetsToSearch) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:J`,
      });
      const rows = res.data.values || [];
      if (rows.length < 2) continue;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if ((fan && row[0] === fan) || (fin && row[1] === fin)) {
          return {
            source: sheetName,
            fan: row[0] || '',
            fin: row[1] || '',
            name: row[2] || '',
            birthdate: row[3] || '',
            college: row[4] || '',
            department: row[5] || '',
            year: row[6] || '',
            status: (row[7] || 'active').toLowerCase(),
          };
        }
      }
    } catch (e) {
      // ሉሁ ከሌለ ችላ በል
      console.warn(`Sheet ${sheetName} not found:`, e.message);
    }
  }
  return null;
}

// ============ በCafeRegistry ብቻ ፍለጋ ============
async function findStudentInCafe(fan, fin) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'CafeRegistry!A:J',
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return null;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if ((fan && row[0] === fan) || (fin && row[1] === fin)) {
        return {
          source: 'CafeRegistry',
          fan: row[0] || '',
          fin: row[1] || '',
          name: row[2] || '',
          birthdate: row[3] || '',
          college: row[4] || '',
          department: row[5] || '',
          year: row[6] || '',
          status: (row[7] || 'active').toLowerCase(),
        };
      }
    }
  } catch (e) {
    console.warn('CafeRegistry not found:', e.message);
  }
  return null;
}

// ============ ከDU_Reference ጋር ማመሳከር ============
async function verifyAgainstDU(fan, fin) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'DU_Reference!A:D',
    });
    const rows = res.data.values || [];
    if (rows.length < 2) return false;

    for (let i = 1; i < rows.length; i++) {
      if ((fan && rows[i][0] === fan) || (fin && rows[i][1] === fin)) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.warn('DU_Reference not found:', e.message);
    return false;
  }
}

// ============ ተመዝግቧል ወይስ አልተመዘገበ ============
async function checkIfRegistered(fan, fin) {
  const sheetsToCheck = ['StaffRegistry', 'NonCafeRegistry', 'CafeRegistry'];

  for (const sheetName of sheetsToCheck) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:B`,
      });
      const rows = res.data.values || [];
      if (rows.length < 2) continue;

      for (let i = 1; i < rows.length; i++) {
        if ((fan && rows[i][0] === fan) || (fin && rows[i][1] === fin)) {
          return sheetName;
        }
      }
    } catch (e) {
      console.warn(`Check failed for ${sheetName}:`, e.message);
    }
  }
  return null;
}

// ============ የምግብ አጠቃቀም ማረጋገጫ ============
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
  } catch (e) {
    console.error('logMeal error:', e.message);
  }
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
  } catch (e) {
    console.error('logGate error:', e.message);
  }
}

// ============ API: Fayda QR Parse ============
app.post('/api/parse-fayda', (req, res) => {
  const { raw } = req.body;
  const parsed = parseFaydaQR(raw);

  if (!parsed || (!parsed.fan && !parsed.fin)) {
    return res.json({ ok: false, message: 'የQR ኮድ ሊነበብ አልቻለም' });
  }

  res.json({
    ok: true,
    fan: parsed.fan || '',
    fin: parsed.fin || '',
    name: parsed.name || '',
    birthdate: parsed.birthdate || '',
    gender: parsed.gender || '',
  });
});

// ============ API: የምዝገባ ============
app.post('/api/register', async (req, res) => {
  try {
    const { type, fan, fin, name, birthdate, college, department, year } = req.body;

    if (!fan && !fin) {
      return res.json({ ok: false, message: 'FAN ወይም FIN ያስፈልጋል' });
    }

    if (!type || !['staff', 'noncafe', 'cafe'].includes(type)) {
      return res.json({ ok: false, message: 'የምዝገባ ዓይነት ትክክል አይደለም' });
    }

    // 1. ከDU_Reference ዳታ ጋር አመሳክር
    const isDU = await verifyAgainstDU(fan, fin);
    if (!isDU) {
      return res.json({
        ok: false,
        message: 'ይህ FAN/FIN በDilla University ዳታ ውስጥ አልተገኘም። እባክህ ወደ Admin ተጠጋ።',
      });
    }

    // 2. ተጠቃሚው ከዚህ በፊት መመዝገቡን አረጋግጥ
    const existingSheet = await checkIfRegistered(fan, fin);
    if (existingSheet) {
      return res.json({
        ok: false,
        message: `ይህ ሰው ከዚህ በፊት በ${existingSheet} ተመዝግቧል። ሁለት ጊዜ መመዝገብ አይቻልም።`,
      });
    }

    // 3. ወደ ተገቢው ሉህ መዝግብ
    const timestamp = new Date().toISOString();
    let sheetName, row;

    if (type === 'staff') {
      sheetName = 'StaffRegistry';
      // FAN | FIN | ስም | ሚና | ክፍል | ስልክ | ሁኔታ | ቀን
      row = [
        fan || '',
        fin || '',
        name || '',
        'staff',
        department || '',
        '',
        'active',
        timestamp,
      ];
    } else if (type === 'noncafe') {
      sheetName = 'NonCafeRegistry';
      // FAN | FIN | ስም | የትውልድ ቀን | ኮሌጅ | ዲፓርትመንት | ዓመት | ሁኔታ | ቀን
      row = [
        fan || '',
        fin || '',
        name || '',
        birthdate || '',
        college || '',
        department || '',
        year || '',
        'active',
        timestamp,
      ];
    } else if (type === 'cafe') {
      sheetName = 'CafeRegistry';
      // FAN | FIN | ስም | የትውልድ ቀን | ኮሌጅ | ዲፓርትመንት | ዓመት | ሁኔታ | የካፌቴሪያ ፈቃድ | ቀን
      row = [
        fan || '',
        fin || '',
        name || '',
        birthdate || '',
        college || '',
        department || '',
        year || '',
        'active',
        'approved',
        timestamp,
      ];
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${sheetName}!A:J`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    });

    res.json({
      ok: true,
      message: 'ተመዝግቧል! አሁን ወደ ዩኒቨርሲቲ መግባት ትችላለህ።',
      source: sheetName,
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ ok: false, message: 'የሰርቨር ስህተት: ' + err.message });
  }
});

// ============ API: ማረጋገጫ (Verify) ============
app.post('/api/verify', async (req, res) => {
  try {
    const { raw, mode, gate, location } = req.body;
    const parsed = parseFaydaQR(raw);

    if (!parsed || (!parsed.fan && !parsed.fin)) {
      return res.json({
        allowed: false,
        reason: 'invalid_qr',
        message: 'የQR ኮድ ሊነበብ አልቻለም',
      });
    }

    // የካፌቴሪያ ሁነታ — ከCafeRegistry ብቻ ይፈልጋል
    if (mode === 'cafeteria') {
      const student = await findStudentInCafe(parsed.fan, parsed.fin);

      if (!student) {
        await logGate(parsed.fan, parsed.name, 'not_registered_cafe', location);
        return res.json({
          allowed: false,
          reason: 'not_registered_cafe',
          message: 'ይህ ሰው ለካፌቴሪያ አልተመዘገበም',
        });
      }

      if (student.status !== 'active') {
        await logGate(student.fan, student.name, 'inactive', location);
        return res.json({
          allowed: false,
          reason: 'inactive',
          message: 'የተማሪው ሁኔታ ንቁ አይደለም',
          student,
        });
      }

      const mealType = getMealType();
      const usedAt = await checkMealUsed(student.fan, mealType);

      if (usedAt) {
        await logGate(student.fan, student.name, 'meal_used', location);
        return res.json({
          allowed: false,
          reason: 'already_used',
          message: 'ይህ ID ቀድሞ ተጠቅሟል — ለአንድ ምግብ ሁለት ጊዜ አይፈቀድም',
          mealType,
          usedAt,
          student,
        });
      }

      await logMeal(student.fan, student.name, mealType, location);
      await logGate(student.fan, student.name, 'meal_ok', location);

      return res.json({
        allowed: true,
        reason: 'meal_ok',
        message: 'Get In! መልካም ምሳ ይሁንልህ',
        mealType,
        student,
      });
    }

    // የበር ሁነታ — በሦስቱም ሉሆች ይፈልጋል
    const student = await findStudent(parsed.fan, parsed.fin);

    if (!student) {
      await logGate(parsed.fan, parsed.name, 'not_registered', gate);
      return res.json({
        allowed: false,
        reason: 'not_student',
        message: 'ይህ ሰው የዲላ ዩኒቨርሲቲ አልተመዘገበም',
        parsed,
      });
    }

    if (student.status !== 'active') {
      await logGate(student.fan, student.name, 'inactive', gate);
      return res.json({
        allowed: false,
        reason: 'inactive',
        message: 'የተማሪው ሁኔታ ንቁ አይደለም',
        student,
      });
    }

    await logGate(student.fan, student.name, 'allowed', gate);
    return res.json({
      allowed: true,
      reason: 'gate_ok',
      message: 'Get In!',
      student,
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({
      allowed: false,
      reason: 'server_error',
      message: 'የሰርቨር ስህተት — እባክህ እንደገና ሞክር',
    });
  }
});

// ============ API: ስታቲስቲክስ (Admin) ============
app.get('/api/stats', async (req, res) => {
  try {
    if (req.query.key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const safeGet = async (range) => {
      try {
        const r = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range });
        return r.data.values || [];
      } catch {
        return [];
      }
    };

    const [students, staff, noncafe, cafe, meals, gates] = await Promise.all([
      safeGet('Students!A:H'),
      safeGet('StaffRegistry!A:H'),
      safeGet('NonCafeRegistry!A:I'),
      safeGet('CafeRegistry!A:J'),
      safeGet('MealLog!A:E'),
      safeGet('GateLog!A:F'),
    ]);

    const staffData = staff.slice(1);
    const noncafeData = noncafe.slice(1);
    const cafeData = cafe.slice(1);
    const mealsData = meals.slice(1);
    const gatesData = gates.slice(1);

    const today = todayStr();
    const todayMeals = mealsData.filter(r => r[1] === today);
    const todayGates = gatesData.filter(r => r[2] === today);

    res.json({
      totalStudents: noncafeData.length + cafeData.length,
      totalStaff: staffData.length,
      nonCafeCount: noncafeData.length,
      cafeCount: cafeData.length,
      todayMeals: todayMeals.length,
      todayGates: todayGates.length,
      todayRejected: todayGates.filter(g => g[4] !== 'allowed' && g[4] !== 'meal_ok').length,
      recentMeals: todayMeals.slice(-10).reverse().map(r => ({
        fan: r[0], date: r[1], meal: r[2], time: r[3],
      })),
      recentGates: todayGates.slice(-10).reverse().map(r => ({
        fan: r[0], name: r[1], result: r[4], gate: r[5], time: r[3],
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ Clean URLs ============
app.get('/gateway', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gateway.html')));
app.get('/cafeteria', (req, res) => res.sendFile(path.join(__dirname, 'public', 'cafeteria.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));

// ============ Start ============
app.listen(PORT, () => {
  console.log(`✅ Dilla Verifier running on http://localhost:${PORT}`);
});