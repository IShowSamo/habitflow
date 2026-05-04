# 🌿 HabitFlow

Dark-mode Habit Tracker PWA – React + Supabase + Vercel.

## Stack
- **Frontend**: React 18 + Vite + Zustand + Recharts
- **Backend/Auth/DB**: Supabase (Postgres + Auth + RLS)
- **Hosting**: Vercel (kostenlos)
- **PWA**: vite-plugin-pwa (installierbar, offline-fähig)

---

## 🚀 Setup in 4 Schritten

### Schritt 1 – Supabase Projekt erstellen

1. Gehe zu **https://supabase.com** → "New Project"
2. Wähle Region: **Frankfurt (eu-central-1)**
3. Notiere dir:
   - **Project URL** → `https://DEIN_ID.supabase.co`
   - **Anon Key** → unter Settings → API

4. Gehe zu **SQL Editor** und führe den kompletten Inhalt von `supabase/schema.sql` aus.

5. Gehe zu **Authentication → Settings**:
   - Aktiviere **Email confirmations** (optional für MVP: deaktivieren)
   - Setze **Site URL** auf deine Vercel-URL (nach Step 3 nachtragen)

---

### Schritt 2 – Lokal starten

```bash
# 1. Ins Projektverzeichnis
cd habitflow

# 2. Dependencies installieren
npm install

# 3. .env.local erstellen
cp .env.example .env.local

# 4. .env.local bearbeiten:
#    VITE_SUPABASE_URL=https://DEIN_ID.supabase.co
#    VITE_SUPABASE_ANON_KEY=dein-anon-key

# 5. Dev-Server starten
npm run dev
# → http://localhost:3000
```

---

### Schritt 3 – Auf Vercel deployen

**Option A: Vercel CLI (schnellste Methode)**
```bash
npm install -g vercel
vercel login
vercel --prod
```
Vercel fragt nach dem Framework → wähle **Vite**.

**Option B: GitHub + Vercel Dashboard**
1. Pushe den Code auf GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   gh repo create habitflow --public --push
   ```
2. Gehe zu **https://vercel.com** → "Import Project" → GitHub Repo wählen
3. Build Settings werden automatisch erkannt (Vite)

**Umgebungsvariablen in Vercel setzen:**
- Dashboard → Project → Settings → Environment Variables
- `VITE_SUPABASE_URL` = `https://DEIN_ID.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `dein-anon-key`
- Dann: **Redeploy**

---

### Schritt 4 – PWA: Als App installieren

Nach dem Deploy ist die App unter deiner Vercel-URL verfügbar und kann installiert werden:

**iPhone/iPad (Safari):**
1. Seite in Safari öffnen
2. Teilen-Button → "Zum Home-Bildschirm hinzufügen"

**Android (Chrome):**
1. Seite in Chrome öffnen
2. Menü → "App installieren" oder Banner antippen

**Desktop (Chrome/Edge):**
- Adressleiste → Install-Icon rechts

---

## 📁 Projektstruktur

```
habitflow/
├── public/                  # Statische Assets (Icons für PWA)
├── src/
│   ├── lib/
│   │   └── supabase.js      # Supabase Client
│   ├── store/
│   │   └── useStore.js      # Zustand Store (habits, logs, helpers)
│   ├── pages/
│   │   ├── AuthPage.jsx     # Login / Registrierung
│   │   ├── AppShell.jsx     # Layout + Bottom Navigation
│   │   ├── TodayPage.jsx    # Haupt-View: tägliches Abhaken
│   │   ├── StatsPage.jsx    # Charts & Statistiken
│   │   ├── CalendarPage.jsx # Monatskalender
│   │   └── HabitsPage.jsx   # Habits verwalten + Notifications
│   ├── App.jsx              # Router + Auth Guard
│   ├── main.jsx             # Entry Point + SW Registration
│   └── index.css            # Global Dark Theme Styles
├── supabase/
│   └── schema.sql           # Datenbank Schema (einmalig ausführen)
├── vite.config.js           # Vite + PWA Config
├── vercel.json              # SPA Routing für Vercel
└── .env.example             # Vorlage für Umgebungsvariablen
```

---

## 🔔 Push Notifications

Die App nutzt Browser Notifications (Web Push Lite):
- Nutzer klickt Toggle bei einem Habit in "My Habits"
- Browser fragt nach Erlaubnis
- Notification wird zum eingestellten Zeitpunkt gefeuert

Für echte Background Push Notifications (auch wenn Browser zu ist):
→ Füge später **Web Push** mit VAPID Keys + Supabase Edge Functions hinzu.

---

## 🔧 Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| `Invalid API key` | `.env.local` prüfen – kein Space vor dem `=` |
| Seite zeigt 404 nach Reload | `vercel.json` muss im Root liegen |
| Auth-Mail kommt nicht | In Supabase: Auth → Settings → Email confirmations deaktivieren |
| PWA installiert sich nicht | HTTPS erforderlich – nur nach Vercel-Deploy |

---

## 💡 Nächste Schritte (nach MVP)

- [ ] Onboarding Flow für neue User
- [ ] Habit-Reihenfolge per Drag & Drop ändern
- [ ] Wochen- / Monats-Review Screen
- [ ] Social: Streak-Vergleich mit Freunden
- [ ] Apple Health / Google Fit Integration
- [ ] In-App Purchases (Pro Plan) via Stripe
- [ ] Native App via Capacitor (iOS App Store)
