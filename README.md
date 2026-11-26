# Tutor Setup — pilot project

A static demo for testing a small paid setup service for **independent tutors**: a clear class-information page, editable WhatsApp reply templates, and a simple follow-up tracker.

This is a **sales experiment**, not a money-making app or a proven business. The website does not collect or store enquiries. Its contact form opens WhatsApp only after a visitor reviews and chooses to send a draft; add your own number in `public/assets/config.js` before launch.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8000 --directory public
```

Open `http://localhost:8000` in your browser. `public/tutor-demo.html` is an interactive sample using fictional data; its demo actions are not saved.

## Manual setup before public launch

1. In `public/assets/config.js`, add the WhatsApp number you control as country code plus digits, e.g. `91` + your 10-digit number. Do not add `+`, spaces, API keys, or passwords.
2. Review the wording, city, pilot price, and service scope in `public/index.html`.
3. Test every CTA and form on mobile. Confirm the WhatsApp draft is addressed to you and contains no unexpected information.
4. **Do not use GitHub Pages for this commercial sales page.** GitHub's Pages limits say it is not permitted as free hosting for an online business or a site primarily facilitating commercial transactions. Keep the source in Ripo and use a host whose current terms allow commercial sites. Netlify's official Free-plan announcement says commercial projects are allowed, and its current pricing describes a 300-credit monthly Free limit; sites pause at the limit, so recheck current terms and limits before relying on it.
5. For a basic Netlify deploy, import the Ripo repository after the branch is merged (or deploy a branch preview), keep the build command empty, and set the publish directory to `public`. The included `netlify.toml` has this setting.
6. Only message prospects through appropriate, permission-based channels. Do not send bulk or unsolicited WhatsApp messages, buy reviews, or promise admissions or rankings.

## Project files

- `public/index.html` — service offer and WhatsApp enquiry form.
- `public/tutor-demo.html` — interactive mock tracker and reply snippets with synthetic data.
- `public/assets/styles.css` — responsive styles.
- `public/assets/site.js` — opens a user-reviewed WhatsApp draft; does not submit automatically.
- `public/assets/demo.js` — demo-only filters, sample row, and copy buttons.
- `public/assets/config.js` — public contact configuration; never put secrets here.
- `offer/market-check.md` — desk research and a small validation plan.
- `offer/outreach.md` — one-to-one call/in-person scripts.
- `offer/lead-tracker.csv` — blank outreach tracker template.

## Important limits

A website, template, or AI cannot guarantee sales. A paying customer still requires a real offer, manual customer conversations, delivery, and follow-through. The ₹999 price shown is a **test hypothesis**, not a verified local market rate. No checkout or payment processing is included.
