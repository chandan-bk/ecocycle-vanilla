# EcoCycle: E-Waste Pickup & Recycler Locator (Pure Vanilla Edition)

> **Zero-Build, Pure Web Version** built using **HTML5, Pure Custom CSS3, and Vanilla JavaScript (ES6+)**.  
> No Node.js, no Vite, no React, no Tailwind CLI required. Simply open `index.html` directly in any web browser!

---

## 🌟 Project Overview

**EcoCycle** is an end-to-end sustainable e-waste management portal developed for a 2nd-semester Computer Science & Engineering curriculum. It addresses the growing hazards of electronic waste by connecting citizens with verified recycling centers, offering doorstep pickup scheduling, calculating environmental impact metrics, and providing interactive educational quizzes.

This standalone edition is engineered using **100% pure web standards**, demonstrating core software engineering principles, asynchronous JavaScript, DOM manipulation, RESTful cloud backend integration, and responsive web design without depending on heavy modern build tools or node_modules.

---

## 🚀 Quick Start (Zero Installation Required)

### Method 1: Direct File Launch (Easiest)
1. Navigate to the project folder:
   ```
   ecocycle-vanilla/
   ```
2. **Double-click `index.html`** to open it in Chrome, Edge, Firefox, or Safari.

### Method 2: Local HTTP Server (Recommended for Map & CDN optimal caching)
If you have Python or VS Code:
- **VS Code**: Right-click `index.html` and choose **"Open with Live Server"**.
- **Python 3**:
  ```bash
  cd ecocycle-vanilla
  python -m http.server 3000
  ```
  Then open `http://localhost:3000` in your browser.

---

## 📁 Project Architecture & File Structure

```
ecocycle-vanilla/
├── index.html            # Landing page with hero banner, 3-step workflow, and impact stats
├── locator.html          # Interactive Leaflet map with Mandya & Bangalore city filters
├── schedule.html         # Doorstep pickup booking form with date validation & modal
├── my-pickups.html       # Customer portal for tracking booked requests by status
├── impact.html           # Real-time environmental metrics & interactive Chart.js graphs
├── awareness.html        # E-waste taxonomy, hazard guide & 5-question interactive quiz
├── login.html            # Sign In & Registration with User/Admin role toggle
├── admin.html            # Operations portal: pickup status manager & center CRUD
├── css/
│   └── style.css         # 100% custom CSS3 (CSS Variables, Flexbox, Grid, Modals, Tables)
├── js/
│   ├── config.js         # Supabase & EmailJS configuration
│   ├── auth.js           # Session manager, role-based route guard & navbar controller
│   ├── locator.js        # Leaflet map, marker popups, and Mandya/Bangalore camera fly-to
│   ├── schedule.js       # Pickup form handler with date validation & DB insertion
│   ├── my-pickups.js     # User pickup history with status tabs
│   ├── impact.js         # Dynamic calculations and Chart.js Doughnut & Bar charts
│   ├── awareness.js      # Quiz question engine with score calculator & explanations
│   ├── login.js          # Supabase Auth controller with demo passcode support
│   └── admin.js          # Admin dashboard: pickup status updater & center CRUD modal
└── README.md             # Complete project guide and viva documentation
```

---

## 🛠️ Tech Stack & Free-Tier Services

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Markup** | HTML5 Semantic Elements | Accessible, SEO-friendly layout (`<header>`, `<main>`, `<section>`, `<footer>`) |
| **Styling** | Custom CSS3 | Modern Emerald/Slate design, CSS variables, CSS Grid, Flexbox, custom media queries |
| **Logic** | Vanilla JavaScript (ES6+) | `async/await`, Fetch API, Event delegation, DOM manipulation |
| **Database & Auth** | Supabase (PostgreSQL) | Managed via official `@supabase/supabase-js` CDN |
| **Mapping Engine** | Leaflet.js + OpenStreetMap | 100% free tile layer and marker popups, zero API key required |
| **Visual Analytics** | Chart.js | Native responsive canvas charts via CDN |
| **Email Alerts** | EmailJS Browser SDK | Automated status update dispatch |

---

## 🔑 Key Features & Pages

### 1. Recycler Locator (`locator.html`)
- **Dual City Switching**: Panning between **Mandya** (`[12.5244, 76.8958]`) and **Bangalore** (`[12.9716, 77.5946]`) with smooth `map.flyTo()`.
- **Search & Category Filters**: Filter collection facilities by name, street address, or accepted items (Batteries, Laptops, Smartphones, etc.).
- **Interactive Pins**: Custom eco-green map markers with popups containing address and a direct Google Maps Directions link.

### 2. Doorstep Pickup Scheduling (`schedule.html`)
- Form validation preventing past dates (enforces `min = tomorrow`).
- Select e-waste category and quantity with custom notes.
- Secure direct insert into Supabase `pickups` table tied to the logged-in user's UUID.
- Confirmation modal with status preview.

### 3. Customer Tracking (`my-pickups.html`)
- Real-time tracking of personal scheduled pickups.
- Status badge filters: **All**, **Pending**, **Scheduled**, **Collected**, **Cancelled**.

### 4. Environmental Impact Analytics (`impact.html`)
- Computes estimated carbon offset based on scientific e-waste recycling metrics (~15 kg CO₂ saved per recycled device).
- Native Chart.js graphs:
  - **Doughnut Chart**: E-waste category breakdown.
  - **Bar Chart**: Monthly recycling progress.

### 5. Educational Awareness & Quiz (`awareness.html`)
- Educational breakdown of heavy metal hazards (Lead, Mercury, Cadmium, Lithium).
- 5-question interactive quiz testing student/citizen knowledge with instant feedback and score evaluation.

### 6. Authentication & Roles (`login.html`)
- Seamless toggle between **Sign In** and **Create Account**.
- Role selector: **Regular User** vs **Admin / Facility Manager**.
- Built-in evaluator demo passcode: `ECOADMIN2025` for creating admin accounts.

### 7. Administrative Portal (`admin.html`)
- Restricted access protected by `requireAuth('admin')`.
- **Operations Tab**: View all customer pickup requests across the system, search by customer email, and change status using a dropdown selector.
- **Center Management Tab**: Complete CRUD (Create, Read, Update, Delete) for recycling centers with an interactive modal dialog.

---

## 🔒 Security & Backend Details

### Supabase Tables & Schema
- `public.profiles`: Stores user `id`, `email`, and `role` (`'user'` or `'admin'`).
- `public.centers`: Stores verified collection centers with `name`, `city`, `address`, `lat`, `lng`, and `accepts` (`text[]`).
- `public.pickups`: Stores doorstep collection requests with `user_id`, `item_type`, `quantity`, `pickup_date`, `address`, and `status`.

### Avoidance of PGRST200 Join Pitfall
Because `pickups.user_id` links directly to `auth.users(id)` and not directly via foreign key to `public.profiles`, the vanilla scripts query `pickups` and `profiles` separately and map user emails in JavaScript, ensuring zero PostgREST relation errors.

---

## 🎓 College Viva / Evaluation Talking Points

When presenting this project to your professor or examiner:
1. **Separation of Concerns**: Each page has a dedicated HTML file and corresponding JS controller, maximizing modularity and readability.
2. **Zero Framework Overhead**: Demonstrates strong fundamental understanding of browser APIs, DOM tree navigation, and CSS specificity without relying on black-box frameworks.
3. **Responsive Web Design**: All pages are mobile-responsive using CSS media queries and flexible Grid/Flexbox layouts.
4. **Cloud Integration via CDN**: Demonstrates how modern cloud databases (Supabase PostgreSQL) can be queried securely from client-side scripts using Row Level Security (RLS) and JSON web tokens (JWT).
5. **Real-World Impact**: Promotes SDG 12 (Responsible Consumption and Production) by encouraging proper disposal of hazardous electronic components.

---

## 👥 Author
- **Chandan B K** — 2nd Semester CSE Student
- Project Repository: [ecocycle-vanilla](https://github.com/chandan-bk)
