// LockIn — Custom Select: dropdown estilizado para selects nativos
// ---------------------------------------

function initCustomSelects() {
  document.querySelectorAll('select.custom-select, select.field-select, .add-row select').forEach(el => {
    if (el.closest('.custom-dropdown')) return;
    buildCustomSelect(el);
  });
}

function rebuildCustomSelect(selectEl) {
  const wrapper = selectEl.closest('.custom-dropdown');
  if (!wrapper) return;
  const trigger = wrapper.querySelector('.cd-trigger');
  const menu = wrapper.querySelector('.cd-menu');
  trigger.innerHTML = '';
  menu.innerHTML = '';
  buildMenu(selectEl, menu, trigger);
  const selected = selectEl.options[selectEl.selectedIndex];
  trigger.textContent = selected ? selected.textContent : selectEl.value;
}

function buildCustomSelect(select) {
  const wrapper = document.createElement('div');
  wrapper.className = 'custom-dropdown';
  if (select.id) wrapper.dataset.for = select.id;

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'cd-trigger';
  const selected = select.options[select.selectedIndex];
  trigger.textContent = selected ? selected.textContent : select.value;

  const menu = document.createElement('div');
  menu.className = 'cd-menu';

  buildMenu(select, menu, trigger);

  let open = false;

  function closeMenu() {
    open = false;
    menu.classList.remove('cd-open');
    trigger.classList.remove('cd-open');
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    if (open) { closeMenu(); return; }
    open = true;
    menu.classList.add('cd-open');
    trigger.classList.add('cd-open');
    positionMenu(menu, trigger);
  });

  document.addEventListener('click', e => {
    if (!wrapper.contains(e.target)) closeMenu();
  });

  document.addEventListener('scroll', () => {
    if (open) positionMenu(menu, trigger);
  }, true);

  menu.addEventListener('click', e => {
    const item = e.target.closest('.cd-option');
    if (!item) return;
    const val = item.dataset.value;
    select.value = val;
    trigger.textContent = item.textContent;
    menu.querySelectorAll('.cd-option').forEach(o => o.classList.remove('cd-selected'));
    item.classList.add('cd-selected');
    closeMenu();
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // Insere wrapper antes do select e move o select para dentro
  select.insertAdjacentElement('beforebegin', wrapper);
  wrapper.appendChild(select);
  wrapper.appendChild(trigger);
  wrapper.appendChild(menu);
  select.style.display = 'none';
}

function buildMenu(select, menu) {
  const groups = [];
  let currentGroup = null;

  Array.from(select.children).forEach(child => {
    if (child.tagName === 'OPTGROUP') {
      currentGroup = { label: child.label, options: [] };
      Array.from(child.children).forEach(opt => {
        if (opt.tagName === 'OPTION') currentGroup.options.push(opt);
      });
      groups.push(currentGroup);
    } else if (child.tagName === 'OPTION') {
      groups.push({ label: null, options: [child] });
    }
  });

  groups.forEach((group, gi) => {
    if (group.label) {
      const lbl = document.createElement('div');
      lbl.className = 'cd-group-label';
      lbl.textContent = group.label;
      menu.appendChild(lbl);
    }
    group.options.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'cd-option';
      if (opt.selected) item.classList.add('cd-selected');
      item.dataset.value = opt.value;
      item.textContent = opt.textContent;
      menu.appendChild(item);
    });
    if (gi < groups.length - 1 && group.label) {
      const sep = document.createElement('div');
      sep.className = 'cd-sep';
      menu.appendChild(sep);
    }
  });
}

function positionMenu(menu, trigger) {
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - 8;
  const spaceAbove = rect.top - 8;
  menu.style.maxHeight = '';

  if (spaceBelow < 150 && spaceAbove > spaceBelow) {
    menu.style.top = 'auto';
    menu.style.bottom = '100%';
    menu.style.marginBottom = '4px';
    menu.style.marginTop = '';
    menu.style.maxHeight = Math.min(280, spaceAbove - 12) + 'px';
  } else {
    menu.style.top = '100%';
    menu.style.bottom = 'auto';
    menu.style.marginTop = '4px';
    menu.style.marginBottom = '';
    menu.style.maxHeight = Math.min(280, Math.max(150, spaceBelow - 12)) + 'px';
  }
}
