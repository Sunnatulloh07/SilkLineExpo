# SLEX - Silk Line Expo Express.js Application

## 🌟 Overview

SLEX (Silk Line Expo) Express.js application - A B2B digital marketplace connecting manufacturers and distributors across Central Asia. This version converts the original HTML/CSS/JavaScript into a full Express.js application with EJS templating.

## 🚀 Features

- **Express.js Framework** - Modern Node.js web application framework
- **EJS Templating** - Dynamic content rendering with embedded JavaScript
- **i18next Multi-language** - Professional internationalization with 6 languages (UZ, EN, RU, TR, FA, ZH)
- **Static Asset Serving** - CSS, JavaScript, images properly served
- **Multiple Pages** - All original HTML pages converted to EJS with translations
- **Responsive Design** - Bootstrap-based responsive layout
- **Security Middleware** - Helmet, CORS, compression enabled
- **Session Management** - Express sessions configured
- **API Endpoints** - RESTful API for dynamic data
- **Language Switching** - Real-time language switching with cookie persistence

## 📁 Project Structure

```
silkline/
├── app.js                  # Main Express server
├── package.json           # Node.js dependencies
├── .env                   # Environment variables
├── data.json             # Product and company data
├── public/               # Static assets
│   ├── assets/          # Original CSS, JS, fonts
│   └── img/             # Product and company images
├── views/               # EJS templates
│   ├── partials/        # Reusable components
│   │   ├── header.ejs   # HTML head and opening tags
│   │   ├── navigation.ejs # Header navigation
│   │   └── footer.ejs   # Footer and closing tags
│   └── pages/           # Main page templates
│       ├── index.ejs           # Homepage
│       ├── all-product.ejs     # Product listing
│       ├── product-details.ejs # Product details
│       ├── partner-countries.ejs # Countries page
│       ├── partners-agents.ejs  # Agents page
│       ├── product-country.ejs  # Country products
│       ├── contact.ejs          # Contact page
│       ├── blog.ejs            # Blog listing
│       ├── blog-details.ejs    # Blog post details
│       └── login.ejs           # Login page
└── routes/              # Express routes (for future expansion)
```

## 🛠️ Installation & Setup

### 1. Dependencies Installation

```bash
cd silkline
npm install
```

### 2. Environment Setup

The `.env` file is already configured with development settings:

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=slex-session-secret-key-2024
APP_NAME=SLEX - Silk Line Expo
APP_URL=http://localhost:3000
```

### 3. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

## 📊 Available Routes

### Public Pages
- **`/`** - Homepage with company overview and featured products
- **`/all-product`** - Complete product catalog with filters
- **`/product-details?id=1&country=Kazakhstan&company=Suntik`** - Product details page
- **`/partner-countries`** - Manufacturers by country
- **`/partners-agents`** - Partner agents and representatives
- **`/product-country?country=Kazakhstan`** - Country-specific products
- **`/contact`** - Contact form and information
- **`/blog`** - News and blog articles
- **`/blog-details`** - Individual blog post
- **`/login`** - User authentication page
- **`/test`** - Language switching test page

### Language Routes
- **`/language/:lng`** - Switch language (uz, en, ru, tr, fa, zh)

### API Endpoints
- **`/api/countries`** - Get all countries data (JSON)
- **`/api/products`** - Get products with optional filters (JSON)
  - `?country=Kazakhstan` - Products from specific country
  - `?country=Kazakhstan&company=Suntik` - Products from specific company

## 🎨 Frontend Features

### Converted from Original HTML
- **Responsive Bootstrap Layout** - Mobile-first design
- **Professional i18next Integration** - Server-side translations with 6 languages
- **Product Catalog** - Dynamic product listings with translations
- **Search & Filters** - Product filtering by country/category
- **Image Galleries** - Product image sliders
- **Contact Forms** - Working contact form structure with translations
- **Blog System** - News and article system with multi-language support
- **Dark/Light Mode** - Theme switching capability

### JavaScript Functionality
- **Slick Sliders** - Product and testimonial carousels
- **Magnific Popup** - Image lightbox functionality
- **Country/Product Filtering** - Dynamic content filtering
- **Language Switching** - Real-time language switching with cookie persistence
- **Theme Switching** - Dark/light mode toggle
- **Form Validation** - Contact and login form validation

### Multi-language Features
- **6 Languages Supported** - Uzbek, English, Russian, Turkish, Persian, Chinese
- **Server-side Rendering** - SEO-friendly translations
- **Cookie Persistence** - Language preference saved for 30 days
- **RTL Support** - Right-to-left text for Persian language
- **Dynamic Language Switching** - Instant language changes without page reload

## 🗄️ Data Structure

The application uses `data.json` containing:

### Countries (7 total)
- Uzbekistan, Kazakhstan, China, Tajikistan, Turkmenistan, Afghanistan, Kyrgyzstan

### Companies (15+ companies)
- **Uzbekistan:** Artel, HamroH
- **Kazakhstan:** AYU, NI, Suntik, AQUA, Ji-Ji, S-Gel, Raxat
- **China:** Wimow, Laiwu Spring rain, Sany
- **Afghanistan:** Almas-K, Afgan Kazan

### Products (100+ products)
Each product includes:
```json
{
  "id": 1,
  "title": "Product Name",
  "type": "Category",
  "price": 100,
  "image": "/img/product-logo/image.jpg",
  "sales": "120+",
  "description": "Product description..."
}
```

## 🔧 Development Features

### Express.js Middleware
- **Helmet** - Security headers
- **Compression** - Response compression
- **Morgan** - HTTP request logging
- **CORS** - Cross-origin resource sharing
- **Body Parser** - Request body parsing
- **Cookie Parser** - Cookie handling
- **Express Session** - Session management

### EJS Templating Benefits
- **Reusable Partials** - Header, navigation, footer components
- **Dynamic Content** - Server-side data rendering
- **Conditional Rendering** - Show/hide content based on data
- **Loop Rendering** - Dynamic lists and grids
- **SEO Friendly** - Server-side rendered content

## 🚀 Future Enhancements

The current setup provides a solid foundation for adding:

### Backend Features
- **User Authentication** - Registration, login, JWT tokens
- **Database Integration** - MongoDB with Mongoose ODM
- **Admin Panel** - Product and user management
- **Order Management** - Shopping cart and checkout
- **Real-time Chat** - WebSocket messaging system
- **File Upload** - Document and image management
- **Email System** - Notifications and confirmations
- **Payment Integration** - Multiple payment gateways

### Frontend Enhancements
- **AJAX Product Loading** - Dynamic content loading
- **Advanced Filtering** - Multi-criteria search
- **User Dashboard** - Profile and order management
- **Shopping Cart** - Add to cart functionality
- **Wishlist System** - Save favorite products
- **Product Comparison** - Side-by-side comparison
- **Reviews & Ratings** - Customer feedback system

## 📞 Support

For technical support and questions:
- **Email:** support@slex.uz
- **Telegram:** @slex_support

## 📄 License

This project is licensed under the MIT License.

---

**SLEX Platform** - Empowering B2B trade across Central Asia! 🌏