# SLEX Setup Guide

Bu loyihani ishga tushirish uchun qadma-qadamli yo'riqnoma.

## 1. Dependencies o'rnatish

```bash
npm install
```

## 2. Loyihani ishga tushirish

### MongoDB siz (sodda rejim)
Loyiha hozir MongoDB bo'lmagan holatda ham ishlaydi:

```bash
npm run dev
```

Brauzerda oching: http://localhost:3000

## 3. To'liq funksionallik uchun MongoDB

### MongoDB o'rnatish
1. MongoDB o'rnating: https://www.mongodb.com/try/download/community
2. MongoDB servisini ishga tushiring
3. `.env` faylida MONGODB_URI ni yoqing:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/slex-db
```

### Super Admin yaratish
```bash
npm run create-admin
```

## 4. Asosiy funksiyalar

### Foydalanuvchi uchun:
- **Registratsiya**: `/register` - Kompaniya adminlari ro'yxatdan o'tish
- **Login**: `/login` - Tizimga kirish
- **Bosh sahifa**: `/` - Mahsulotlar katalogi

### Admin uchun:
- **Admin login**: `/admin/login` (admin@slex.uz / SuperAdmin2024!)
- **Tasdiqlash**: Yangi kompaniya adminlarini tasdiqlash
- **Boshqaruv**: Foydalanuvchilarni boshqarish

## 5. Login haqida ma'lumot

### Kompaniya adminlari:
- **Status**: Ro'yxatdan o'tgandan keyin "blocked" holatida
- **Tasdiqlash**: Super admin tomonidan tasdiqlanishi kerak
- **Kirish**: Email yoki Soliq raqami (STIR/INN) orqali

### Blocked foydalanuvchi login qilganda:
- Toast notification ko'rinadi
- Admin bilan bog'lanish variantlari taklif qilinadi
- Kutish haqida ma'lumot beriladi

## 6. Tillar

Loyiha 6 tilni qo'llab-quvvatlaydi:
- O'zbek (uz)
- Ingliz (en) 
- Rus (ru)
- Turkcha (tr)
- Fors (fa)
- Xitoy (zh)

## 7. Fayl yuklash

Kompaniya logoları:
- **Maksimal hajm**: 5MB
- **Format**: JPG, PNG
- **Saqlash joyi**: `/public/uploads/logos/`

## 8. Havolalar

- **Bosh sahifa**: http://localhost:3000
- **Registratsiya**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **Admin login**: http://localhost:3000/admin/login
- **Barcha mahsulotlar**: http://localhost:3000/all-product
- **Hamkor davlatlar**: http://localhost:3000/partner-countries

## 9. Muammolarni hal qilish

### "Cannot find module 'mongoose'" xatosi:
```bash
npm install
```

### MongoDB ulanmaydi:
1. MongoDB servisi ishga tushirilganini tekshiring
2. `.env` da MONGODB_URI to'g'ri sozlanganini tekshiring
3. Agar kerak bo'lmasa, uni izohlab qo'ying

### Port band:
`.env` faylida PORT ni o'zgartiring:
```env
PORT=3001
```

## 10. Keyingi qadamlar

1. MongoDB o'rnating va ulanish sozlang
2. Super admin yarating
3. Kompaniya adminlarini ro'yxatdan o'tkazing
4. Admin panel orqali ularni tasdiqlang
5. To'liq B2B marketplace funksiyalaridan foydalaning