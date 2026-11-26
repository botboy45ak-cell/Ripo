
# Beyond the template — the upgrade ladder (where AI can't follow you)

The ₹999 template site is a **door-opener, not the business**. AI has made the HTML cheap. It has NOT made these things cheap: trust, accounts, KYC, setup, visibility, accountability, and someone to call when something breaks. That's the ladder below. Climb it as your skills grow.

## Why "AI can do it in one prompt" doesn't kill this

| What the client is actually buying | Can AI do it in one prompt? |
|---|---|
| A file of HTML | ✅ Yes — and that's why you never sell "HTML" |
| A business that shows up when a customer searches "salon near me" | ❌ Needs Google account, verification, category/hours/photos, location pin — done by a human with access |
| A WhatsApp number on the site that actually opens a chat | ❌ Needs WhatsApp number verification and the right `wa.me` setup |
| A working UPI/Razorpay payment link | ❌ Needs the owner's PAN, bank KYC, business proof — only the owner (or you with their docs) can do this |
| A domain that resolves with HTTPS | ❌ Needs registrar account, DNS edits, waiting on propagation |
| Someone who fixes it at 11 pm when the menu price is wrong | ❌ AI can't be accountable |
| Trust that the money won't vanish | ❌ Reputation, an invoice, a photo, a phone number that answers |

**The product is not the site. The product is "my business is online and I don't have to think about it."** AI made the site part cheap; the rest of that sentence is still expensive.

Someone who says this in a café — "main website banwata hoon, ₹1,999, 2 din, pehla draft free" — beats a shop owner opening ChatGPT every time, because the shop owner doesn't want to learn prompting, hosting, or DNS. He wants it *done*.

## The ladder (prices real for Patna-tier cities, 2025-26)

| Level | Offer | Price | Skill/setup needed | AI substitutes it? |
|---|---|---|---|---|
| 0 | One-page site (your current kit) | ₹999–3,499 | Kit is done | Close — hence price pressure |
| 1 | **Site + Google Business Profile** (setup, photos, hours, review QR) | ₹2,499 | Free Google account, 1 hr | No — needs account access + verification |
| 2 | **WhatsApp Business setup** (catalog, auto-replies, "click to chat" everywhere) | ₹999 add-on | WhatsApp Business app | No — needs phone verification |
| 3 | **Payments**: Razorpay/Instamojo payment link (₹499 tokens, advance bookings) integrated as a "Book & Pay" button | ₹1,499 add-on + ₹500/mo optional | Client's KYC docs; provider approval | No — KYC is human-gated |
| 4 | **Reviews engine**: follow-up message templates + QR cards + monthly review request workflow | ₹999 + ₹300/mo | Nothing special | No |
| 5 | **Care plan**: content edits, menu/price updates, backups, priority support | **₹500–1,000/month** | 10 min/client/month | No — recurring relationship |
| 6 | **Niche packages** (dental clinic: appointment WhatsApp flow + doctor profile + before/after gallery; coaching: results page + admission form to WhatsApp) | ₹4,999–9,999 | Learn one niche well | Partly — but the client buys the niche's outcome, not code |
| 7 | **Local SEO/ads setup**: Google Maps ranking basics, review velocity, first ad credits | ₹2,499 + monthly | Learn basics | No — account handling |

**Reading the ladder right:** level 0 gets you in the door; levels 1, 3, 5 are where the money actually stabilises. A ₹999 site once is ₹999 forever. A ₹999 client on a ₹500/month care plan is ₹7,000 in year one, with 10 minutes of work a month.

### Payment systems — the honest rules
- **Never handle customers' card data yourself.** Use Razorpay/Instamojo/PayU **payment links or hosted checkout** — the provider handles PCI compliance, you just place a link/button.
- **GitHub Pages cannot be the checkout.** Its policy forbids processing sensitive transactions (card/password data) on Pages. Link *out* to a provider-hosted page. The Pages site stays a showcase. (This is also why "host my shop on GitHub" quotes are wrong — sell showcase + link-out, not checkout on Pages.)
- The moment you integrate a payment provider for someone, you've done something no prompt can do: their KYC, their bank, their compliance. Charge for that.

## "Zero bugs, no errors" — the delivery QA checklist

Run this every single time before you send a client the live link:

- [ ] Every link works (WhatsApp, call, map, menu anchors) — tap each one **on a real phone**
- [ ] WhatsApp opens with the chat already started and the right number
- [ ] Phone number in the page matches the wa.me number (zero-digit typo — check digit by digit)
- [ ] Loads under 3s on mobile data (test with mobile data, not Wi-Fi)
- [ ] Looks right at 360px width (small phone) and desktop
- [ ] Spelling of business name is EXACTLY as on their board (check 2×; this is the #1 embarrassment)
- [ ] Prices match what they sent you, in writing
- [ ] Timings, address, map pin correct
- [ ] One photo check: images not stretched/broken
- [ ] Page title and description written (what shows in Google)
- [ ] Sent from **your** phone, over **mobile data**, not the preview IDE

Anything that passes this list is "zero bugs" at this product's scope. You are not shipping software; you are shipping a page where every button must work. That's achievable with the checklist and a second pair of eyes (a friend with an Android).

## The 60-second script when a client says "ChatGPT se toh free mein ban jayega"

> "Bilkul sahi sir, code free mein mil jayega. 🎯
> Fir bhi log humein paise dete hain kyunki:
> 1. Aapko prompt likhna, hosting, domain, WhatsApp connect — yeh sab khud karna padega, 2–3 din lagenge.
> 2. Website ke saath main aapka **Google Business Profile** set karta hoon — loche 'salon near me' search karein to aap dikhein.
> 3. Kuch bhi tootey to **aap mujhe phone karte hain**, ChatGPT ko nahi.
> Aap apna kaam kijiye — main yeh sambhalta hoon. Chai ke time mein ho jayega. 😄"

## One-line rule for building anything new

> **Sell the outcome and the accountability, not the artifact.**
> Artifacts get commoditised every 18 months. A shop owner who trusts you does not.

