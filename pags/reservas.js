const ZONAS = [
    {
        nome: 'Sala principal', mesas: [
            { id: 1, seats: 2, shape: '🍽️' }, { id: 2, seats: 2, shape: '🍽️' }, { id: 3, seats: 4, shape: '🪑' },
            { id: 4, seats: 4, shape: '🪑' }, { id: 5, seats: 4, shape: '🪑' }, { id: 6, seats: 2, shape: '🍽️' }
        ]
    },
    {
        nome: 'Adega (grupos)', mesas: [
            { id: 7, seats: 12, shape: '🍷' }
        ]
    },
    {
        nome: 'Pátio das trepadeiras', mesas: [
            { id: 8, seats: 2, shape: '🌿' }, { id: 9, seats: 2, shape: '🌿' }, { id: 10, seats: 4, shape: '🌿' },
            { id: 11, seats: 4, shape: '🌿' }, { id: 12, seats: 2, shape: '🌿' }, { id: 13, seats: 4, shape: '🌿' }, { id: 14, seats: 2, shape: '🌿' }
        ]
    }
];
const OCUPADAS = [2, 5, 10, 13];
let selectedTable = null;
let booking = {};

function storageGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function storageSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { }
}

function showToast(msg, ms = 3200) {
    const t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

function openBooking() {
    selectedTable = null; booking = {};
    document.getElementById('fNome').value = '';
    document.getElementById('fTel').value = '';
    document.getElementById('fEmail').value = '';
    document.getElementById('fData').value = '';
    document.getElementById('fHora').value = '';
    ['errNome', 'errTel', 'errEmail', 'errData', 'errHora', 'errMesa'].forEach(id => document.getElementById(id).style.display = 'none');
    renderFloorplan();
    goStep1();
    document.getElementById('overlay').classList.add('open');
}
function closeBooking() { document.getElementById('overlay').classList.remove('open'); }

function setStep(n) {
    [1, 2, 3].forEach(i => {
        document.getElementById('view' + i).style.display = i === n ? 'block' : 'none';
        document.getElementById('stp' + i).classList.toggle('active', i <= n);
    });
}
function goStep1() { setStep(1); }

function goStep2() {
    const nome = document.getElementById('fNome').value.trim();
    const tel = document.getElementById('fTel').value.trim().replace(/\s|\+/g, '');
    const email = document.getElementById('fEmail').value.trim();
    const data = document.getElementById('fData').value;
    const hora = document.getElementById('fHora').value;
    let ok = true;
    toggleErr('errNome', !nome); if (!nome) ok = false;
    const telValido = /^\d{9,13}$/.test(tel);
    toggleErr('errTel', !telValido); if (!telValido) ok = false;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    toggleErr('errEmail', !emailValido); if (!emailValido) ok = false;
    toggleErr('errData', !data); if (!data) ok = false;
    toggleErr('errHora', !hora); if (!hora) ok = false;
    if (!ok) return;
    booking = {
        nome, telefone: document.getElementById('fTel').value.trim(), email,
        data, hora, pessoas: document.getElementById('fPessoas').value
    };
    setStep(2);
}
function toggleErr(id, show) { document.getElementById(id).style.display = show ? 'block' : 'none'; }

function goStep3() {
    if (!selectedTable) { toggleErr('errMesa', true); return; }
    toggleErr('errMesa', false);
    const t = findTable(selectedTable);
    document.getElementById('resumo').innerHTML = `
    <p><b>Nome:</b> ${escapeHtml(booking.nome)}</p>
    <p><b>Telemóvel:</b> ${escapeHtml(booking.telefone)}</p>
    <p><b>Email:</b> ${escapeHtml(booking.email)}</p>
    <p><b>Data:</b> ${booking.data} às ${booking.hora}</p>
    <p><b>Pessoas:</b> ${booking.pessoas}</p>
    <p><b>Mesa:</b> Nº ${t.id} — ${t.zona} (${t.seats} lugares)</p>`;
    setStep(3);
}

function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function findTable(id) { for (const z of ZONAS) { const m = z.mesas.find(x => x.id === id); if (m) return { ...m, zona: z.nome }; } }

function renderFloorplan() {
    const wrap = document.getElementById('floorplan');
    wrap.innerHTML = '';
    ZONAS.forEach(z => {
        const zona = document.createElement('div');
        zona.className = 'zona';
        zona.innerHTML = `<h4>${z.nome}</h4>`;
        const fp = document.createElement('div');
        fp.className = 'floorplan';
        z.mesas.forEach(t => {
            const occupied = OCUPADAS.includes(t.id);
            const div = document.createElement('div');
            div.className = 'table-item' + (occupied ? ' occupied' : '') + (selectedTable === t.id ? ' selected' : '');
            div.innerHTML = `<div class="icon">${t.shape}</div><div>Mesa ${t.id}</div><div class="cap">${t.seats} lug.</div>`;
            if (!occupied) {
                div.onclick = () => { selectedTable = t.id; renderFloorplan(); toggleErr('errMesa', false); };
            }
            fp.appendChild(div);
        });
        zona.appendChild(fp);
        wrap.appendChild(zona);
    });
}

async function confirmarReserva() {
    const btn = document.querySelector('#view3 .btn-primary');
    btn.disabled = true; btn.textContent = 'A enviar...';
    const reserva = { ...booking, mesa: selectedTable, id: Date.now() };
    try {
        const res = await fetch('/api/reservar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reserva)
        });
        if (!res.ok) throw new Error('falhou');

        const reservas = storageGet('reservas', []);
        reservas.push(reserva);
        storageSet('reservas', reservas);
        storageSet('sessao', { nome: reserva.nome, telefone: reserva.telefone, email: reserva.email });
        closeBooking();
        showToast('✉️ Email de confirmação enviado para ' + reserva.email);
        renderSessao();
    } catch (e) {
        showToast('❌ Não foi possível enviar o email. Tente novamente.');
    } finally {
        btn.disabled = false; btn.textContent = 'Confirmar reserva';
    }
}

function renderSessao() {
    const sess = storageGet('sessao', null);
    const actions = document.getElementById('headerActions');
    const painel = document.getElementById('minhasReservas');
    const lista = document.getElementById('listaReservas');
    if (sess) {
        actions.innerHTML = `<span class="session-pill">Olá, ${escapeHtml(sess.nome.split(' ')[0])}</span>
      <button class="btn btn-primary" onclick="openBooking()">Nova reserva</button>
      <button class="btn btn-ghost" onclick="logout()">Sair</button>`;
        const reservas = storageGet('reservas', []).filter(r => r.email === sess.email);
        if (reservas.length) {
            painel.style.display = 'block';
            lista.innerHTML = reservas.map(r => {
                const t = findTable(r.mesa);
                return `<div class="item">
          <span>${r.data} às ${r.hora} · ${r.pessoas} pessoas · Mesa ${r.mesa} (${t ? t.zona : ''})</span>
          <span class="badge">Confirmada</span>
        </div>`;
            }).join('');
        } else { painel.style.display = 'none'; }
    } else {
        actions.innerHTML = `<button class="btn btn-primary" onclick="openBooking()">Fazer reserva</button>`;
        painel.style.display = 'none';
    }
}
function logout() {
    try { localStorage.removeItem('sessao'); } catch (e) { }
    showToast('Sessão terminada.');
    renderSessao();
}

renderSessao();