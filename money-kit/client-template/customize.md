
# Client template — how to deliver a site in 1–2 hours

This is the same design as your demo, but everything is bracketed `[LIKE THIS]`. **One file = one client site.** No build tools, no frameworks, no hosting fees — that's the whole trick.

## 15-minute client onboarding (copy-paste)

Send this on WhatsApp the moment they agree:

```
Perfect! 🎉 To start, please send:
1. Business name (exactly as on the board)
2. One line: what you do + for whom
3. List of services/items with prices (4–8)
4. Timings (days + hours)
5. Full address
6. 3–5 photos (shop, products, team)
7. Any colour/logo you like
8. WhatsApp number for the button

That's all I need to start. First draft in 24 hours, free. 🙏
```

## Build checklist (tick each line, ~20 min)

1. Copy `index.html` into a new folder, e.g. `clients/salon-xyz/index.html`.
2. Edit in this order (search with Ctrl+F for `[`):
   - `<title>` + `<meta description>`
   - `[BUSINESS NAME]` (appears 4×), `[AREA] · [CITY]`
   - Re-skin colours: `:root` → `--bg --panel --line --cream --mut --acc --acc2`
     - Salon/feminine → `--acc:#ec4899; --acc2:#f9a8d4; --bg:#140a10; --panel:#1d1017; --line:#331827; --cream:#fdeef5; --mut:#c99db4`
     - Gym/bold → `--acc:#ef4444; --acc2:#f97316; --bg:#0b0b0e; --panel:#141419; --line:#26262f; --cream:#f2f2f5; --mut:#a1a1b0`
     - Clinic/clean → `--acc:#0ea5e9; --acc2:#38bdf8; --bg:#f7fafc; --panel:#ffffff; --line:#e2e8f0; --cream:#0f172a; --mut:#475569` (light theme!)
     - Coaching → `--acc:#16a34a; --acc2:#4ade80; --bg:#07120c; --panel:#0c1a12; --line:#193525; --cream:#e9f7ee; --mut:#9bbfaa`
   - Hero h1 + paragraph
   - 6 items: name / small / price
   - 3 "why us" cards (ask the client: "why do customers pick you?")
   - Visit rows: timings, address, phone, payments
   - Map link: `https://maps.google.com/?q=` + address with `+` between words
   - Replace all `91XXXXXXXXXX` with the client's WhatsApp number
3. Send the draft link on WhatsApp. Ask for approvals.
4. Hosting:
   - **Option A (free, default):** create a GitHub account for the client (or a folder in yours) → upload → Pages → share `https://...github.io/...`
   - **Option B (paid, +₹500–800/yr):** client buys a domain (or you buy under their name) → point it to Pages via Settings → Pages → Custom domain.
5. Collect money: 50% before delivery, 50% at go-live. Send invoice PDF (RupeeInvoice) — see `../sales/payment-setup.md`.

## The one-page rules (why this sells)

- **WhatsApp button must work.** That's the feature clients care about — every visitor becomes a chat.
- **Prices on the page** convert better. If client hesitates, use "from ₹X".
- **Photos > text.** A real shop photo beats a paragraph.
- Never promise features the template can't do (booking calendar, payments). Say "that's a Phase 2, I'll quote separately."

## Delivery message (copy-paste)

```
Site live hai! 🎉
🔗 [LINK]

Kya hua:
✅ Phone pe perfect
✅ WhatsApp button working
✅ Google Maps location
✅ [7 din free fixes]

Kuch bhi change karna ho, bas message kar dijiye.
Aur haan — aapke jaan-pehchan mein 2 business hain jo website chahte hain? Referral dene par unke liye ₹300 off aur aapke liye ek free update. 🙏
```

