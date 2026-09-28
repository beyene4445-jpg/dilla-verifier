// ============ Language System (i18n) ============

const translations = {
    en: {
      // Home
      'app.title': 'Dilla University',
      'app.subtitle': 'Fayda QR Verification System',
      'home.welcome': 'This system verifies students by scanning their Fayda QR code. It also prevents a student from eating twice for the same meal.',
      'home.gateway': 'Gateway Verification',
      'home.gateway.desc': 'Verify at entrance',
      'home.cafeteria': 'Cafeteria Verification',
      'home.cafeteria.desc': 'Meal verification',
      'home.register': 'Registration',
      'home.register.desc': 'Register students and staff',
      'home.admin': 'Admin Dashboard',
      'home.admin.desc': 'Statistics and reports',
      'home.footer': 'Dilla University · 2026',
      
      // Gateway
      'gateway.title': '🚪 Gateway Verification',
      'gateway.subtitle': 'Show the Fayda QR code to the camera',
      'gateway.back': '← Back',
      'gateway.pause': '⏸ Pause',
      'gateway.resume': '▶ Resume',
      'gateway.hint': 'Scan runs automatically · Has voice notification',
      'gateway.getIn': 'Get In!',
      'gateway.studentVerified': 'Verified Dilla University student',
      'gateway.notAllowed': 'Not Allowed Here',
      'gateway.talkSecurity': 'Please talk to security guard',
      'gateway.notActive': 'Not Active',
      'gateway.studentInactive': 'Student status is not active',
      'gateway.invalidQR': 'Invalid QR',
      'gateway.couldNotRead': 'Could not read QR code',
      'gateway.cameraError': 'Camera Error',
      'gateway.cameraErrorDesc': 'Camera could not open — HTTPS required',
      'gateway.networkError': 'Network Error',
      'gateway.noInternet': 'No internet connection',
      'gateway.serverError': 'Server Error',
      'gateway.tryAgain': 'Please try again',
      'gateway.notRegistered': 'Not registered at Dilla University',
      
      // Cafeteria
      'cafeteria.title': '🍽️ Cafeteria Verification',
      'cafeteria.subtitle': 'Show the Fayda QR code to the camera',
      'cafeteria.hint': 'One student can eat only once per meal',
      'cafeteria.breakfast': 'Breakfast',
      'cafeteria.lunch': 'Lunch',
      'cafeteria.dinner': 'Dinner',
      'cafeteria.meal': 'Meal',
      'cafeteria.goodMeal': 'Enjoy your meal',
      'cafeteria.alreadyUsed': 'This ID Used Before',
      'cafeteria.noTwice': 'You cannot eat twice for one meal',
      'cafeteria.notRegistered': 'Not registered for cafeteria',
      
      // Registration
      'register.title': '📝 Registration',
      'register.subtitle': 'Register students and staff',
      'register.staff': 'Staff & Workers',
      'register.staff.desc': 'Staff registration',
      'register.noncafe': 'Non-Cafe Registration',
      'register.noncafe.desc': 'Student registration (without cafeteria)',
      'register.cafe': 'Cafeteria Registration',
      'register.cafe.desc': 'Student registration (with cafeteria)',
      'register.formStaff': '👔 Staff & Workers Registration',
      'register.formNonCafe': '📚 Non-Cafe Registration',
      'register.formCafe': '🍽️ Cafeteria Registration',
      'register.scanQR': '📷 Scan Fayda QR',
      'register.fan': 'FAN',
      'register.fin': 'FIN',
      'register.name': 'Name',
      'register.birthdate': 'Date of Birth',
      'register.college': 'College',
      'register.department': 'Department',
      'register.year': 'Year',
      'register.year1': '1st Year',
      'register.year2': '2nd Year',
      'register.year3': '3rd Year',
      'register.year4': '4th Year',
      'register.year5': '5th Year',
      'register.year6': '6th Year',
      'register.selectCollege': '-- Select College --',
      'register.selectDept': '-- Select College First --',
      'register.selectDeptFirst': '-- Select Department --',
      'register.submit': '✅ Register',
      'register.back': '← Back',
      'register.success': 'Registered!',
      'register.successMsg': 'You can now enter the university',
      'register.failed': 'Registration failed',
      'register.qrScanned': 'QR Scanned',
      'register.qrScannedMsg': 'Verify the info and register',
      'register.fanRequired': 'FAN or FIN required',
      
      // Admin
      'admin.title': '📊 Admin Dashboard',
      'admin.subtitle': 'Dilla University · Meal & Gate Statistics',
      'admin.key': 'Admin Key',
      'admin.enter': 'Enter',
      'admin.totalStudents': 'Total Students',
      'admin.activeStudents': 'Active Students',
      'admin.todayMeals': 'Today Meals',
      'admin.rejected': 'Rejected',
      'admin.recentMeals': '🕒 Recent Meals',
      'admin.recentGates': '🚪 Recent Gate Activity',
      'admin.refresh': '🔄 Refresh',
      'admin.fan': 'FAN',
      'admin.meal': 'Meal',
      'admin.time': 'Time',
      'admin.result': 'Result',
      'admin.gate': 'Gate',
      'admin.none': 'None',
      'admin.back': '← Back',
      
      // Common
      'common.getIn': 'Get In!',
      'common.notAllowed': 'Not Allowed',
      'common.loading': 'Loading...',
    },
    
    am: {
      // Home
      'app.title': 'ዲላ ዩኒቨርሲቲ',
      'app.subtitle': 'የFayda QR ማረጋገጫ ስርዓት',
      'home.welcome': 'ይህ ስርዓት የተማሪዎችን የFayda QR ኮድ በመቃኘት የዲላ ዩኒቨርሲቲ መሆናቸውን ያረጋግጣል። እንዲሁም አንድ ተማሪ ለአንድ ምግብ ሁለት ጊዜ እንዳይመገብ ይከላከላል።',
      'home.gateway': 'የበር ማረጋገጫ',
      'home.gateway.desc': 'በመግቢያ በር ላይ ማረጋገጫ',
      'home.cafeteria': 'የካፌቴሪያ ማረጋገጫ',
      'home.cafeteria.desc': 'የምግብ ማረጋገጫ',
      'home.register': 'ምዝገባ',
      'home.register.desc': 'ተማሪዎችን እና ሰራተኞችን ይመዝግቡ',
      'home.admin': 'የአስተዳዳሪ ዳሽቦርድ',
      'home.admin.desc': 'ስታቲስቲክስ እና ሪፖርቶች',
      'home.footer': 'ዲላ ዩኒቨርሲቲ · 2026',
      
      // Gateway
      'gateway.title': '🚪 የበር ማረጋገጫ',
      'gateway.subtitle': 'የተማሪውን Fayda QR ኮድ ወደ ካሜራው አቅርብ',
      'gateway.back': '← ተመለስ',
      'gateway.pause': '⏸ አቁም',
      'gateway.resume': '▶ ቀጥል',
      'gateway.hint': 'ስካኑ በራስ-ሰር ይሰራል · ድምጽ ማሳወቂያ አለው',
      'gateway.getIn': 'ግባ!',
      'gateway.studentVerified': 'የዲላ ዩኒቨርሲቲ ተማሪ ነው',
      'gateway.notAllowed': 'እዚህ አይፈቀድም',
      'gateway.talkSecurity': 'እባክህ ከጠባቂው ጋር ተነጋገር',
      'gateway.notActive': 'ንቁ አይደለም',
      'gateway.studentInactive': 'የተማሪው ሁኔታ ንቁ አይደለም',
      'gateway.invalidQR': 'የተሳሳተ QR',
      'gateway.couldNotRead': 'የQR ኮዱ ሊነበብ አልቻለም',
      'gateway.cameraError': 'የካሜራ ስህተት',
      'gateway.cameraErrorDesc': 'ካሜራ ሊከፈት አልቻለም — HTTPS ያስፈልጋል',
      'gateway.networkError': 'የኔትወርክ ስህተት',
      'gateway.noInternet': 'ኢንተርኔት አልተገኘም',
      'gateway.serverError': 'የሰርቨር ስህተት',
      'gateway.tryAgain': 'እባክህ እንደገና ሞክር',
      'gateway.notRegistered': 'የዲላ ዩኒቨርሲቲ አልተመዘገበም',
      
      // Cafeteria
      'cafeteria.title': '🍽️ የካፌቴሪያ ማረጋገጫ',
      'cafeteria.subtitle': 'የተማሪውን Fayda QR ኮድ ወደ ካሜራው አቅርብ',
      'cafeteria.hint': 'አንድ ተማሪ ለአንድ ምግብ አንድ ጊዜ ብቻ',
      'cafeteria.breakfast': 'ቁርስ',
      'cafeteria.lunch': 'ምሳ',
      'cafeteria.dinner': 'እራት',
      'cafeteria.meal': 'ምግብ',
      'cafeteria.goodMeal': 'መልካም ምሳ ይሁንልህ',
      'cafeteria.alreadyUsed': 'ይህ ID ቀድሞ ተጠቅሟል',
      'cafeteria.noTwice': 'ለአንድ ምግብ ሁለት ጊዜ አይፈቀድም',
      'cafeteria.notRegistered': 'ለካፌቴሪያ አልተመዘገበም',
      
      // Registration
      'register.title': '📝 ምዝገባ',
      'register.subtitle': 'ተማሪዎችን እና ሰራተኞችን ይመዝግቡ',
      'register.staff': 'ሰራተኞች',
      'register.staff.desc': 'የሰራተኞች ምዝገባ',
      'register.noncafe': 'ያለ ካፌቴሪያ ምዝገባ',
      'register.noncafe.desc': 'የተማሪዎች ምዝገባ (ያለ ካፌቴሪያ)',
      'register.cafe': 'የካፌቴሪያ ምዝገባ',
      'register.cafe.desc': 'የተማሪዎች ምዝገባ (ከካፌቴሪያ ጋር)',
      'register.formStaff': '👔 የሰራተኞች ምዝገባ',
      'register.formNonCafe': '📚 ያለ ካፌቴሪያ ምዝገባ',
      'register.formCafe': '🍽️ የካፌቴሪያ ምዝገባ',
      'register.scanQR': '📷 Fayda QR ስካን',
      'register.fan': 'FAN',
      'register.fin': 'FIN',
      'register.name': 'ስም',
      'register.birthdate': 'የትውልድ ቀን',
      'register.college': 'ኮሌጅ',
      'register.department': 'ዲፓርትመንት',
      'register.year': 'ዓመት',
      'register.year1': '1ኛ ዓመት',
      'register.year2': '2ኛ ዓመት',
      'register.year3': '3ኛ ዓመት',
      'register.year4': '4ኛ ዓመት',
      'register.year5': '5ኛ ዓመት',
      'register.year6': '6ኛ ዓመት',
      'register.selectCollege': '-- ኮሌጅ ምረጥ --',
      'register.selectDept': '-- ኮሌጅ በመጀመሪያ ምረጥ --',
      'register.selectDeptFirst': '-- ዲፓርትመንት ምረጥ --',
      'register.submit': '✅ መዝግብ',
      'register.back': '← ተመለስ',
      'register.success': 'ተመዝግቧል!',
      'register.successMsg': 'አሁን ወደ ዩኒቨርሲቲ መግባት ትችላለህ',
      'register.failed': 'ምዝገባ አልተሳካም',
      'register.qrScanned': 'QR ተነብቧል',
      'register.qrScannedMsg': 'መረጃውን አረጋግጥና መዝግብ',
      'register.fanRequired': 'FAN ወይም FIN ያስፈልጋል',
      
      // Admin
      'admin.title': '📊 የአስተዳዳሪ ዳሽቦርድ',
      'admin.subtitle': 'ዲላ ዩኒቨርሲቲ · የምግብ እና የበር ስታቲስቲክስ',
      'admin.key': 'የAdmin ቁልፍ',
      'admin.enter': 'ግባ',
      'admin.totalStudents': 'ጠቅላላ ተማሪ',
      'admin.activeStudents': 'ንቁ ተማሪ',
      'admin.todayMeals': 'የዛሬ ምግብ',
      'admin.rejected': 'የተከለከሉ',
      'admin.recentMeals': '🕒 የቅርብ ጊዜ ምግቦች',
      'admin.recentGates': '🚪 የቅርብ ጊዜ በር እንቅስቃሴ',
      'admin.refresh': '🔄 አድስ',
      'admin.fan': 'FAN',
      'admin.meal': 'ምግብ',
      'admin.time': 'ሰዓት',
      'admin.result': 'ውጤት',
      'admin.gate': 'በር',
      'admin.none': 'ምንም የለም',
      'admin.back': '← ተመለስ',
      
      // Common
      'common.getIn': 'ግባ!',
      'common.notAllowed': 'አይፈቀድም',
      'common.loading': 'በመጫን ላይ...',
    }
  };
  
  // ============ Current Language ============
  function getLang() {
    return localStorage.getItem('lang') || 'am';
  }
  
  function setLang(lang) {
    localStorage.setItem('lang', lang);
    applyTranslations();
    updateLangButtons();
  }
  
  function t(key) {
    const lang = getLang();
    return translations[lang]?.[key] || translations['en'][key] || key;
  }
  
  // ============ Apply Translations ============
  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const value = t(key);
      if (value) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.placeholder = value;
        } else {
          el.textContent = value;
        }
      }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });
    
    // Update page title
    const titleKey = document.body.getAttribute('data-title-key');
    if (titleKey) {
      document.title = t(titleKey);
    }
  }
  
  // ============ Update Language Buttons ============
  function updateLangButtons() {
    const current = getLang();
    document.querySelectorAll('[data-lang-btn]').forEach(btn => {
      const lang = btn.getAttribute('data-lang-btn');
      if (lang === current) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
  
  // ============ Language Switcher HTML ============
  function createLangSwitcher() {
    const container = document.getElementById('langSwitcher');
    if (!container) return;
    
    container.innerHTML = `
      <div class="lang-switcher">
        <button data-lang-btn="am" onclick="setLang('am')" class="lang-btn">🇪🇹 አማ</button>
        <button data-lang-btn="en" onclick="setLang('en')" class="lang-btn">🇬🇧 EN</button>
      </div>
    `;
    updateLangButtons();
  }
  
  // ============ Init ============
  document.addEventListener('DOMContentLoaded', () => {
    createLangSwitcher();
    applyTranslations();
  });
  
  // Expose globally
  window.setLang = setLang;
  window.t = t;
  window.getLang = getLang;