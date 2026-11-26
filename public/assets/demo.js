(() => {
  const rows = Array.from(document.querySelectorAll('[data-lead-row]'));
  const filter = document.getElementById('status-filter');
  const empty = document.getElementById('empty-state');
  const tableBody = document.getElementById('demo-leads');
  const toast = document.getElementById('demo-toast');
  let toastTimer;

  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
  };

  const applyFilter = () => {
    const value = filter.value;
    let shown = 0;
    document.querySelectorAll('[data-lead-row]').forEach((row) => {
      const matches = value === 'all' || row.dataset.status === value;
      row.hidden = !matches;
      if (matches) shown += 1;
    });
    empty.classList.toggle('is-visible', shown === 0);
  };

  filter.addEventListener('change', applyFilter);

  document.getElementById('add-sample')?.addEventListener('click', () => {
    const row = document.createElement('tr');
    row.dataset.leadRow = '';
    row.dataset.status = 'new';
    row.innerHTML = '<td>Demo Parent D</td><td>Class 7 English</td><td>Today</td><td><span class="status-pill pill-new">New</span></td>';
    tableBody.prepend(row);
    applyFilter();
    showToast('Added a fictional demo row. It is not saved.');
  });

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = button.dataset.copy || '';
      try {
        await navigator.clipboard.writeText(text);
        showToast('Sample reply copied. Review before using.');
      } catch {
        const helper = document.createElement('textarea');
        helper.value = text;
        helper.setAttribute('readonly', '');
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        const copied = document.execCommand('copy');
        helper.remove();
        showToast(copied ? 'Sample reply copied. Review before using.' : 'Copy not available in this browser.');
      }
    });
  });
})();
