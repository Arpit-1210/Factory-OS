# Factory OS — Manufacturing Intelligence System
**Propskart & Urban Pebbles · Ranchi, Jharkhand**

## Tech Stack
- **Frontend:** Vite + Vanilla JS (modular)
- **Backend:** Firebase Firestore (serverless)
- **Auth:** Firebase Authentication
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Backup:** Google Sheets via Apps Script

---

## Project Structure
```
factory-os/
├── index.html              # App shell only
├── src/
│   ├── js/
│   │   ├── main.js         # Entry point
│   │   ├── config.js       # Constants (reads from .env)
│   │   ├── state.js        # localStorage state management
│   │   ├── firebase.js     # Firebase sync module
│   │   ├── auth.js         # Login + role security
│   │   ├── router.js       # Screen navigation
│   │   ├── sidebar.js      # Sidebar rendering
│   │   └── utils.js        # Helper functions
│   ├── css/
│   │   ├── style.css       # Base styles
│   │   └── components.css  # UI components
│   └── screens/
│       ├── dashboard.js    # Dashboard (3 tabs)
│       ├── attendance.js   # Attendance + OT
│       ├── production.js   # Teams & Production
│       ├── orders.js       # Orders pipeline
│       ├── inventory.js    # RM + FG inventory
│       ├── salary.js       # Monthly payroll
│       ├── monthly.js      # Monthly report
│       ├── export.js       # Excel exports
│       ├── docs.js         # Quotation/Invoice
│       └── sheets.js       # Cloud sync settings
├── public/
│   └── favicon.ico
├── .env.example            # Template (commit this)
├── .env                    # Your secrets (NEVER commit)
├── .gitignore
├── vite.config.js
└── package.json
```

---

## Setup Instructions

### 1. Clone and Install
```bash
git clone https://github.com/YOUR_USERNAME/factory-os.git
cd factory-os
npm install
```

### 2. Create .env file
```bash
cp .env.example .env
```
Edit `.env` with your actual values:
```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=frp-factory-3e933.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=frp-factory-3e933
VITE_FIREBASE_STORAGE_BUCKET=frp-factory-3e933.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=842971949999
VITE_FIREBASE_APP_ID=1:842971949999:web:0263ae517f057288341d5a
VITE_SHEETS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_OWNER_PASSWORD=YOUR_OWNER_PASSWORD
VITE_SUPERVISOR_PASSWORD=sup@123
VITE_RM_PASSWORD=rm@123
```

### 3. Run locally
```bash
npm run dev
```
Open http://localhost:5173

### 4. Build for production
```bash
npm run build
```

---

## GitHub Setup
```bash
git init
git add .
git commit -m "Initial commit — Factory OS v2.0"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/factory-os.git
git push -u origin main
```

**Important:** `.env` is in `.gitignore` — it will NOT be pushed to GitHub.

---

## Vercel Deployment

1. Go to **vercel.com** → New Project → Import from GitHub
2. Select `factory-os` repo
3. Framework: **Vite**
4. Go to **Settings → Environment Variables**
5. Add all variables from your `.env` file
6. Deploy

Every `git push` to `main` auto-deploys to Vercel.

---

## Firebase Setup

### Firestore Rules (copy to Firebase Console → Rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own role
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only admin can set roles
    }
    // Factory data — authenticated users only
    match /factory/{doc} {
      allow read, write: if request.auth != null;
    }
    match /supervisors/{doc} {
      allow read, write: if request.auth != null;
    }
    match /backups/{doc} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Set User Roles in Firestore
For each user, create a document in `users/` collection:
```
users/
  {firebase_auth_uid}/
    role: "owner"    // or "supervisor" or "rm"
    name: "Arpit"
    email: "arpit@propskart.com"
```

---

## Adding a New Screen

1. Create `src/screens/myscreen.js`:
```javascript
export function render(container, S, role) {
  container.innerHTML = `<div class="page-hero"><h1>My Screen</h1></div>`;
}
```

2. Import in `src/js/main.js`:
```javascript
import * as MyScreen from '../screens/myscreen.js';
const SCREENS = { myscreen: MyScreen, ... };
```

3. Add to `ROLE_ACCESS` in `src/js/config.js`

4. Add sidebar link in `src/js/sidebar.js`

---

## Security Notes
- Secrets in `.env` → never in code
- `.env` in `.gitignore` → never on GitHub
- Vercel stores secrets in encrypted dashboard
- Firebase Auth handles identity → Firestore Rules enforce data access
- Even if someone sees the source code — they see no passwords, no API keys
