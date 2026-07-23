// =========================
// LOAD HTML COMPONENTS
// =========================

async function loadComponent(id, file) {

    try {

        const response = await fetch(file);

        if (!response.ok) {
            throw new Error(`Failed to load ${file}`);
        }

        const element = document.getElementById(id);

        if (!element) {
            throw new Error(`Element #${id} not found.`);
        }

        element.innerHTML = await response.text();

    }

    catch (err) {

        console.error(err);

    }

}

// =========================
// INITIALISE COMPONENTS
// =========================

document.addEventListener("DOMContentLoaded", async () => {

    // Load shared HTML

    await loadComponent(
        "navbar",
        "/components/navbar.html"
    );

    await loadComponent(
        "footer",
        "/components/footer.html"
    );

    // Initialise everything that depends on them

    setupAuthButton();
    setupMobileMenu();
    unlockNavigation();
    setupLockedLinks();
    setupFooterAccordion();

});


// =========================
// 🔐 NAV LOGIN / LOGOUT
// =========================

async function setupAuthButton() {

    const btn =
        document.getElementById("authBtn");

    if (!btn) return;

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        btn.innerText = "Logout";
        btn.href = "#";

        btn.onclick = async (e) => {

            e.preventDefault();

            await supabaseClient.auth.signOut();

            window.location.href =
                "/login.html";

        };

    } else {

        btn.innerText = "Login";
        btn.href =
            "/login.html";

        btn.onclick = null;

    }

}

// Keep the auth button in sync if the user logs in/out
supabaseClient.auth.onAuthStateChange(() => {

    setupAuthButton();

});


// =========================
// 📱 MOBILE NAV TOGGLE
// =========================

function setupMobileMenu() {

    const toggle = document.getElementById("menuToggle");
    const nav = document.getElementById("navLinks");

    if (!toggle || !nav) {
        console.warn("Nav elements missing.");
        return;
    }

    const productsMenu =
        document.getElementById("productsMenu");

    const resourcesMenu =
        document.getElementById("resourcesMenu");

    if (!productsMenu || !resourcesMenu) {
        console.warn("Dropdown menus missing.");
        return;
    }

    const productsLink =
        productsMenu.querySelector(".nav-link");

    const resourcesLink =
        resourcesMenu.querySelector(".nav-link");

    const productsDropdown =
        productsMenu.querySelector(".dropdown-content");

    const resourcesDropdown =
        resourcesMenu.querySelector(".dropdown-content");

    

    // =========================
    // OPEN / CLOSE MENU
    // =========================

    toggle.addEventListener("click", () => {

        nav.classList.toggle("active");

        if (!nav.classList.contains("active")) {

            nav.classList.remove("products-open");
            nav.classList.remove("resources-open");

        }

    });

    // =========================
    // MOBILE BACK BUTTON
    // =========================

    function createBackButton(type) {

        const back = document.createElement("a");

        back.href = "#";
        back.className = "mobile-back";
        back.innerHTML = "← Back";

        back.addEventListener("click", (e) => {

            e.preventDefault();

            nav.classList.remove(type);

        });

        return back;

    }

    productsDropdown.prepend(
        createBackButton("products-open")
    );

    resourcesDropdown.prepend(
        createBackButton("resources-open")
    );

    // =========================
    // MOBILE LINK HANDLING
    // =========================

    document.querySelectorAll("#navLinks a").forEach(link => {

        link.addEventListener("click", (e) => {

            // Desktop
            if (window.innerWidth > 768) return;

            // Products
            if (link === productsLink) {

                e.preventDefault();

                nav.classList.add("products-open");

                return;

            }

            // Resources
            if (link === resourcesLink) {

                e.preventDefault();

                nav.classList.add("resources-open");

                return;

            }

            // Normal links
            nav.classList.remove("active");
            nav.classList.remove("products-open");
            nav.classList.remove("resources-open");

        });

    });

}


// =========================
// 🔓 UNLOCK NAVIGATION
// =========================

async function unlockNavigation() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    // If no session → keep locked state
    if (!session || !session.user) return;

    // Get profile
    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("is_active")
        .eq("id", session.user.id)
        .single();

    // If NOT active → keep locked
    if (!profile || profile.is_active !== true) return;

    // ✅ USER IS ACTIVE → UNLOCK NAV

    document.querySelectorAll(".locked-link").forEach(link => {

        // Remove lock icon
        const icon = link.querySelector(".lock-icon");

        if (icon) {
            icon.remove();
        }

        // Remove locked behaviour
        link.classList.remove("locked-link");

    });

}


// =========================
// 🔒 LOCKED NAV LINKS
// =========================

function setupLockedLinks() {

    document.querySelectorAll(".locked-link").forEach(link => {

        link.addEventListener("click", function (e) {

            if (this.classList.contains("locked-link")) {

                e.preventDefault();

                window.location.href =
                    "/pricing.html";

            }

        });

    });

}




// =========================
// 📱 MOBILE FOOTER ACCORDION
// =========================

function setupFooterAccordion() {

    // Desktop does nothing
    if (window.innerWidth > 768) return;

    const sections =
        document.querySelectorAll(".footer-v2-column");

    sections.forEach(section => {

        const title =
            section.querySelector(".footer-v2-column-title");

        const links =
            section.querySelector(".footer-v2-links");

        if (!title || !links) return;

        title.addEventListener("click", () => {

            const isOpen =
                section.classList.contains("open");

            // Close every section
            sections.forEach(item => {

                item.classList.remove("open");

                const list =
                    item.querySelector(".footer-v2-links");

                if (list) {
                    list.style.display = "none";
                }

            });

            // Open the clicked section
            if (!isOpen) {

                section.classList.add("open");

                links.style.display = "block";

            }

        });

    });

}

