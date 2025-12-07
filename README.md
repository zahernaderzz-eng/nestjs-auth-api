# 🛒 Single-Vendor E-Commerce API (NestJS)

A fully-featured, production-ready **Single Vendor E-Commerce REST API** built using **NestJS + TypeScript**, following a clean modular architecture with authentication, authorization, multi-module structure, OTP system, queue-based email sending, and full e-commerce features.



## 📌 **Features Overview**

### 🔐 Authentication & Security
- Email/password signup + login  
- OTP verification via email  
- Resend OTP  
- Forgot password + reset using secure token  
- Change password  
- JWT Access + Refresh tokens  
- Role-based access control (RBAC)  
- Account verification status  
- Secure guards & decorators  

### 👤 User Management
- User profiles  
- Account status management  
- Role linking  
- FCM token storage (mobile notifications)

### 🛍️ Product & Store Modules
- Product CRUD  
- Product images via Cloudinary  
- Categories module  
- Reviews & ratings  
- Followers (user can follow products)

### 🛒 Cart & Orders
- Add/remove from cart  
- Auto-calculated totals  
- Create orders  
- Order status tracking  

### 💳 Payment Module
- Payment records  
- Link payments with orders  

### ✉️ Notifications
- Email notifications (OTP, reset password…)  
- Push notifications via Firebase FCM  

### ⚙️ Infrastructure
- BullMQ email queue  
- Cloudinary media upload  
- Config module  
- Centralized response handlers  



## 📁 **Project Structure**

The project follows a clean, modular, scalable architecture.

src/
├── auth/ → Auth, OTP, tokens, guards
├── user/ → Users, profile, roles
├── roles/ → Roles, permissions
├── otp/ → OTP generation & validation
├── mail/ → Email sending (BullMQ)
├── products/ → Product CRUD & images
├── categories/ → Category module
├── cart/ → Shopping cart
├── orders/ → Orders & status
├── payment/ → Payment records
├── followers/ → Product followers
├── reviews/ → Product reviews
├── notification/ → Push & email notifications
├── fcm-token/ → Device tokens for FCM
├── cloudinary/ → Upload provider
├── guards/ → Auth guards
├── decorators/ → Custom decorators
├── config/ → App & env config
├── infrastructure/ → Shared low-level utilities
├── response/ → Standard API response builder
└── seeds/ → Database seeders (roles, admin...)



## 🧬 **Authentication Flow**

1. **User signs up**
   - Password hashed using bcrypt
   - Default role = customer
   - OTP generated + sent via queue

2. **User verifies OTP**
   - Account becomes `VERIFIED`

3. **User logs in**
   - JWT access + refresh tokens returned

4. **Refresh token endpoint**  
   - Generates a new access token securely

5. **Forgot password**
   - Secure reset token generated + email sent

6. **Reset password**
   - Token validated → password updated

---

## 📨 **Email Queue (BullMQ)**

Emails are sent asynchronously using a queue:

- send-otp  
- password-reset  
- notification emails  

Prevents blocking Auth requests and ensures reliability.

---

## 🔧 **Tech Stack**

- **NestJS** (core framework)  
- **TypeScript**  
- **TypeORM**  
- **PostgreSQL  
- **JWT**  
- **BullMQ + Redis**  
- **Cloudinary**  
- **Firebase FCM**  
- **bcrypt**  
- **Swagger**  


