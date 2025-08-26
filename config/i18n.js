const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');
const fs = require('fs');

// Load translation files directly
const loadTranslations = () => {
  const translations = {};
  const languages = ['uz', 'en', 'ru', 'fa', 'tr', 'zh'];
  
  languages.forEach(lang => {
    try {
      const filePath = path.join(__dirname, '../locales', `${lang}.json`);
      if (fs.existsSync(filePath)) {
        const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        translations[lang] = {
          translation: fileContent
        };

      } else {
        console.error(`❌ Translation file not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error loading ${lang}.json:`, error.message);
    }
  });
  
  return translations;
};

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    // Debug mode - enable for development
    debug: process.env.NODE_ENV === 'development',
    
    // Default language
    lng: 'uz',
    fallbackLng: 'uz',
    
    // Supported languages
    supportedLngs: ['uz', 'en', 'ru', 'fa', 'tr', 'zh'],
    
    // Language detection
    detection: {
      order: ['querystring', 'cookie', 'header'],
      caches: ['cookie'],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      cookieMinutes: 60 * 24 * 30, // 30 days
    },
    
    // Backend configuration
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}.json'),
    },
    
    // Interpolation
    interpolation: {
      escapeValue: false, // not needed for server side
    },
    
    // Namespaces
    ns: ['translation'],
    defaultNS: 'translation',
    
    // Load resources directly
    resources: loadTranslations(),
    
    // Return key if translation is missing
    returnEmptyString: false,
    returnNull: false,
    returnObjects: false,
    joinArrays: ' ',
    
    // Options for missing keys
    saveMissing: false,
    updateMissing: false,
    
    // Key separator (set to false to support keys like 'button.login')
    keySeparator: '.',
    
    // Nested separator 
    nsSeparator: ':',
    
    // Plural separator
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_'
  }, (err, t) => {
    if (err) {
      console.error('❌ i18next initialization failed:', err);
    } else {
      console.log('✅ i18next initialized successfully');
      console.log('Available languages:', i18next.languages);
      
      }
  });

module.exports = i18next;