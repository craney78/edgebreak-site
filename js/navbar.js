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
// MOBILE MENU
// ========================================

function buildMobileMenu(){

    const desktop = document.querySelector(".eb-navbar-desktop");
    const mobile = document.getElementById("ebMobileContent");

    if(!desktop || !mobile) return;

    mobile.innerHTML = desktop.innerHTML;

    // Initialise dropdowns inside the cloned mobile menu
    initDropdowns(mobile);

}

function initMobileMenu(){

    const toggle = document.getElementById("ebMobileToggle");
    const close = document.getElementById("ebMobileClose");
    const overlay = document.getElementById("ebMobileOverlay");

    if(!toggle || !close || !overlay) return;

    function openMenu(){

        overlay.classList.add("active");

        toggle.setAttribute("aria-expanded","true");

        overlay.setAttribute("aria-hidden","false");

        document.body.style.overflow = "hidden";

    }

    function closeMenu(){

        overlay.classList.remove("active");

        toggle.setAttribute("aria-expanded","false");

        overlay.setAttribute("aria-hidden","true");

        document.body.style.overflow = "";

    }

    toggle.addEventListener("click", openMenu);

    close.addEventListener("click", closeMenu);

    overlay.addEventListener("click", function(e){

        if(e.target === overlay){

            closeMenu();

        }

    });

    document.addEventListener("keydown", function(e){

        if(e.key === "Escape"){

            closeMenu();

        }

    });

}



// ========================================
// AUTH
// ========================================

async function initAuth(){

    if(typeof supabase === "undefined"){

        console.warn("Supabase not found.");

        return;

    }

    const loggedOut = document.getElementById("ebLoggedOut");
    const loggedIn = document.getElementById("ebLoggedIn");
    const logoutBtn = document.getElementById("logoutBtn");

    if(!loggedOut || !loggedIn) return;

    const {
        data: { session }
    } = await supabase.auth.getSession();

    if(session){

        loggedOut.hidden = true;

        loggedIn.hidden = false;

    }
    else{

        loggedOut.hidden = false;

        loggedIn.hidden = true;

    }

    if(logoutBtn && !logoutBtn.dataset.initialised){

        logoutBtn.dataset.initialised = "true";

        logoutBtn.addEventListener("click", async function(e){

            e.preventDefault();

            await supabase.auth.signOut();

            window.location.href = "/login.html";

        });

    }

}

// Keep navbar in sync with login/logout

if(typeof supabase !== "undefined"){

    supabase.auth.onAuthStateChange(() => {

        initAuth();

    });

}

// ========================================
// INITIALISE
// ========================================

initDropdowns();

buildMobileMenu();

initMobileMenu();

initAuth();

