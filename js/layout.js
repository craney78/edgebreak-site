// ========================================
// EdgeBreak Layout Loader
// Loads shared navbar and footer components
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

    try {

        // Load shared CSS
        await loadCSS("/css/navbar.css");
        await loadCSS("/css/footer.css");

        // Load shared HTML
        await loadComponent(
            "navbar",
            "/components/navbar.html"
        );

        await loadComponent(
            "footer",
            "/components/footer.html"
        );

        // Load shared JavaScript
        await loadScript("/js/navbar.js");
        await loadScript("/js/footer.js");

        console.log("✅ EdgeBreak Layout Loaded");

    } catch (error) {

        console.error(
            "❌ Layout failed to load:",
            error
        );

    }

});

// ========================================
// Load HTML Component
// ========================================

async function loadComponent(
    id,
    file
) {

    const container =
        document.getElementById(id);

    if (!container) return;

    const response =
        await fetch(file);

    if (!response.ok) {

        throw new Error(
            `Failed to load ${file}`
        );

    }

    container.innerHTML =
        await response.text();

}

// ========================================
// Load CSS
// ========================================

async function loadCSS(file) {

    if (
        document.querySelector(
            `link[href="${file}"]`
        )
    ) {
        return;
    }

    const link =
        document.createElement("link");

    link.rel = "stylesheet";

    link.href = file;

    document.head.appendChild(link);

}

// ========================================
// Load JavaScript
// ========================================

async function loadScript(file) {

    if (
        document.querySelector(
            `script[src="${file}"]`
        )
    ) {
        return;
    }

    return new Promise((resolve, reject) => {

        const script =
            document.createElement("script");

        script.src = file;

        script.onload = resolve;

        script.onerror = reject;

        document.body.appendChild(script);

    });

}