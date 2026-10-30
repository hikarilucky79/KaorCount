"use strict";

const mobileMenu = document.getElementById("mobile-menu");
if (mobileMenu) {
    const summary = mobileMenu.querySelector("summary");
    mobileMenu.addEventListener("click", (event) => {
        if (event.target.closest("a")) mobileMenu.open = false;
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && mobileMenu.open) {
            mobileMenu.open = false;
            summary.focus();
        }
    });
    document.addEventListener("click", (event) => {
        if (!mobileMenu.contains(event.target)) mobileMenu.open = false;
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (event) => {
        if (event.matches) mobileMenu.open = false;
    });
}
const currentYear = document.getElementById("current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());

const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
    let lastScrollY = Math.max(0, window.scrollY);
    window.addEventListener("scroll", () => {
        const currentScrollY = Math.max(0, window.scrollY);
        if (currentScrollY <= siteHeader.offsetHeight) {
            siteHeader.classList.remove("is-hidden");
            lastScrollY = currentScrollY;
        } else if (Math.abs(currentScrollY - lastScrollY) > 8) {
            const hide = currentScrollY > lastScrollY && !siteHeader.contains(document.activeElement) && !mobileMenu?.open;
            siteHeader.classList.toggle("is-hidden", hide);
            lastScrollY = currentScrollY;
        }
    }, { passive: true });
    siteHeader.addEventListener("focusin", () => siteHeader.classList.remove("is-hidden"));
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
if ("IntersectionObserver" in window && !reducedMotion.matches) {
    const revealSections = Array.from(document.querySelectorAll("main > section:not(:first-child), footer"));
    const revealObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            observer.unobserve(entry.target);
            if (!reducedMotion.matches && typeof entry.target.animate === "function") {
                entry.target.animate(
                    [{ opacity: 0.6, transform: `translateX(${revealSections.indexOf(entry.target) % 2 === 0 ? -20 : 20}px)` }, { opacity: 1, transform: "translateX(0)" }],
                    { duration: 1000, easing: "cubic-bezier(.22, .61, .36, 1)" }
                );
            }
        }
    }, { rootMargin: "0px 0px -8% 0px" });
    revealSections.forEach(section => revealObserver.observe(section));
    reducedMotion.addEventListener("change", event => {
        if (event.matches) {
            revealObserver.disconnect();
            document.querySelectorAll("main > section, footer").forEach(section => section.getAnimations().forEach(animation => animation.cancel()));
        }
    });
}
