"use strict";

// Progressive enhancement: links, content and disclosure panels work without JS.
const header = document.getElementById("main-header");
const menuButton = document.querySelector(".menu-toggle");
const navigation = document.getElementById("main-nav");

if (header && menuButton && navigation) {
    const mobileLayout = window.matchMedia("(max-width: 800px)");

    // [F309] Abre ou fecha o menu de navegação da página pública.
    function setMenuOpen(open, returnFocus = false) {
        menuButton.setAttribute("aria-expanded", String(open));
        navigation.classList.toggle("is-open", open);
        menuButton.querySelector("span").textContent = open ? "Fechar" : "Menu";
        if (returnFocus) menuButton.focus();
    }

    menuButton.hidden = false;
    header.classList.add("menu-ready");
    menuButton.addEventListener("click", () => {
        setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });

    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a") && mobileLayout.matches) setMenuOpen(false);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
            setMenuOpen(false, true);
        }
    });

    document.addEventListener("click", (event) => {
        if (!header.contains(event.target)) setMenuOpen(false);
    });

    mobileLayout.addEventListener("change", () => setMenuOpen(false));
}

const year = document.getElementById("current-year");
if (year) year.textContent = String(new Date().getFullYear());
