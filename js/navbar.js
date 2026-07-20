// ========================================
// EDGEBREAK NAVBAR
// ========================================

console.log(
    "✅ Navbar JavaScript Loaded"
);

// ========================================
// DROPDOWN MENUS
// ========================================

function initDropdowns(root = document){

    const dropdownButtons = root.querySelectorAll(
        ".eb-nav-button, .eb-workspace-button"
    );

    function closeMenus(){

        root.querySelectorAll(
            ".eb-dropdown-menu, .eb-workspace-menu"
        ).forEach(menu => {

            menu.classList.remove("active");

        });

        dropdownButtons.forEach(button => {

            button.classList.remove("active");

            button.setAttribute("aria-expanded", "false");

        });

    }

    dropdownButtons.forEach(button => {

        button.addEventListener("click", function(e){

            e.stopPropagation();

            const menu = document.getElementById(
                this.getAttribute("aria-controls")
            );

            if(!menu) return;

            const isOpen = menu.classList.contains("active");

            closeMenus();

            if(!isOpen){

                menu.classList.add("active");

                this.classList.add("active");

                this.setAttribute("aria-expanded", "true");

            }

        });

    });

    document.addEventListener("click", closeMenus);

    document.addEventListener("keydown", function(e){

        if(e.key === "Escape"){

            closeMenus();

        }

    });

}




// ========================================
// AUTH
// ========================================

async function initAuth(){

    const client = window.supabaseClient;

    if(!client){

        console.warn("Supabase client not found.");

        return;

    }

    const loggedOut = document.getElementById("ebLoggedOut");
    const loggedIn = document.getElementById("ebLoggedIn");
    const logoutBtn = document.getElementById("logoutBtn");

    const mobileGuest = document.getElementById("ebMobileGuest");
    const mobileWorkspace = document.getElementById("ebMobileWorkspace");
    const mobileLogoutBtn = document.getElementById("ebMobileLogout");

    if(!loggedOut || !loggedIn) return;

    const {
        data: { session }
    } = await client.auth.getSession();

    if(session){

        loggedOut.hidden = true;

        loggedIn.hidden = false;

        if(mobileGuest) mobileGuest.hidden = true;

        if(mobileWorkspace) mobileWorkspace.hidden = false;

    }
    else{

        loggedOut.hidden = false;

        loggedIn.hidden = true;

        if(mobileGuest) mobileGuest.hidden = false;

        if(mobileWorkspace) mobileWorkspace.hidden = true;

    }

    // ========================================
    // DESKTOP LOGOUT
    // ========================================

    if(logoutBtn && !logoutBtn.dataset.initialised){

        logoutBtn.dataset.initialised = "true";

        logoutBtn.addEventListener("click", async function(e){

            e.preventDefault();

            await client.auth.signOut();

            window.location.href = "/login.html";

        });

    }

    // ========================================
    // MOBILE LOGOUT
    // ========================================

    if(mobileLogoutBtn && !mobileLogoutBtn.dataset.initialised){

        mobileLogoutBtn.dataset.initialised = "true";

        mobileLogoutBtn.addEventListener("click", async function(e){

            e.preventDefault();

            await client.auth.signOut();

            window.location.href = "/login.html";

        });

    }

}


// ========================================
// KEEP NAVBAR IN SYNC
// ========================================

const client = window.supabaseClient;

if(client){

    client.auth.onAuthStateChange(() => {

        initAuth();

    });

}



// ========================================
// ACTIVE PAGE
// ========================================

function highlightCurrentPage(){

    const currentPath = window.location.pathname;

    document.querySelectorAll("a[href]").forEach(link => {

        const href = link.getAttribute("href");

        if(!href) return;

        if(href === currentPath){

            link.classList.add("active");

        }

    });

}


/* ========================================
MOBILE NAVIGATION
======================================== */

function initMobileMenu() {

    const overlay = document.getElementById("ebMobileOverlay");
    const openBtn = document.getElementById("ebMobileToggle");
    const closeBtn = document.getElementById("ebMobileClose");

    if (!overlay || !openBtn || !closeBtn) {
        return;
    }

    function openMenu() {

        overlay.classList.add("active");

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        openBtn.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.style.overflow = "hidden";

    }

    function closeMenu() {

        overlay.classList.remove("active");

        overlay.setAttribute(
            "aria-hidden",
            "true"
        );

        openBtn.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.style.overflow = "";

    }

    openBtn.addEventListener(
        "click",
        openMenu
    );

    closeBtn.addEventListener(
        "click",
        closeMenu
    );

    overlay.addEventListener(
        "click",
        (e) => {

            if (e.target === overlay) {

                closeMenu();

            }

        }
    );

    document.addEventListener(
        "keydown",
        (e) => {

            if (
                e.key === "Escape" &&
                overlay.classList.contains("active")
            ) {

                closeMenu();

            }

        }
    );

    /* ========================================
    CLOSE MENU WHEN LINK IS CLICKED
    ======================================== */

    document
        .querySelectorAll("#ebMobileOverlay a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    closeMenu();

                }
            );

        });

    /* ========================================
    MOBILE DROPDOWNS
    ======================================== */

    document
        .querySelectorAll(".eb-mobile-dropdown")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    button.classList.toggle("active");

                    const menu =
                        button.nextElementSibling;

                    menu.classList.toggle("active");

                }
            );

        });

}
// ========================================
// INITIALISE
// ========================================

initDropdowns();

initMobileMenu();

highlightCurrentPage();

initAuth();
