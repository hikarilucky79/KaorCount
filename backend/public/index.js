let lastScrollY = window.scrollY;
const header = document.getElementById('main-header');

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Rando para BAIXO e já passou do topo (mais de 80px)
    if (currentScrollY > lastScrollY && currentScrollY > 80) {
        header.classList.add('esconder-logo');
    } 
    // Rando para CIMA (mesmo que só um pouco)
    else if (currentScrollY < lastScrollY) {
        header.classList.remove('esconder-logo');
    }

    lastScrollY = currentScrollY;
});