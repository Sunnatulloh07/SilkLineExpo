// Refresh Token Debug Script - Browser Console da ishlatish
console.log('🔍 REFRESH TOKEN TASHXIS BOSHLANDI...\n');

// 1. Cookie'larni tekshirish
console.log('📋 1. COOKIE LAR HOLATI:');
console.log('document.cookie:', document.cookie);

// 2. Refresh token mavjudligini tekshirish
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

const refreshToken = getCookie('refreshToken');
const accessToken = getCookie('accessToken');

console.log('\n🔑 2. TOKEN LAR:');  
console.log('refreshToken:', refreshToken ? `Mavjud (${refreshToken.substring(0, 20)}...)` : '❌ Topilmadi');
console.log('accessToken:', accessToken ? `Mavjud (${accessToken.substring(0, 20)}...)` : '❌ Topilmadi');

// 3. Token muddatini tekshirish
if (accessToken) {
    try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const exp = payload.exp * 1000;
        const now = Date.now();
        
        console.log('\n⏰ 3. TOKEN VAQTI:');
        console.log('Hozirgi vaqt:', new Date(now));
        console.log('Token tugaydi:', new Date(exp));
        console.log('Qolgan vaqt:', Math.round((exp - now) / 1000 / 60), 'daqiqa');
        console.log('Tugaganmi:', exp < now ? '❌ HA' : '✅ YO\'Q');
    } catch (e) {
        console.log('\n⚠️ Token decode xatoligi:', e.message);
    }
}

// 4. Manual refresh test
console.log('\n🧪 4. MANUAL REFRESH TEST:');

if (!refreshToken) {
    console.log('❌ Refresh token yo\'q - login qilish kerak!');
} else {
    console.log('🔄 Refresh token bilan test qilinmoqda...');
    
    fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        console.log('📡 Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📨 Response data:', data);
        if (data.success) {
            console.log('✅ REFRESH MUVAFFAQIYATLI!');
        } else {
            console.log('❌ REFRESH MUVAFFAQIYATSIZ:', data.message);
        }
    })
    .catch(error => {
        console.log('❌ Network xatoligi:', error);
    });
}

console.log('\n🎯 TASHXIS TUGADI. Natijalarni yuqorida ko\'ring!');

