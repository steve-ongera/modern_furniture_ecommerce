# 🛋️ Morara Modern Furniture — Full-Stack E-Commerce Platform

> **Premium furniture e-commerce for the Kenyan market** — Built with Django REST Framework + React + Vite, featuring M-Pesa Daraja API integration, county-based delivery fee estimation, flexible 50% deposit payment, and full SEO slug support.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Full Project Structure](#-full-project-structure)
3. [Tech Stack](#-tech-stack)
4. [Backend — Django Setup](#-backend--django-setup)
5. [Frontend — React Setup](#-frontend--react-setup)
6. [Environment Variables](#-environment-variables)
7. [Database Models](#-database-models)
8. [API Endpoints Reference](#-api-endpoints-reference)
9. [M-Pesa Integration Guide](#-mpesa-integration-guide)
10. [Delivery Fee Business Logic](#-delivery-fee-business-logic)
11. [Payment Policy Logic](#-payment-policy-logic)
12. [Frontend Pages & Routes](#-frontend-pages--routes)
13. [SEO Architecture](#-seo-architecture)
14. [Admin Panel Guide](#-admin-panel-guide)
15. [Seeding Initial Data](#-seeding-initial-data)
16. [Production Deployment](#-production-deployment)
17. [Showroom Contacts](#-showroom-contacts)

---

## 🏠 Project Overview

Morara Modern Furniture is a full-stack e-commerce platform that allows customers to:

- Browse and purchase furniture (beds, sofas, dining sets, wardrobes, TV stands, etc.)
- Select delivery to their county OR pickup at one of 3 showrooms (Nairobi, Nyeri, Nakuru)
- Pay via **M-Pesa STK Push** — full payment or 50% deposit
- Track orders and manage their account
- Save products to a wishlist

The system enforces a strict payment policy: if a customer selects the 50% deposit option and then fails to pay the balance on delivery, only **25% of the total (1/4)** is refunded.

---

## 📁 Full Project Structure

```
morara_furniture/
│
├── README.md                              ← This file
│
├── backend/                               ← Django REST API
│   │
│   ├── manage.py                          ← Django CLI entry point
│   ├── requirements.txt                   ← Python pip dependencies
│   │
│   ├── morara_furniture/                  ← Django project config package
│   │   ├── __init__.py
│   │   ├── settings.py                    ← All settings: DB, JWT, CORS, M-Pesa config,
│   │   │                                     delivery fees dict, pickup stations dict
│   │   ├── urls.py                        ← Root URL router — includes all 4 app URL sets
│   │   └── wsgi.py                        ← WSGI entry point for production server
│   │
│   ├── core/                              ← Products, categories, counties, locations
│   │   ├── __init__.py
│   │   ├── admin.py                       ← Admin: Category, County, PickupStation,
│   │   │                                     Product (with image/variant inlines), Review, Banner
│   │   ├── models.py                      ← Models: Category, County, PickupStation,
│   │   │                                     Material, Color, Product, ProductVariant,
│   │   │                                     ProductImage, Review, Banner, Wishlist
│   │   ├── serializers.py                 ← CategorySerializer, CountySerializer,
│   │   │                                     PickupStationSerializer, ProductListSerializer,
│   │   │                                     ProductDetailSerializer, ReviewSerializer,
│   │   │                                     BannerSerializer, WishlistSerializer,
│   │   │                                     DeliveryFeeSerializer
│   │   ├── views.py                       ← ViewSets: CategoryViewSet, CountyViewSet,
│   │   │                                     PickupStationViewSet, ProductViewSet (with
│   │   │                                     featured/new_arrivals/best_sellers/search/
│   │   │                                     delivery_fee/add_review actions),
│   │   │                                     BannerViewSet, WishlistViewSet
│   │   ├── urls.py                        ← DefaultRouter: categories, counties,
│   │   │                                     pickup-stations, products, banners, wishlist
│   │   └── management/
│   │       ├── __init__.py
│   │       └── commands/
│   │           ├── __init__.py
│   │           └── seed_data.py           ← Seeds: 33 counties, 3 pickup stations,
│   │                                         7 categories, 9 materials, 6 colors
│   │
│   ├── orders/                            ← Cart & order management
│   │   ├── __init__.py
│   │   ├── admin.py                       ← OrderAdmin (inline items), CartAdmin
│   │   ├── models.py                      ← Cart, CartItem, Order, OrderItem
│   │   │                                     Order statuses: pending → half_paid → paid
│   │   │                                     → processing → ready → out_for_delivery
│   │   │                                     → delivered → completed / cancelled /
│   │   │                                     refunded / defaulted
│   │   ├── serializers.py                 ← CartSerializer, CartItemSerializer,
│   │   │                                     OrderSerializer, CreateOrderSerializer
│   │   ├── views.py                       ← CartViewSet (add/update/remove/clear),
│   │   │                                     OrderViewSet (create with atomic transaction,
│   │   │                                     delivery fee calculation, cancel)
│   │   └── urls.py                        ← Router: cart/, orders/
│   │
│   ├── payments/                          ← M-Pesa Daraja API
│   │   ├── __init__.py
│   │   ├── admin.py                       ← PaymentAdmin (receipt, status, raw JSON)
│   │   ├── models.py                      ← Payment model: tracks every transaction,
│   │   │                                     M-Pesa receipt numbers, result codes,
│   │   │                                     full raw callback JSON
│   │   ├── views.py                       ← get_mpesa_access_token(), stk_push(),
│   │   │                                     initiate_payment view (debug + production),
│   │   │                                     mpesa_callback view (handles Safaricom POST),
│   │   │                                     check_payment_status view
│   │   └── urls.py                        ← initiate/, mpesa/callback/, status/<uuid>/
│   │
│   └── users/                             ← Custom user model + JWT auth
│       ├── __init__.py
│       ├── admin.py                       ← UserAdmin extending BaseUserAdmin
│       ├── models.py                      ← User: email as USERNAME_FIELD, phone,
│       │                                     city, county (FK), address, profile_picture
│       ├── views.py                       ← register, login, profile (GET/PATCH)
│       │                                     + RegisterSerializer, UserSerializer
│       └── urls.py                        ← register/, login/, profile/, token/refresh/
│
└── frontend/                              ← React + Vite SPA
    │
    ├── index.html                         ← Root HTML: SEO meta tags, Open Graph,
    │                                         Twitter Card, JSON-LD FurnitureStore schema,
    │                                         Bootstrap Icons CDN, Google Fonts preconnect
    ├── package.json                       ← npm dependencies
    ├── vite.config.js                     ← Vite: React plugin + /api proxy to :8000
    │
    └── src/
        │
        ├── main.jsx                       ← Entry point: wraps app in BrowserRouter,
        │                                     HelmetProvider, AuthProvider, CartProvider,
        │                                     WishlistProvider, Toaster
        │
        ├── App.jsx                        ← All 14 route definitions with ProtectedRoute
        │                                     wrapper for authenticated pages
        │
        ├── services/
        │   └── api.js                     ← Axios instance with:
        │                                     • JWT request interceptor (attaches Bearer token)
        │                                     • 401 response interceptor (auto-refresh token)
        │                                     • authAPI, productsAPI, categoriesAPI,
        │                                       locationsAPI, cartAPI, ordersAPI,
        │                                       paymentsAPI, wishlistAPI, bannersAPI
        │
        ├── context/
        │   └── AppContext.jsx             ← AuthContext (user, login, register, logout)
        │                                     CartContext (cart state, addToCart,
        │                                       updateItem, removeItem, clearCart)
        │                                     WishlistContext (wishlist, toggleWishlist,
        │                                       isInWishlist)
        │                                     Exports: useAuth, useCart, useWishlist hooks
        │
        ├── components/
        │   │
        │   ├── layout/
        │   │   ├── Layout.jsx             ← Root shell: <Navbar> + <Outlet> + <Footer>
        │   │   │
        │   │   ├── Navbar.jsx             ← Topbar (contact info + locations)
        │   │   │                             Sticky main nav (logo, links, search, icons)
        │   │   │                             User dropdown (profile/orders/wishlist/logout)
        │   │   │                             Cart badge with item count
        │   │   │                             Hamburger button for mobile
        │   │   │                             Mobile sidebar (slide-in with overlay)
        │   │   │                             Mobile search form in sidebar
        │   │   │
        │   │   └── Footer.jsx             ← Trust bar (4 badges: delivery/returns/quality/pickup)
        │   │                                 Newsletter signup form
        │   │                                 4-column footer grid (brand/links/support/showrooms)
        │   │                                 Social links + payment methods
        │   │
        │   ├── common/
        │   │   └── ProtectedRoute.jsx     ← ProtectedRoute (redirects to /login if no JWT)
        │   │                                 SkeletonCard, SkeletonGrid (loading placeholders)
        │   │                                 Breadcrumb (with home + dynamic items)
        │   │                                 Pagination (smart page number list)
        │   │                                 StarRating (full/half/empty stars)
        │   │                                 EmptyState (icon + title + message + children)
        │   │
        │   └── product/
        │       └── ProductCard.jsx        ← Product card with:
        │                                     • Lazy-loaded image with fallback placeholder
        │                                     • New/Sale/BestSeller/SoldOut badges
        │                                     • Hover: wishlist + quick-view action buttons
        │                                     • Category label, product name, price display
        │                                     • Sale price + discount % badge
        │                                     • Star rating + review count
        │                                     • "50% Deposit" payment badge
        │                                     • Add to Cart button (disabled if sold out)
        │
        ├── pages/
        │   │
        │   ├── HomePage.jsx               ← Auto-advancing hero slider (3 slides, 5s interval)
        │   │                                 3-column category grid with hover effects
        │   │                                 New Arrivals section (4 products)
        │   │                                 Inspiration split-layout section
        │   │                                 Best Sellers section (4 products)
        │   │                                 3-column customer review cards
        │   │
        │   ├── ProductListPage.jsx        ← Left sidebar filters:
        │   │                                 • Categories (radio with product count)
        │   │                                 • Price range (min/max inputs)
        │   │                                 • Availability (in stock toggle)
        │   │                                 • Collections (new arrivals, best sellers)
        │   │                                 Right: results count + sort select + product grid
        │   │                                 URL-synced filters (all params in query string)
        │   │                                 Pagination component
        │   │
        │   ├── ProductDetailPage.jsx      ← Image gallery (main + thumbnails)
        │   │                                 Product name, category, star rating, view count
        │   │                                 Price (with sale price + discount %)
        │   │                                 Availability status
        │   │                                 Variant selector (bed sizes etc.)
        │   │                                 Quantity stepper
        │   │                                 Add to Cart + Wishlist toggle buttons
        │   │                                 Payment info box (50% deposit details + default policy)
        │   │                                 Delivery fee calculator (county dropdown)
        │   │                                 Product meta (dimensions, materials, SKU)
        │   │                                 Product description tab
        │   │                                 Approved customer reviews
        │   │                                 Related products grid
        │   │
        │   ├── CategoryPage.jsx           ← Green gradient hero banner with category icon
        │   │                                 Product count display
        │   │                                 Price range filter sidebar
        │   │                                 Subcategory links sidebar
        │   │                                 Filtered product grid + sort
        │   │                                 Pagination
        │   │
        │   ├── SearchResultsPage.jsx      ← Category filter sidebar
        │   │                                 Price range filter with quick-select ranges
        │   │                                 Results toolbar (count + sort)
        │   │                                 Empty state with quick-search suggestions
        │   │                                 Product grid + pagination
        │   │
        │   ├── CartPage.jsx               ← Cart items (image + name + variant + qty stepper)
        │   │                                 Remove item button
        │   │                                 Half-payment indicator per item
        │   │                                 Order summary sidebar (sticky)
        │   │                                 Payment method icons
        │   │                                 Proceed to Checkout button
        │   │
        │   ├── CheckoutPage.jsx           ← Step 1 — Delivery Details:
        │   │                                 • Home Delivery vs In-Store Pickup cards
        │   │                                 • County select (with delivery fee shown)
        │   │                                 • Address/City/Phone/Notes form
        │   │                                 • OR pickup station selection
        │   │                                 • Payment mode: Full vs 50% Deposit
        │   │                                   (disabled for full-only products)
        │   │                                 Step 2 — M-Pesa Payment:
        │   │                                 • Order summary card (number + amount due)
        │   │                                 • M-Pesa phone input
        │   │                                 • "Pay Now" button → STK Push
        │   │                                 • Waiting animation while polling status
        │   │                                 • Auto-redirect to order detail on success
        │   │
        │   ├── OrdersPage.jsx             ← Order cards with:
        │   │                                 • Order number + date
        │   │                                 • Status badge (colour-coded)
        │   │                                 • Item thumbnails preview
        │   │                                 • Total + amount paid
        │   │                                 • Balance due warning for half_paid orders
        │   │                                 • "View Details" link
        │   │
        │   ├── OrderDetailPage.jsx        ← Order number + status badge
        │   │                                 Items table (name, variant, qty, unit price, subtotal)
        │   │                                 Per-item upfront/balance breakdown for half-payment
        │   │                                 Delivery info grid (method, county, address, phone)
        │   │                                 Balance payment form (for half_paid orders)
        │   │                                 Order summary sidebar (subtotal/delivery/total/paid/due)
        │   │
        │   ├── ProfilePage.jsx            ← Avatar initials display
        │   │                                 Sidebar nav (Profile / Security / Orders / Wishlist)
        │   │                                 Profile tab: edit name, phone, county, city, address
        │   │                                 Security tab: password change info
        │   │
        │   ├── WishlistPage.jsx           ← Product grid of saved items
        │   │                                 Empty state with browse CTA
        │   │
        │   ├── LoginPage.jsx              ← Email + password form
        │   │                                 Show/hide password toggle
        │   │                                 Redirects to previous page after login
        │   │                                 Link to register
        │   │
        │   └── RegisterPage.jsx           ← First/last name, email, username, phone,
        │                                     password + confirm (live mismatch validation)
        │                                     Show/hide password toggle
        │                                     Link to login
        │
        └── styles/
            └── main.css                   ← CSS custom properties (design tokens)
                                              Typography (Playfair Display + DM Sans)
                                              Utility classes (container, sr-only)
                                              Button variants (primary, accent, outline, light)
                                              Topbar, Navbar, Mobile Sidebar
                                              Hero Slider
                                              Category Grid
                                              Section headers + View All links
                                              Product Card (with hover animations)
                                              Product Detail layout
                                              Breadcrumb, Pagination, StarRating
                                              Cart layout + items
                                              Checkout steps + delivery options
                                              Payment mode options
                                              Orders list + status badges
                                              Search results + filter sidebar
                                              Auth pages (centered card)
                                              Trust bar, Newsletter, Footer
                                              Skeleton loading animations
                                              Empty states
                                              Fully responsive (1100px, 900px, 768px, 480px)
```

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| Django | 4.2.16 | Web framework |
| djangorestframework | 3.15.2 | REST API |
| djangorestframework-simplejwt | 5.3.1 | JWT authentication |
| django-cors-headers | 4.4.0 | CORS for React dev server |
| django-filter | 24.3 | QuerySet filtering |
| Pillow | 10.4.0 | Image uploads |
| requests | 2.32.3 | M-Pesa Daraja HTTP calls |
| gunicorn | 22.0.0 | Production WSGI server |
| psycopg2-binary | 2.9.9 | PostgreSQL adapter (production) |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.2 | UI library |
| react-dom | 18.2 | DOM rendering |
| react-router-dom | 6.23 | Client-side routing with slug-based URLs |
| axios | 1.7 | HTTP client + JWT interceptors |
| react-hot-toast | 2.4 | Toast notifications |
| react-helmet-async | 2.0 | Per-page SEO meta tags |
| @tanstack/react-query | 5.40 | Server state management |
| swiper | 11.1 | Slider component |
| vite | 5.2 | Build tool with HMR |
| bootstrap-icons | 1.11.3 | 2000+ icon library (CDN) |

---

## 🐍 Backend — Django Setup

### Step 1: Create and activate virtual environment
```bash
cd backend

# Linux / macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

### Step 2: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Apply database migrations
```bash
# Run in this exact order (dependencies between apps)
python manage.py makemigrations users
python manage.py makemigrations core
python manage.py makemigrations orders
python manage.py makemigrations payments
python manage.py migrate
```

### Step 4: Seed initial reference data
```bash
python manage.py seed_data
```

### Step 5: Create admin superuser
```bash
python manage.py createsuperuser
```

### Step 6: Start development server
```bash
python manage.py runserver
```

| URL | Description |
|-----|-------------|
| `http://localhost:8000/api/` | REST API root |
| `http://localhost:8000/admin/` | Django admin panel |

---

## ⚛️ Frontend — React Setup

### Step 1: Install dependencies
```bash
cd frontend
npm install
```

### Step 2: Create environment file
```bash
# Create frontend/.env
echo "VITE_API_URL=http://localhost:8000/api" > .env
```

### Step 3: Start development server
```bash
npm run dev
```

Frontend runs at: `http://localhost:5173`

The Vite config proxies all `/api/*` requests to `http://localhost:8000` automatically.

### Step 4: Build for production
```bash
npm run build
# Output: frontend/dist/
```

---

## 🔐 Environment Variables

### Backend — `backend/.env`
```env
SECRET_KEY=your-very-long-random-secret-key-here
DEBUG=True

# Database (SQLite used by default in dev)
# DATABASE_URL=postgres://morara_user:password@localhost:5432/morara_furniture

# M-Pesa Daraja API
MPESA_DEBUG=True                              # True = sandbox, no real money
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379                        # Paybill or Till number
MPESA_PASSKEY=your_lipa_na_mpesa_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback/

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=info@morarafurniture.co.ke
EMAIL_HOST_PASSWORD=your_app_password
```

### Frontend — `frontend/.env`
```env
VITE_API_URL=http://localhost:8000/api
```

---

## 🗄️ Database Models

### `core` App Models

#### `Category`
| Field | Type | Details |
|-------|------|---------|
| id | AutoField | PK |
| name | CharField(200) | e.g. "Bedroom Sets" |
| slug | SlugField | Auto-generated, unique |
| description | TextField | Optional |
| image | ImageField | Category banner image |
| icon | CharField(100) | Bootstrap icon class |
| parent | FK(self, null) | Enables subcategories |
| is_active | BooleanField | Default True |
| sort_order | PositiveIntegerField | Display order |

#### `County`
| Field | Type | Details |
|-------|------|---------|
| id | AutoField | PK |
| name | CharField(100) | e.g. "Nairobi" — unique |
| slug | SlugField | Auto-generated |
| base_delivery_fee | DecimalField | County delivery surcharge in KSh |
| region | CharField(100) | e.g. "Central", "Coast" |
| is_active | BooleanField | |

#### `PickupStation`
| Field | Type | Details |
|-------|------|---------|
| id | AutoField | PK |
| name | CharField(200) | e.g. "Nairobi Showroom \| HQ" |
| slug | SlugField | Unique |
| address | TextField | Full street address |
| county | FK(County) | |
| phone | CharField | |
| whatsapp | CharField | |
| email | EmailField | |
| pickup_fee | DecimalField | 0 = free pickup |
| opening_hours | CharField | e.g. "Mon-Sat 8am-6pm" |

#### `Product`
| Field | Type | Details |
|-------|------|---------|
| id | UUIDField | PK, auto-generated |
| name | CharField(300) | |
| slug | SlugField(350) | Auto-generated unique slug, SEO-friendly |
| category | FK(Category) | |
| description | TextField | Full HTML-safe description |
| short_description | CharField(500) | Used in listing cards |
| price | DecimalField | Original/base price |
| sale_price | DecimalField | Optional discounted price |
| base_delivery_fee | DecimalField | Per-product delivery base (KSh) |
| payment_type | CharField | `full` \| `half` \| `installment` |
| refund_percentage_on_default | PositiveIntegerField | Default 25% — refund if deposit customer defaults |
| materials | M2M(Material) | |
| colors | M2M(Color) | |
| weight_kg | DecimalField | Optional |
| dimensions | CharField(200) | e.g. "200 x 160 x 40 cm" |
| stock_quantity | PositiveIntegerField | |
| is_in_stock | BooleanField | |
| sku | CharField | Unique stock-keeping unit |
| is_active | BooleanField | |
| is_featured | BooleanField | |
| is_new_arrival | BooleanField | |
| is_best_seller | BooleanField | |
| meta_title | CharField(200) | Auto-generated if blank |
| meta_description | CharField(500) | Auto-generated if blank |
| meta_keywords | CharField(500) | |
| average_rating | DecimalField | Computed from approved reviews |
| review_count | PositiveIntegerField | |
| views_count | PositiveIntegerField | Auto-incremented on product detail requests |
| created_at | DateTimeField | |
| updated_at | DateTimeField | |

**Computed Properties:**
- `effective_price` — sale_price if set, otherwise price
- `discount_percentage` — % off vs original price
- `upfront_payment_amount` — 50% for half-payment products
- `get_delivery_fee_for_county(county_slug)` — calculates total delivery fee

#### `ProductVariant`
| Field | Type | Details |
|-------|------|---------|
| product | FK(Product) | |
| name | CharField(200) | e.g. "4x6 By 3.5x6", "5x6 Standard" |
| price_adjustment | DecimalField | +/- from base price |
| stock_quantity | PositiveIntegerField | |
| is_available | BooleanField | |
| sku | CharField | |

#### `ProductImage`
| Field | Type | Details |
|-------|------|---------|
| product | FK(Product) | |
| image | ImageField | Stored in `media/products/` |
| alt_text | CharField | SEO alt text |
| is_primary | BooleanField | Used in listing card |
| sort_order | PositiveIntegerField | |

#### `Review`
| Field | Type | Details |
|-------|------|---------|
| product | FK(Product) | |
| user | FK(User) | unique_together with product |
| rating | PositiveIntegerField | 1–5 |
| title | CharField | |
| body | TextField | |
| is_verified_purchase | BooleanField | |
| is_approved | BooleanField | Admin must approve before display |

#### `Banner`
| Field | Type | Details |
|-------|------|---------|
| title | CharField | |
| subtitle | CharField | |
| image | ImageField | |
| link_url | CharField | e.g. "/shop" or "/category/bedroom-sets" |
| position | CharField | `hero` \| `promo` \| `category` |
| is_active | BooleanField | |
| sort_order | PositiveIntegerField | |

#### `Wishlist`
| Field | Type | Details |
|-------|------|---------|
| user | OneToOne(User) | One wishlist per user |
| products | M2M(Product) | |

---

### `orders` App Models

#### `Cart`
| Field | Type | Details |
|-------|------|---------|
| id | UUIDField | PK |
| user | OneToOne(User, null) | OneToOne so one cart per user |
| session_key | CharField | For future anonymous cart support |
| created_at | DateTimeField | |

**Computed:** `total`, `item_count`

#### `CartItem`
| Field | Type | Details |
|-------|------|---------|
| cart | FK(Cart) | |
| product | FK(Product) | |
| variant | FK(ProductVariant, null) | |
| quantity | PositiveIntegerField | |
| unique_together | (cart, product, variant) | Prevents duplicates |

**Computed:** `unit_price`, `subtotal`

#### `Order`
| Field | Type | Details |
|-------|------|---------|
| id | UUIDField | PK |
| order_number | CharField(20) | Auto: "MMF" + 8 random digits |
| user | FK(User) | |
| status | CharField | 11 possible statuses (see above) |
| delivery_type | CharField | `home` \| `pickup` |
| county | FK(County, null) | For home delivery |
| pickup_station | FK(PickupStation, null) | For pickup |
| delivery_address | TextField | |
| delivery_city | CharField | |
| delivery_phone | CharField | |
| delivery_notes | TextField | |
| subtotal | DecimalField | Sum of all OrderItem subtotals |
| delivery_fee | DecimalField | Calculated at order creation |
| total_amount | DecimalField | subtotal + delivery_fee |
| amount_paid | DecimalField | Running total of confirmed payments |
| balance_due | DecimalField | total_amount - amount_paid |
| balance_on_delivery | DecimalField | For half-payment: owed on delivery |
| payment_mode | CharField | `full` \| `half` |
| customer_notes | TextField | |
| admin_notes | TextField | |
| created_at | DateTimeField | |
| updated_at | DateTimeField | |

#### `OrderItem`
| Field | Type | Details |
|-------|------|---------|
| order | FK(Order) | |
| product | FK(Product) | |
| variant | FK(ProductVariant, null) | |
| product_name | CharField | **Snapshot** — price won't change if product edited |
| variant_name | CharField | Snapshot |
| quantity | PositiveIntegerField | |
| unit_price | DecimalField | Snapshot at time of order |
| delivery_fee | DecimalField | Per-item delivery fee snapshot |
| payment_type | CharField | Snapshot |
| upfront_amount | DecimalField | What was paid for this item |
| balance_on_delivery | DecimalField | What's owed for this item on delivery |

---

### `payments` App Models

#### `Payment`
| Field | Type | Details |
|-------|------|---------|
| id | UUIDField | PK |
| order | FK(Order) | |
| user | FK(User) | |
| method | CharField | `mpesa` \| `cash` \| `bank` |
| purpose | CharField | `full` \| `deposit` \| `balance` |
| status | CharField | `pending` → `processing` → `completed` / `failed` |
| amount | DecimalField | Exact amount charged |
| phone_number | CharField | M-Pesa number |
| mpesa_checkout_request_id | CharField | From STK Push response |
| mpesa_merchant_request_id | CharField | |
| mpesa_transaction_id | CharField | Internal Safaricom ID |
| mpesa_receipt_number | CharField | e.g. "PGV6XXXXX" — customer's proof |
| mpesa_result_code | IntegerField | 0 = success, non-0 = failure |
| mpesa_result_desc | CharField | Failure reason text |
| mpesa_raw_response | JSONField | Full callback payload stored for audit |
| created_at | DateTimeField | |
| updated_at | DateTimeField | |

---

### `users` App Models

#### `User` (extends AbstractUser)
| Field | Type | Details |
|-------|------|---------|
| email | EmailField | **Unique** — used as `USERNAME_FIELD` |
| phone | CharField | e.g. "0712345678" |
| city | CharField | e.g. "Nairobi" |
| county | FK(County, null) | Default delivery county |
| address | TextField | Default delivery address |
| profile_picture | ImageField | Optional |
| is_email_verified | BooleanField | For future email verification |
| created_at | DateTimeField | |

---

## 🌐 API Endpoints Reference

All endpoints prefixed with `/api/`. JWT token sent as `Authorization: Bearer <token>`.

### 🔐 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `users/register/` | None | `{email, username, first_name, last_name, password, confirm_password, phone}` → JWT tokens |
| POST | `users/login/` | None | `{email, password}` → `{user, access, refresh}` |
| GET | `users/profile/` | ✅ JWT | Returns current user object |
| PATCH | `users/profile/` | ✅ JWT | Update `{first_name, last_name, phone, city, county, address}` |
| POST | `users/token/refresh/` | Refresh token | `{refresh}` → `{access}` |

### 🪑 Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `core/products/` | None | Paginated list. Params: `category`, `min_price`, `max_price`, `in_stock`, `is_new_arrival`, `is_best_seller`, `is_featured`, `payment_type`, `search`, `ordering`, `page` |
| GET | `core/products/{slug}/` | None | Full detail: images, variants, approved reviews, delivery info |
| GET | `core/products/featured/` | None | Max 8 featured products |
| GET | `core/products/new_arrivals/` | None | Max 8 newest |
| GET | `core/products/best_sellers/` | None | Max 8 best sellers |
| GET | `core/products/search/?q=sofa` | None | Full-text search across name, description, category |
| GET | `core/products/{slug}/delivery_fee/?delivery_type=home&county_slug=nakuru` | None | `{fee, note}` |
| POST | `core/products/{slug}/add_review/` | ✅ JWT | `{rating, title, body}` |

### 📂 Categories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `core/categories/` | None | Root categories with subcategories + product counts |
| GET | `core/categories/{slug}/` | None | Category detail |
| GET | `core/categories/{slug}/products/` | None | Products in this category including subcategories |

### 🗺️ Locations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `core/counties/` | None | All 33 counties with `base_delivery_fee` |
| GET | `core/pickup-stations/` | None | All 3 stations with fees and hours |

### ❤️ Wishlist
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `core/wishlist/` | ✅ JWT | `{id, products: [...]}` |
| POST | `core/wishlist/add/` | ✅ JWT | `{product_id}` |
| POST | `core/wishlist/remove/` | ✅ JWT | `{product_id}` |

### 🛒 Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `orders/cart/` | ✅ JWT | `{id, items, total, item_count}` |
| POST | `orders/cart/add/` | ✅ JWT | `{product_id, variant_id?, quantity}` |
| POST | `orders/cart/update_item/` | ✅ JWT | `{item_id, quantity}` — 0 removes item |
| POST | `orders/cart/remove_item/` | ✅ JWT | `{item_id}` |
| POST | `orders/cart/clear/` | ✅ JWT | Empties the cart |

### 📦 Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `orders/orders/` | ✅ JWT | User's order history |
| POST | `orders/orders/` | ✅ JWT | Create order from cart (atomic transaction) |
| GET | `orders/orders/{id}/` | ✅ JWT | Order detail with items |
| POST | `orders/orders/{id}/cancel/` | ✅ JWT | Cancel if `pending` or `half_paid` |

**Create Order Payload (home delivery):**
```json
{
  "delivery_type": "home",
  "county_id": 1,
  "delivery_address": "123 Thika Road, Kasarani",
  "delivery_city": "Nairobi",
  "delivery_phone": "0712345678",
  "delivery_notes": "Call before delivery",
  "payment_mode": "half",
  "customer_notes": "Please wrap carefully"
}
```

**Create Order Payload (pickup):**
```json
{
  "delivery_type": "pickup",
  "pickup_station_id": 1,
  "payment_mode": "full"
}
```

### 💳 Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `payments/initiate/` | ✅ JWT | Initiates STK Push |
| POST | `payments/mpesa/callback/` | None | Safaricom webhook (AllowAny) |
| GET | `payments/status/{payment_id}/` | ✅ JWT | Poll for `completed` / `failed` |

**Initiate Payment Payload:**
```json
{
  "order_id": "uuid-here",
  "phone_number": "0712345678",
  "payment_purpose": "full"
}
```
`payment_purpose`: `full` | `deposit` (50%) | `balance` (remaining)

---

## 💳 M-Pesa Integration Guide

### STK Push Flow
```
1. Customer clicks "Pay Now via M-Pesa"
2. Frontend POST /api/payments/initiate/ → { phone_number, order_id, payment_purpose }
3. Backend fetches OAuth token from Safaricom
4. Backend sends STK Push request to Safaricom Daraja API
5. Safaricom sends push notification to customer's phone
6. Customer enters their M-Pesa PIN
7. Safaricom sends result to POST /api/payments/mpesa/callback/
8. Backend updates Payment status → updates Order status
9. Frontend polls GET /api/payments/status/{id}/ every 5 seconds
10. Frontend redirects to /orders/{id} on success
```

### Debug Mode (`MPESA_DEBUG = True`)
- No real Safaricom API calls made
- Payment immediately marked `completed`
- Order immediately marked `paid` or `half_paid`
- Response includes `"debug_mode": true, "message": "DEBUG MODE: Payment simulated"`
- Safe for all development and testing scenarios

### Production Credentials
1. Visit [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create account → Create App → Select "Lipa Na M-Pesa Online"
3. Copy **Consumer Key**, **Consumer Secret**, **Passkey**
4. Set `MPESA_DEBUG = False`
5. Configure public HTTPS callback URL (use ngrok for local: `ngrok http 8000`)
6. Whitelist callback URL in Safaricom portal

### Phone Number Handling
Numbers are normalized automatically:
```
0712345678     →  254712345678
+254712345678  →  254712345678
254712345678   →  254712345678 (unchanged)
```

---

## 🚚 Delivery Fee Business Logic

### Calculation Formula
```
Total Delivery Fee = Product Base Delivery Fee + Destination County Surcharge
```

### Example Calculation
Customer in Mombasa orders a Double Decker Bed (product base fee: KSh 400):
```
KSh 400 (product base) + KSh 1,200 (Mombasa county surcharge) = KSh 1,600 total
```

### Multi-Item Orders
Delivery fees are summed across all items. If you order 3 products, each product's base fee + county surcharge is added.

### County Surcharge Rates (seeded)
| Region | County | Surcharge |
|--------|--------|-----------|
| Nairobi | Nairobi | KSh 300 |
| Central | Kiambu | KSh 400 |
| Central | Kirinyaga | KSh 650 |
| Central | Nyeri | KSh 700 |
| Rift Valley | Nakuru | KSh 700 |
| Eastern | Machakos | KSh 600 |
| Eastern | Meru | KSh 800 |
| Coast | Mombasa | KSh 1,200 |
| Coast | Kilifi | KSh 1,300 |
| Western | Kisumu | KSh 900 |
| North Eastern | Garissa | KSh 1,800 |
| North Eastern | Mandera | KSh 2,200 |

*(All 33 counties seeded — see `seed_data.py` for full list)*

### Pickup Stations
All 3 showrooms: `pickup_fee = 0` (completely free).

### Live Calculator
Product detail page has a county selector. Selecting a county calls:
```
GET /api/core/products/{slug}/delivery_fee/?delivery_type=home&county_slug=mombasa
→ { "fee": 1600, "county": "Mombasa", "note": "Estimated delivery fee..." }
```

---

## 💰 Payment Policy Logic

### Full Payment (`payment_type = "full"`)
- 100% of price paid upfront via M-Pesa
- Order confirmed immediately after payment
- Not eligible for 50% deposit mode at checkout

### Half Payment / 50% Deposit (`payment_type = "half"`)
- Customer pays 50% upfront to confirm order
- Remaining 50% paid on delivery
- System tracks `balance_on_delivery` field on Order
- Order status: `half_paid` → `delivered` → `completed`

### Default Policy (Customer Refuses Delivery Balance)
If a `half_paid` customer refuses or cannot pay the balance on delivery:
- Only **25% of the total price** is refunded (stored as `refund_percentage_on_default = 25`)
- **Not** the 50% they paid — only a quarter of the total
- This policy is displayed in 3 places in the UI:
  1. Product detail page → payment info box
  2. Checkout → 50% deposit option description
  3. Order detail page → balance due warning

### Example with KSh 80,000 Solid Bed
| Scenario | Total | Paid Upfront | Due on Delivery | Refund if Default |
|----------|-------|-------------|-----------------|-------------------|
| Full payment | KSh 80,000 | KSh 80,000 | KSh 0 | N/A |
| 50% deposit | KSh 80,000 | KSh 40,000 | KSh 40,000 | KSh 20,000 (25%) |

---

## 🖥️ Frontend Pages & Routes

| Route | Component | Auth | Key Features |
|-------|-----------|------|-------------|
| `/` | HomePage | No | Hero slider (auto 5s), category grid, new arrivals, inspiration section, best sellers, customer reviews |
| `/shop` | ProductListPage | No | Sidebar filters (category, price, stock, collections), sort dropdown, URL-synced params, pagination |
| `/products/:slug` | ProductDetailPage | No | Image gallery, variants, qty stepper, delivery fee calculator, payment policy box, reviews, related products |
| `/category/:slug` | CategoryPage | No | Hero banner with icon, price range filters, sort, product grid, pagination |
| `/search?q=...` | SearchResultsPage | No | Category + price filters, sort, empty state with suggestions, pagination |
| `/login` | LoginPage | No | Email/password, show/hide toggle, redirect to intended page after login |
| `/register` | RegisterPage | No | Full form, live password match validation |
| `/cart` | CartPage | ✅ | Item qty controls, remove, half-payment indicators, sticky summary sidebar |
| `/checkout` | CheckoutPage | ✅ | 2-step: delivery form + M-Pesa STK Push with 5s polling |
| `/orders` | OrdersPage | ✅ | Order cards with status badges, balance warnings |
| `/orders/:id` | OrderDetailPage | ✅ | Full order info, balance payment form for half-paid orders |
| `/profile` | ProfilePage | ✅ | Tabbed: profile edit + security + quick links |
| `/wishlist` | WishlistPage | ✅ | Product grid with toggle-remove |

---

## 🔍 SEO Architecture

### Site-Level (`index.html`)
- `<title>` — keyword-rich primary title
- `<meta name="description">` — 155-char summary
- `<meta name="keywords">` — furniture Kenya terms
- `<link rel="canonical">` — prevents duplicate content
- Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:site_name`, `og:locale`
- Twitter Card: `summary_large_image`
- JSON-LD Structured Data: `@type: FurnitureStore` with address, phone, hours, currency

### Per-Page (React Helmet Async)
Every page sets its own meta dynamically:
```jsx
<Helmet>
  <title>Double Decker 4x6 Bed | Morara Modern Furniture Kenya</title>
  <meta name="description" content="Buy Double Decker 4x6 bed in Kenya..." />
  <meta name="keywords" content="double decker bed, 4x6 bed Kenya..." />
</Helmet>
```

### Product-Level SEO Fields
```
slug              → auto-generated from name: "double-decker-4x6-by-3-5x6"
meta_title        → auto: "{name} - Morara Modern Furniture Kenya"
meta_description  → auto: first 150 chars of short_description
meta_keywords     → manually set in admin
```

### Slug Uniqueness
If a slug conflict occurs (two products with same name), the system automatically appends `-1`, `-2`, etc.:
```python
slug = "mahogany-bed"      # taken
slug = "mahogany-bed-1"    # auto-generated
```

### Robots Control
Pages that shouldn't be indexed use `noindex`:
```
/login, /register, /profile, /cart, /checkout, /orders, /wishlist, /search
```

---

## 🛠️ Admin Panel Guide

### Adding Your First Product
```
1. Admin → Core → Materials    → Add: Mahogany, Oak, MDF, Leather, Fabric
2. Admin → Core → Colors       → Add: Brown (#8B4513), Black (#000000), etc.
3. Admin → Core → Categories   → Verify seed categories exist
4. Admin → Core → Products     → Click "Add Product" → fill all fields:
   - Basic: name, category, description, short description
   - Pricing: price, sale_price (optional), base_delivery_fee
   - Payment: payment_type (full or half), refund_percentage_on_default
   - Attributes: materials, colors, dimensions
   - Inventory: stock_quantity, is_in_stock
   - Flags: is_active ✓, is_new_arrival, is_best_seller, is_featured
   - Images: upload 3-5 photos, mark one as primary
   - Variants: add size options (e.g., "4x6", "5x6", "6x6") with price adjustments
   - SEO: leave blank for auto-generation, or fill manually
5. Save → product appears on website immediately
```

### Order Management Workflow
```
Customer places order  →  status: pending
Payment confirmed      →  status: paid (or half_paid)
Admin processes        →  status: processing
Ready for dispatch     →  status: ready
Loaded on truck        →  status: out_for_delivery
Delivered              →  status: delivered
Customer confirms      →  status: completed
```

### Approving Reviews
Reviews are hidden by default. Go to:
**Core → Reviews** → check `is_approved` → Save
Only approved reviews show on product pages.

---

## 🌱 Seeding Initial Data

```bash
python manage.py seed_data
```

Creates:
- **33 Kenyan counties** with delivery fee rates
- **3 pickup stations** (Nairobi, Nyeri, Nakuru)
- **7 product categories**
- **9 material types**
- **6 color options**

Safe to run multiple times — uses `get_or_create` so no duplicates.

---

## 🚀 Production Deployment

### Backend (Ubuntu + Gunicorn + Nginx)

```bash
# Clone and setup
git clone https://github.com/yourusername/morara-furniture.git
cd morara-furniture/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env  # fill in production values
# Set DEBUG=False, SECRET_KEY=long_random_key, MPESA_DEBUG=False

# Prepare
python manage.py migrate
python manage.py seed_data
python manage.py collectstatic --no-input
python manage.py createsuperuser

# Run with Gunicorn
gunicorn morara_furniture.wsgi:application \
  --workers 3 \
  --bind unix:/run/morara.sock \
  --access-logfile /var/log/morara/access.log
```

**Systemd service** (`/etc/systemd/system/morara.service`):
```ini
[Unit]
Description=Morara Furniture Gunicorn
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/morara/backend
ExecStart=/var/www/morara/backend/venv/bin/gunicorn \
          --workers 3 \
          --bind unix:/run/morara.sock \
          morara_furniture.wsgi:application
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

**Nginx config:**
```nginx
server {
    listen 80;
    server_name api.morarafurniture.co.ke;

    client_max_body_size 20M;

    location /media/ { alias /var/www/morara/media/; }
    location /static/ { alias /var/www/morara/staticfiles/; }

    location / {
        include proxy_params;
        proxy_pass http://unix:/run/morara.sock;
    }
}
```

### Frontend (Nginx SPA)

```bash
cd frontend
npm install && npm run build

# Copy to server
rsync -av dist/ root@yourserver:/var/www/morara-frontend/
```

**Nginx for React SPA:**
```nginx
server {
    listen 80;
    server_name morarafurniture.co.ke www.morarafurniture.co.ke;
    root /var/www/morara-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### Production Database (PostgreSQL)
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'morara_furniture_db',
        'USER': 'morara_user',
        'PASSWORD': 'strong_password_here',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### SSL (Let's Encrypt)
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d morarafurniture.co.ke -d api.morarafurniture.co.ke
```

---

## 🏪 Showroom Contacts

| Location | Address | Phone | WhatsApp | Email |
|----------|---------|-------|----------|-------|
| **Nairobi HQ** | Ruiru, Behind Spur Mall | +254 748 486829 | +254 716 335555 | info@morarafurniture.co.ke |
| **Nyeri Showroom** | Nyeri Town Center | +254 706 210310 | +254 716 335555 | nyeri@morarafurniture.co.ke |
| **Nakuru Showroom** | Nakuru Town | +254 769 099099 | +254 716 335555 | nakuru@morarafurniture.co.ke |

**Opening Hours:**
- Monday – Saturday: 8:00 AM – 6:00 PM
- Sunday: 10:00 AM – 4:00 PM (Nairobi only)

---

## 📄 File Count Summary

| Location | Files | Description |
|----------|-------|-------------|
| `backend/` | 28 | Django apps, config, management command |
| `frontend/src/` | 22 | React components, pages, contexts, services |
| `frontend/` | 4 | index.html, package.json, vite.config.js, .env |
| Root | 1 | README.md |
| **Total** | **55** | Complete full-stack project |

---

*Built with ❤️ for quality Kenyan homes — Morara Modern Furniture*