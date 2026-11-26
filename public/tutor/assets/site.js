(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const profile = window.TUTOR_SETUP_CONFIG?.instagram;
  if (profile) {
    document.querySelectorAll('[data-instagram-link]').forEach((link) => {
      link.href = profile;
    });
  }
})();
