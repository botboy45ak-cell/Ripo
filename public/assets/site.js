(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const form = document.getElementById('pilot-form');
  if (!form) return;
  const status = document.getElementById('form-status');
  const config = window.TUTOR_SETUP_CONFIG || {};
  const digits = String(config.whatsapp || '').replace(/\D/g, '');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const subject = String(data.get('subject') || '').trim();
    const area = String(data.get('area') || '').trim();

    if (digits.length < 10) {
      status.textContent = 'The owner’s WhatsApp number has not been added yet. This demo does not send or save your details.';
      status.classList.add('is-warning');
      return;
    }

    const lines = [
      'Hello, I saw the Tutor Setup pilot.',
      `My name is ${name}.`,
      `I teach: ${subject}.`,
      area ? `My area: ${area}.` : '',
      'Could you share the setup details?'
    ].filter(Boolean);
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    status.textContent = 'WhatsApp opened with a draft. Review it and choose whether to send; nothing was sent automatically.';
    status.classList.remove('is-warning');
  });
})();
