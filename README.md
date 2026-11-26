# Tutor Setup — pilot project

A static sales experiment for a one-time setup service aimed at **independent tutors**: a class-information page, editable reply templates, and a follow-up sheet the tutor controls, with a written handover instead of a live session.

This is not a proven business and does not guarantee income. The site does not use the user's personal WhatsApp number. Visitors can submit an inbound request through a Netlify form or open the supplied Instagram profile. The form collects only the tutor's name, email, subject, optional area, and consent, and asks visitors not to submit student or sensitive information. No response is sent automatically.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000`. `public/tutor-demo.html` is an interactive sample with fictional data; demo actions are not saved.

## Manual Netlify setup before public launch

1. Review the offer, pilot price, Instagram profile, written-only workflow, and privacy wording in `public/`.
2. Connect the Ripo repository to Netlify after the branch is merged (or use a branch preview). The included `netlify.toml` sets the publish directory to `public` with no build command.
3. Enable Netlify form detection and deploy. The static `pilot-request` form should appear in Netlify Forms.
4. In **Forms → Submission notifications**, add the Gmail address you want to receive enquiries at. If Netlify asks for confirmation, open that confirmation email and approve it. Send a test form submission and confirm it arrives.
5. Do not use GitHub Pages for this commercial sales page; GitHub's Pages limits prohibit free hosting for an online business or a site primarily facilitating commercial transactions. Recheck Netlify's current plan/usage terms before relying on it.
6. This project is inbound-only. Do not research prospects, send emails or DMs, or follow up. The form does not auto-reply; Instagram is only a profile link and its DMs are not accessible in this chat. The user must explicitly authorize any specific response before it is sent. Any service communication should remain written/asynchronous; no call or in-person meeting is included.

## Project files

- `public/index.html` — service offer and Netlify enquiry form.
- `public/tutor-demo.html` — interactive mock tracker and reply snippets with synthetic data.
- `public/privacy.html` — form/privacy notice.
- `public/thanks.html` — post-submission confirmation page.
- `public/assets/styles.css` — responsive styles.
- `public/assets/site.js` — year and Instagram link configuration.
- `public/assets/demo.js` — demo-only filters, sample row, and copy buttons.
- `public/assets/config.js` — public Instagram profile link; no secrets or private phone number.
- `offer/market-check.md` — desk research and inbound-only validation caveats.
- `offer/outreach.md` — inbound-only contact boundaries; no outreach templates.
- `offer/lead-tracker.csv` — blank tracker for voluntary inbound enquiries.

## Important limits

The ₹999 pilot price is a hypothesis, not a verified local market rate. A paying customer still requires a real buyer, an agreed scope, delivery, and payment. No checkout, automatic reply, or payment processing is included. Gmail is connected, but no Netlify notification recipient has been configured; Instagram DMs cannot be accessed from this chat. No messages are read or sent without the user's explicit request and approval. There are no known leads, customer commitments, payments, or revenue.
