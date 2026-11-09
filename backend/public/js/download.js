"use strict";

(() => {
    const region = document.getElementById("qr-download");
    const container = document.getElementById("qr-code");
    const title = document.getElementById("qr-title");
    const note = document.getElementById("qr-note");
    if (!region || !container || !title || !note) return;

    // [F308] Exibe uma mensagem quando a versão de download não está disponível.
    const showUnavailable = (message) => {
        title.textContent = "Quer abrir esta página no celular?";
        note.textContent = message;
        region.dataset.qrState = "unavailable";
    };

    try {
        const configuredURL = region.dataset.publicUrl.trim();
        const url = new URL(configuredURL || window.location.href);
        const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
        const loopback = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.startsWith("127.") || hostname === "::1" || hostname === "0.0.0.0";
        if (!/^https?:$/.test(url.protocol) || url.username || url.password) {
            showUnavailable("O endereço público do download ainda não foi configurado. Use o botão acima para baixar o APK.");
            return;
        }
        if (loopback) {
            showUnavailable("Você está na prévia local. O QR Code ficará disponível quando o site estiver em um endereço acessível pelo celular. Por enquanto, use o botão de download.");
            return;
        }
        if (typeof window.qrcode !== "function") {
            showUnavailable("Não foi possível gerar o QR Code. O download pelo botão acima continua disponível.");
            return;
        }

        url.hash = "";
        url.search = "";
        const qr = window.qrcode(0, "M");
        qr.addData(url.href);
        qr.make();
        // Only the locally bundled QR encoder produces this SVG; no remote API.
        container.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
        const svg = container.querySelector("svg");
        svg.style.width = "100%";
        svg.style.height = "100%";
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "QR Code para abrir a página de download do KaorCount");
        container.removeAttribute("aria-label");
        title.textContent = "Ou aponte a câmera para o QR Code para baixar:";
        note.textContent = "O QR Code abre esta página no celular. Depois, toque em Baixar para Android.";
        region.dataset.qrState = "ready";
        region.dataset.qrUrl = url.href;
    } catch {
        showUnavailable("O QR Code está indisponível neste endereço. Use o botão de download acima para continuar.");
    }
})();
