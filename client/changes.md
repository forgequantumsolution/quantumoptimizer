# Changes Log — Quantum Optimizer Frontend

All changes made in this session to the Quantum Optimizer frontend.

Folder: `quantumoptimizer-main/client/`

Product description used for the copy on this page:

> AI-driven Demand Planning & Supply Chain Forecasting SaaS for Pharma, F&B,
> and FMCG. Multi-tenant with modules for forecasting, consensus planning,
> inventory, scenario planning, and analytics.

---

## Objective

1. Disable the marketing landing page and make the sign-in page the default view at `/`.
2. Redesign the sign-in page to match the Quantum Kairoz login aesthetic (dark split-screen, glassmorphic card, gold `#b07d1a`, Cormorant Garamond + DM Sans + DM Mono fonts, pulsing "System Online" status, gold-bordered feature pills, uppercase sign-in button).
3. Use a real theme-appropriate background image and the shared Kairoz logo.
4. Rewrite the left-panel copy to match the actual product scope (AI-driven demand planning for Pharma / F&B / FMCG).

---

## File changes

### `src/App.jsx`

- Commented out the `LandingPage` import (`import LandingPage from './pages/LandingPage';`) — the landing component is preserved on disk, just unreferenced.
- Commented out `<Route path="/" element={<LandingPage />} />`.
- Added `<Route path="/" element={<SignInPage />} />` so `/` now renders the sign-in page.
- `/signin` legacy route kept for any existing links.
- `*` fallback still redirects to `/`.

### `src/pages/SignInPage.jsx` (rewritten, then refined)

Rewritten to mirror Kairoz's `LoginPage.tsx` structure:

- Split-screen layout: left brand panel + right floating glass card.
- Inline Lucide-spec SVG icons (`MailIcon`, `LockIcon`, `EyeIcon`, `EyeOffIcon`, `AlertIcon`). The `lucide-react` package is not installed in this project, so icons are inlined as small SVG components to avoid adding a new dependency.
- Imports the shared `golden_blue_logo.png` (from Kairoz) as the card logo.
- Imports `supply-chain-bg.jpg` (shipping-container port aerial shot) as the background image, applied inline via `style={{ backgroundImage: url(${supplyChainBg}) }}`.
- Left brand panel copy refined to match the product description:
  - Eyebrow: **"Demand Planning Platform"**.
  - Headline: **"AI-Driven Forecasting. / _Seamless Supply._"**
  - Description: "Multi-tenant demand planning and supply chain forecasting for Pharma, F&B, and FMCG — forecasting, consensus planning, inventory optimisation, scenario planning, and analytics in a single platform."
  - Feature pills: **`Forecasting`, `Consensus Planning`, `Inventory`, `Scenario Planning`, `Analytics`** (aligned to the product's stated modules).
- Right card:
  - Shared Kairoz logo above the "Quantum Optimizer" product name.
  - "Sign In" title + pulsing green "System Online" status.
  - Email + password inputs with inline Lucide-shaped SVG icons and password visibility toggle.
  - Uppercase gold submit button with loading spinner.
  - Card footer: "Powered by Quantum Optimizer · Forge Quantum Solutions".
- Preserves existing `authService.login(email, password)` call, `setAuth(user, accessToken)` action, `useToastStore.addToast`, and the `<ToastContainer />` mount.

### `src/pages/SignInPage.css` (new file — adjusted)

Cloned from Kairoz's `LoginPage.css`.

- Initially contained an Optimizer-specific CSS-gradient background class (`.login-page--optimizer`) as a placeholder. That class and its rules were **removed** once the real `supply-chain-bg.jpg` image was added — the page now uses Kairoz's standard dark `105deg` overlay on top of the photo.
- Replaced the provisional `.login-card-logo-mark` (gold "Q" monogram tile) with `.login-card-logo` — 340×160 with `brightness(1.3)` filter, matching Kairoz/Kaizen/Eyewall sizing.

### `index.html`

- Expanded the Google Fonts `<link>` to include additional Cormorant Garamond weights (0,700 / 1,700) and added **DM Sans** (300/400/500/600/700) and **DM Mono** (400/500). The existing Playfair Display and DM Sans 300/400/500/600 weights are preserved.
- **Favicon swapped**: replaced `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` with `<link rel="icon" type="image/png" href="/favicon.png" />` and added `<link rel="apple-touch-icon" href="/favicon.png" />`. Matches the Kairoz favicon setup.

### `public/favicon.png` (new asset)

Copied from `Quantum-Kairoz-main/frontend/public/favicon.png` — the shared gold "Quantum" brand mark, 37 KB. The old `public/favicon.svg` is left on disk, no longer referenced.

### `src/assets/supply-chain-bg.jpg` (new asset)

Aerial photograph of a shipping-container port (stacks of containers, gantry cranes). 1920×1280, ~789 KB, downloaded from Unsplash. Used as the login background image. Thematically fits Quantum Optimizer's supply-chain / demand-planning / forecasting scope and is visually distinct from Quantum Invenza's warehouse-interior image.

### `src/assets/golden_blue_logo.png` (new asset)

Copied from `Quantum-Kairoz-main/frontend/src/assets/golden_blue_logo.png` — the same logo used on the Kairoz, Kaizen, and Eyewall login cards. 32 KB.

---

## Design parity with Kairoz

| Token | Value |
|---|---|
| Accent gold | `#b07d1a` (hover `#c9922a`) |
| Status green | `#16A34A` — pulsing dot, "System Online" |
| Error red | `#DC2626` — inline error banner |
| Card | `rgba(255,255,255,0.1)` + `backdrop-filter: blur(24px)` + inset gold glow + deep shadow |
| Overlay | `linear-gradient(105deg, rgba(5,5,12,0.82) 0%, rgba(8,8,18,0.75) 45%, rgba(5,5,12,0.60) 100%)` |
| Serif | Cormorant Garamond 700 |
| Sans | DM Sans 300/400/500/600/700 |
| Mono | DM Mono 400/500 |
| Logo size | 340×160 with `filter: brightness(1.3)` |
| Card max-width | 520px desktop, 420px ≤ 768px |
| Breakpoint | 768px — left brand panel hidden below |

---

## Dependencies

No new dependencies installed. `lucide-react` is deliberately not added — icons are inlined as small SVG components (`MailIcon`, `LockIcon`, `EyeIcon`, `EyeOffIcon`, `AlertIcon`) so the change is asset-only, no package change.

---

## Verification performed

- `SignInPage.jsx`, `SignInPage.css`, `App.jsx`, `index.html` all parse cleanly via `esbuild@0.23.1`.
- Import paths resolved:
  - `useAuthStore` from `../store/authStore` ✓
  - `useToastStore` from `../store/toastStore` ✓
  - `authService` from `../services/authService` ✓
  - `ToastContainer` from `../components/ui` (re-exported from `./Toast`) ✓
  - `supplyChainBg` from `../assets/supply-chain-bg.jpg` ✓
  - `goldenLogo` from `../assets/golden_blue_logo.png` ✓
- Full `npm run build` was not run in this session.

---

## What was not changed

- `LandingPage.jsx` is preserved on disk — just unreachable. Re-enable by uncommenting the `LandingPage` import and the `/` route in `App.jsx`.
- No components outside of the sign-in page were restyled.
- No authentication logic / API contract changed; only presentation layer, copy, assets, and the default route.
