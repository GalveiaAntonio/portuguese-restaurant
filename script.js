const toggle = document.getElementById('menuToggle');
const links = document.getElementById('menuLinks');

function abrirMenu() {
    links.classList.add('aberto');
    toggle.classList.add('aberto');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-aberto');
}
function fecharMenu() {
    links.classList.remove('aberto');
    toggle.classList.remove('aberto');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-aberto');
}

toggle.addEventListener('click', () => {
    links.classList.contains('aberto') ? fecharMenu() : abrirMenu();
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', fecharMenu));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharMenu();
});