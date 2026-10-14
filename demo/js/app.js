/**
 * AntrianKu — Demo interaktif (localStorage)
 */
(function () {
  const STORAGE_KEY = 'antrianku_demo_v1';
  const COUNTERS = [
    { id: 'l1', name: 'Loket 1' },
    { id: 'l2', name: 'Loket 2' },
    { id: 'lg', name: 'Loket Gigi' },
  ];
  const SERVICES = [
    { id: 'umum', name: 'Poli Umum', prefix: 'A', est: 10 },
    { id: 'gigi', name: 'Poli Gigi', prefix: 'B', est: 20 },
    { id: 'anak', name: 'Poli Anak', prefix: 'C', est: 15, defaultPriority: true },
    { id: 'mata', name: 'Poli Mata', prefix: 'D', est: 15 },
    { id: 'lab', name: 'Laboratorium', prefix: 'E', est: 10 },
  ];

  let state = load();
  let selectedServiceId = null;
  let lastSpokenKey = '';
  let clockTimer = null;

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.date !== todayStr()) {
          return { date: todayStr(), queues: [], seq: {} };
        }
        return s;
      }
    } catch (_) {}
    return { date: todayStr(), queues: [], seq: {} };
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.style.opacity = '0'; }, 2200);
  }

  function nextNumber(service) {
    const key = service.prefix;
    state.seq[key] = (state.seq[key] || 0) + 1;
    return key + String(state.seq[key]).padStart(3, '0');
  }

  function createQueue(serviceId, opts = {}) {
    const service = SERVICES.find((s) => s.id === serviceId);
    if (!service) return null;
    const q = {
      id: 'q' + Date.now() + Math.random().toString(36).slice(2, 6),
      number: nextNumber(service),
      serviceId: service.id,
      serviceName: service.name,
      name: opts.name || null,
      phone: opts.phone || null,
      priority: !!(opts.priority || service.defaultPriority),
      status: 'waiting',
      counterId: null,
      counterName: null,
      createdAt: new Date().toISOString(),
      calledAt: null,
    };
    state.queues.push(q);
    save();
    return q;
  }

  function sortedWaiting() {
    return state.queues
      .filter((q) => q.status === 'waiting')
      .sort((a, b) => {
        if (a.priority !== b.priority) return a.priority ? -1 : 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  function byStatus(status) {
    return state.queues.filter((q) => q.status === status);
  }

  function waitingCountFor(serviceId) {
    return state.queues.filter((q) => q.serviceId === serviceId && q.status === 'waiting').length;
  }

  function positionOf(q) {
    if (q.status !== 'waiting') return 0;
    const list = sortedWaiting().filter((x) => x.serviceId === q.serviceId);
    const idx = list.findIndex((x) => x.id === q.id);
    return idx + 1;
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'id-ID';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  // ——— Navigation ———
  function showView(name) {
    document.querySelectorAll('[data-view]').forEach((el) => {
      el.classList.toggle('hidden', el.getAttribute('data-view') !== name);
    });
    if (name === 'home') renderHome();
    if (name === 'ambil') renderAmbil();
    if (name === 'operator') renderOperator();
    if (name === 'display') {
      renderDisplay();
      startClock();
    } else {
      stopClock();
    }
    if (name === 'tablet') renderTablet();
    window.scrollTo(0, 0);
  }

  document.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => showView(btn.getAttribute('data-go')));
  });

  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset semua antrian demo?')) return;
    state = { date: todayStr(), queues: [], seq: {} };
    save();
    lastSpokenKey = '';
    toast('Demo di-reset');
    showView('home');
  });

  // ——— Home ———
  function renderHome() {
    document.getElementById('stat-waiting').textContent = byStatus('waiting').length;
    document.getElementById('stat-called').textContent = byStatus('called').length + byStatus('serving').length;
    document.getElementById('stat-finished').textContent = byStatus('finished').length;
  }

  // ——— Ambil ———
  function renderAmbil() {
    const list = document.getElementById('service-list');
    document.getElementById('take-form').classList.add('hidden');
    document.getElementById('ticket-card').classList.add('hidden');
    list.classList.remove('hidden');
    list.innerHTML = SERVICES.map((s) => {
      const w = waitingCountFor(s.id);
      return `
        <button type="button" data-svc="${s.id}" class="text-left bg-white rounded-xl shadow p-4 hover:ring-2 hover:ring-indigo-300 transition">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-semibold">${s.name}</p>
              <p class="text-xs text-slate-500 mt-1">Menunggu: ${w} · est. ±${w * s.est} mnt</p>
            </div>
            <span class="bg-indigo-100 text-indigo-700 text-sm font-bold px-2 py-0.5 rounded">${s.prefix}</span>
          </div>
        </button>`;
    }).join('');
    list.querySelectorAll('[data-svc]').forEach((btn) => {
      btn.addEventListener('click', () => openTakeForm(btn.getAttribute('data-svc')));
    });
  }

  function openTakeForm(serviceId) {
    selectedServiceId = serviceId;
    const s = SERVICES.find((x) => x.id === serviceId);
    document.getElementById('service-list').classList.add('hidden');
    document.getElementById('ticket-card').classList.add('hidden');
    const form = document.getElementById('take-form');
    form.classList.remove('hidden');
    document.getElementById('take-service-name').textContent = s.name;
    const w = waitingCountFor(s.id);
    document.getElementById('take-waiting-hint').textContent = `Antrian menunggu: ${w} · estimasi ±${w * s.est} menit`;
    document.querySelectorAll('#take-form input:not([type="checkbox"]), #take-form textarea').forEach((field) => { field.value = ''; });
    document.querySelectorAll('#take-form select').forEach((field) => { field.selectedIndex = 0; });
    document.getElementById('inp-name').value = '';
    document.getElementById('inp-phone').value = '';
    document.getElementById('inp-priority').checked = !!s.defaultPriority;
  }

  document.getElementById('btn-take-cancel').addEventListener('click', renderAmbil);

  document.getElementById('btn-take').addEventListener('click', () => {
    if (!selectedServiceId) return;
    const q = createQueue(selectedServiceId, {
      name: document.getElementById('inp-name').value.trim() || null,
      phone: document.getElementById('inp-phone').value.trim() || null,
      priority: document.getElementById('inp-priority').checked,
    });
    toast('Nomor ' + q.number + ' berhasil diambil');
    showTicket(q);
  });

  function showTicket(q) {
    document.getElementById('take-form').classList.add('hidden');
    document.getElementById('service-list').classList.add('hidden');
    const card = document.getElementById('ticket-card');
    card.classList.remove('hidden');
    const pos = positionOf(q);
    const s = SERVICES.find((x) => x.id === q.serviceId);
    const ahead = Math.max(0, pos - 1);
    card.innerHTML = `
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-indigo-600 text-white text-center py-6">
          <p class="text-sm opacity-80">Nomor Antrian Anda</p>
          <p class="text-5xl font-bold num mt-1">${q.number}</p>
          ${q.priority ? '<span class="inline-block mt-2 text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded font-semibold">PRIORITAS</span>' : ''}
        </div>
        <div class="p-5 space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Layanan</span><span class="font-medium">${q.serviceName}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Status</span><span class="font-medium text-orange-600">Menunggu</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Posisi</span><span class="font-medium">#${pos} (${ahead} di depan)</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Estimasi</span><span class="font-medium">±${ahead * s.est} menit</span></div>
        </div>
      </div>
      <div class="text-center mt-4 space-y-2">
        <button type="button" data-go-op class="text-sm text-indigo-600 font-medium">Lanjut ke Operator →</button>
        <br />
        <button type="button" id="btn-ambil-lagi" class="text-sm text-slate-500">Ambil nomor lagi</button>
      </div>`;
    card.querySelector('[data-go-op]').addEventListener('click', () => showView('operator'));
    card.querySelector('#btn-ambil-lagi').addEventListener('click', renderAmbil);
  }

  // ——— Operator ———
  function renderOperator() {
    const waiting = sortedWaiting();
    const called = byStatus('called');
    const serving = byStatus('serving');
    document.getElementById('op-wait-count').textContent = waiting.length;
    document.getElementById('op-call-count').textContent = called.length;
    document.getElementById('op-serve-count').textContent = serving.length;

    document.getElementById('op-waiting').innerHTML = waiting.length
      ? waiting.map((q) => `
        <div class="p-2.5 bg-orange-50 rounded-lg ${q.priority ? 'ring-2 ring-amber-400' : ''}">
          <div class="flex justify-between items-start gap-2">
            <div>
              <span class="font-bold num text-lg">${q.number}</span>
              ${q.priority ? '<span class="text-[10px] bg-amber-200 text-amber-800 px-1 rounded ml-1">Prioritas</span>' : ''}
              <p class="text-xs text-slate-500">${q.serviceName}${q.name ? ' · ' + q.name : ''}</p>
            </div>
          </div>
          <div class="flex gap-1 mt-2 items-center">
            <select data-counter-for="${q.id}" class="text-xs border rounded px-1 py-1 flex-1">
              ${COUNTERS.map((c) => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
            <button type="button" data-act="call" data-id="${q.id}" class="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded-lg">Panggil</button>
          </div>
        </div>`).join('')
      : '<p class="text-xs text-slate-400 text-center py-6">Kosong</p>';

    document.getElementById('op-called').innerHTML = called.length
      ? called.map((q) => `
        <div class="p-2.5 bg-blue-50 rounded-lg">
          <span class="font-bold num text-lg">${q.number}</span>
          <p class="text-xs text-slate-500">${q.serviceName} · ${q.counterName || '—'}</p>
          <div class="flex gap-1 mt-2">
            <button type="button" data-act="serve" data-id="${q.id}" class="bg-indigo-600 text-white text-xs px-2.5 py-1 rounded">Layani</button>
            <button type="button" data-act="skip" data-id="${q.id}" class="bg-slate-400 text-white text-xs px-2.5 py-1 rounded">Lewati</button>
          </div>
        </div>`).join('')
      : '<p class="text-xs text-slate-400 text-center py-6">Kosong</p>';

    document.getElementById('op-serving').innerHTML = serving.length
      ? serving.map((q) => `
        <div class="p-2.5 bg-indigo-50 rounded-lg">
          <span class="font-bold num text-lg">${q.number}</span>
          <p class="text-xs text-slate-500">${q.serviceName} · ${q.counterName || '—'}</p>
          <button type="button" data-act="finish" data-id="${q.id}" class="mt-2 bg-green-600 text-white text-xs px-2.5 py-1 rounded">Selesai</button>
        </div>`).join('')
      : '<p class="text-xs text-slate-400 text-center py-6">Kosong</p>';

    document.getElementById('op-waiting').querySelectorAll('[data-act]').forEach(bindAct);
    document.getElementById('op-called').querySelectorAll('[data-act]').forEach(bindAct);
    document.getElementById('op-serving').querySelectorAll('[data-act]').forEach(bindAct);
  }

  function bindAct(btn) {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const act = btn.getAttribute('data-act');
      const q = state.queues.find((x) => x.id === id);
      if (!q) return;
      if (act === 'call') {
        const sel = document.querySelector(`[data-counter-for="${id}"]`);
        const c = COUNTERS.find((x) => x.id === (sel ? sel.value : 'l1'));
        q.status = 'called';
        q.counterId = c.id;
        q.counterName = c.name;
        q.calledAt = new Date().toISOString();
        save();
        speak(`Nomor ${q.number.split('').join(' ')}, silakan menuju ${c.name}`);
        toast('Dipanggil: ' + q.number);
      }
      if (act === 'serve') {
        q.status = 'serving';
        save();
        toast('Sedang dilayani: ' + q.number);
      }
      if (act === 'finish') {
        q.status = 'finished';
        save();
        toast('Selesai: ' + q.number);
      }
      if (act === 'skip') {
        q.status = 'skipped';
        save();
        toast('Dilewati: ' + q.number);
      }
      renderOperator();
    });
  }

  // ——— Display ———
  function startClock() {
    stopClock();
    const tick = () => {
      const el = document.getElementById('display-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
    };
    tick();
    clockTimer = setInterval(tick, 1000);
    // soft poll for updates while on display
    clockTimer._poll = setInterval(() => {
      if (!document.querySelector('[data-view="display"]').classList.contains('hidden')) {
        renderDisplay(true);
      }
    }, 3000);
  }

  function stopClock() {
    if (clockTimer) clearInterval(clockTimer);
    if (clockTimer && clockTimer._poll) clearInterval(clockTimer._poll);
    clockTimer = null;
  }

  function renderDisplay(fromPoll) {
    const called = byStatus('called');
    const next = sortedWaiting().slice(0, 9);

    const calledEl = document.getElementById('display-called');
    if (!called.length) {
      calledEl.innerHTML = '<p class="text-slate-500 text-sm">Belum ada yang dipanggil</p>';
    } else {
      const newest = called[called.length - 1];
      const key = newest.number + '|' + (newest.counterName || '');
      if (fromPoll && key !== lastSpokenKey && lastSpokenKey !== '') {
        speak(`Nomor ${newest.number.split('').join(' ')}, silakan menuju ${newest.counterName || 'loket'}`);
      }
      if (!fromPoll) lastSpokenKey = key;
      else lastSpokenKey = key;

      calledEl.innerHTML = called
        .slice()
        .reverse()
        .slice(0, 3)
        .map(
          (q) => `
        <div class="text-center">
          <p class="text-5xl sm:text-6xl font-bold num">${q.number}</p>
          <p class="text-indigo-300 mt-1">${q.counterName || '—'}</p>
          <p class="text-slate-400 text-sm">${q.serviceName}</p>
        </div>`
        )
        .join('');
    }

    const nextEl = document.getElementById('display-next');
    nextEl.innerHTML = next.length
      ? next
          .map(
            (q) => `
        <div class="bg-slate-800 rounded-xl p-3 text-center ${q.priority ? 'ring-2 ring-amber-400' : ''}">
          <p class="text-xl font-bold num">${q.number}</p>
          <p class="text-xs text-slate-400 truncate">${q.serviceName}</p>
        </div>`
          )
          .join('')
      : '<p class="text-slate-500 text-sm col-span-full">Tidak ada antrian</p>';
  }

  // ——— Tablet ———
  function renderTablet() {
    document.getElementById('tablet-ticket').classList.add('hidden');
    const box = document.getElementById('tablet-services');
    box.classList.remove('hidden');
    box.innerHTML = SERVICES.map((s) => {
      const w = waitingCountFor(s.id);
      return `
        <div class="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <div class="flex justify-between mb-4">
            <div>
              <p class="font-bold text-lg">${s.name}</p>
              <p class="text-slate-400 text-sm">Menunggu: ${w}</p>
            </div>
            <span class="text-indigo-300 font-bold text-xl">${s.prefix}</span>
          </div>
          <button type="button" data-tablet-take="${s.id}" class="w-full bg-indigo-500 hover:bg-indigo-400 font-bold py-4 rounded-xl text-lg">
            Ambil Nomor
          </button>
        </div>`;
    }).join('');
    box.querySelectorAll('[data-tablet-take]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = createQueue(btn.getAttribute('data-tablet-take'));
        box.classList.add('hidden');
        const t = document.getElementById('tablet-ticket');
        t.classList.remove('hidden');
        const pos = positionOf(q);
        t.innerHTML = `
          <p class="text-slate-400 text-sm">Nomor Antrian Anda</p>
          <p class="text-6xl font-bold num text-indigo-300 mt-2">${q.number}</p>
          <p class="text-slate-400 mt-4 text-sm">${q.serviceName} · posisi #${pos}</p>
          <button type="button" id="tablet-again" class="mt-8 bg-indigo-500 px-6 py-3 rounded-xl font-semibold">Ambil Nomor Lagi</button>`;
        document.getElementById('tablet-again').addEventListener('click', renderTablet);
        toast(q.number + ' diambil');
      });
    });
  }

  // init
  showView('home');
})();
