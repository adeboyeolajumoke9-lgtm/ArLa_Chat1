/* =====================================
   ARLA UNIVERSE
   Interactive functionality
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================
       1. PAGE NAVIGATION
    ================================= */

    const navLinks = document.querySelectorAll(".nav-link");
    const pages = document.querySelectorAll(".page-section");
    const sidebar = document.getElementById("sidebar");
    const menuToggle = document.getElementById("menuToggle");

    function showPage(pageId) {
        const targetPage = document.getElementById(pageId);

        // Do not navigate to a section that does not exist.
        if (!targetPage || !targetPage.classList.contains("page-section")) {
            console.error("ArLa Universe: Page not found:", pageId);
            showToast("That section could not be found. 💗");
            return;
        }

        // Hide every page.
        pages.forEach((page) => {
            page.classList.remove("active");
        });

        // Display the selected page.
        targetPage.classList.add("active");

        // Update the active navigation button.
        navLinks.forEach((link) => {
            const isActive = link.dataset.page === pageId;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        // Close the mobile menu after navigation.
        if (sidebar) {
            sidebar.classList.remove("mobile-open");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Open navigation");
        }

        // Start the new section at its top.
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    // Sidebar navigation buttons.
    navLinks.forEach((link) => {
        link.addEventListener("click", () => {
            showPage(link.dataset.page);
        });
    });

    // Home buttons and other buttons that lead to sections.
    document.querySelectorAll("[data-go]").forEach((button) => {
        button.addEventListener("click", () => {
            showPage(button.dataset.go);
        });
    });

    // Brand logo returns to Home.
    document.querySelectorAll("[data-page]").forEach((element) => {
        if (!element.classList.contains("nav-link")) {
            element.addEventListener("click", (event) => {
                event.preventDefault();
                showPage(element.dataset.page);
            });
        }
    });

    // Mobile navigation toggle.
    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("mobile-open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));

            menuToggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );

            menuToggle.textContent = isOpen ? "✕" : "☰";
        });
    }

    // Close the mobile menu when clicking outside it.
    document.addEventListener("click", (event) => {
        if (!sidebar || !menuToggle) return;

        const clickedInsideSidebar = sidebar.contains(event.target);
        const clickedMenuButton = menuToggle.contains(event.target);

        if (
            !clickedInsideSidebar &&
            !clickedMenuButton &&
            sidebar.classList.contains("mobile-open")
        ) {
            sidebar.classList.remove("mobile-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰";
            menuToggle.setAttribute("aria-label", "Open navigation");
        }
    });


    /* =================================
       2. RELATIONSHIP COUNTER
    ================================= */

    const relationshipStart = new Date(2025, 9, 2);
    const daysTogether = document.getElementById("daysTogether");

    function updateRelationshipCounter() {
        if (!daysTogether) return;

        const today = new Date();

        const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

        const startDate = new Date(
            relationshipStart.getFullYear(),
            relationshipStart.getMonth(),
            relationshipStart.getDate()
        );

        const difference =
            startOfToday.getTime() - startDate.getTime();

        const numberOfDays = Math.floor(
            difference / (1000 * 60 * 60 * 24)
        );

        daysTogether.textContent =
            Math.max(0, numberOfDays).toLocaleString();
    }

    updateRelationshipCounter();


    /* =================================
       3. ANNIVERSARY COUNTDOWN
    ================================= */

    const anniversaryCountdown =
        document.getElementById("anniversaryCountdown");

    function updateAnniversaryCountdown() {
        if (!anniversaryCountdown) return;

        const now = new Date();

        let nextAnniversary = new Date(
            now.getFullYear(),
            9,
            2,
            0,
            0,
            0
        );

        // If this year's anniversary has passed,
        // calculate the next year's anniversary.
        if (now.getTime() >= nextAnniversary.getTime()) {
            nextAnniversary = new Date(
                now.getFullYear() + 1,
                9,
                2,
                0,
                0,
                0
            );
        }

        const remaining = Math.max(
            0,
            nextAnniversary.getTime() - now.getTime()
        );

        const totalDays = Math.floor(
            remaining / (1000 * 60 * 60 * 24)
        );

        const hours = Math.floor(
            (remaining % (1000 * 60 * 60 * 24)) /
            (1000 * 60 * 60)
        );

        if (totalDays === 0) {
            anniversaryCountdown.textContent =
                `Our anniversary is almost here! ${hours} hours to go 💗`;
        } else {
            anniversaryCountdown.textContent =
                `${totalDays} days and ${hours} hours until October 2 💗`;
        }
    }

    updateAnniversaryCountdown();

    // Refresh the countdown periodically.
    setInterval(updateAnniversaryCountdown, 60000);


   
    /* =================================
       4. SUPABASE SHARED CHAT
    ================================= */

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatInput");
    const chatMessages = document.getElementById("chatMessages");
    const emojiButton = document.getElementById("emojiButton");

    const SUPABASE_URL = "https://xvenatyxdpdtunycrkjz.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable__oCe2TMQwkiF1tI6FzPY7A_7MCnmv1_";

    let supabaseClient = null;
    let currentUser = null;
    let realtimeChannel = null;
    let knownMessageIds = new Set();
    let initializedUserId = null;

    function getCurrentTime(dateValue) {
        return new Date(dateValue || Date.now()).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function scrollChatToBottom() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    function createMessage(record) {
        const isSent = record.sender_id === currentUser?.id;

        const row = document.createElement("div");
        row.className = isSent
            ? "message-row sent"
            : "message-row received";
        row.dataset.messageId = record.id;

        if (!isSent) {
            const avatar = document.createElement("div");
            avatar.className = "message-avatar";
            avatar.textContent = "E";
            row.appendChild(avatar);
        }

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";

        const sender = document.createElement("small");
        sender.textContent = isSent ? "You" : "Ella";
        sender.style.display = "block";

        const paragraph = document.createElement("p");
        paragraph.textContent = record.content;

        const time = document.createElement("span");
        time.textContent = getCurrentTime(record.created_at);

        bubble.append(sender, paragraph, time);
        row.appendChild(bubble);

        return row;
    }

    function displayMessage(record) {
        if (!record?.id || knownMessageIds.has(record.id)) return;

        knownMessageIds.add(record.id);
        chatMessages.appendChild(createMessage(record));
        scrollChatToBottom();
    }

    // Build the sign-in panel without changing the rest of your HTML.
    let authPanel = null;
    let authStatus = null;
    let signOutButton = null;

    if (chatMessages) {
        authPanel = document.createElement("form");
        authPanel.style.cssText =
            "max-width:420px;margin:20px auto;padding:20px;" +
            "border:1px solid rgba(220,170,190,.4);border-radius:16px;" +
            "display:grid;gap:12px;";

        const heading = document.createElement("h3");
        heading.textContent = "Our private little space 💗";

        const description = document.createElement("p");
        description.textContent =
            "Sign in using the account created for you.";

        const email = document.createElement("input");
        email.type = "email";
        email.placeholder = "Email address";
        email.autocomplete = "username";
        email.required = true;
        email.style.cssText =
            "box-sizing:border-box;width:100%;padding:12px;border-radius:10px;";

        const password = document.createElement("input");
        password.type = "password";
        password.placeholder = "Password";
        password.autocomplete = "current-password";
        password.required = true;
        password.style.cssText =
            "box-sizing:border-box;width:100%;padding:12px;border-radius:10px;";

        const loginButton = document.createElement("button");
        loginButton.type = "submit";
        loginButton.textContent = "Sign in 💗";

        authStatus = document.createElement("p");
        authStatus.setAttribute("role", "status");

        authPanel.append(
            heading, description, email, password, loginButton, authStatus
        );

        chatMessages.parentNode.insertBefore(authPanel, chatMessages);

        signOutButton = document.createElement("button");
        signOutButton.type = "button";
        signOutButton.textContent = "Sign out";
        signOutButton.style.display = "none";

        const chatHeader = chatMessages.closest(".chat-card")
            ?.querySelector(".chat-header");

        if (chatHeader) chatHeader.appendChild(signOutButton);

        authPanel.addEventListener("submit", async (event) => {
            event.preventDefault();

            if (!supabaseClient) {
                authStatus.textContent =
                    "Chat service unavailable. Check the Supabase script in index.html.";
                return;
            }

            loginButton.disabled = true;
            authStatus.textContent = "Signing in…";

            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email.value.trim(),
                password: password.value
            });

            loginButton.disabled = false;

            if (error) {
                authStatus.textContent =
                    "Sign-in failed. Check your email and password.";
                console.error("ArLa sign-in error:", error.message);
            } else {
                password.value = "";
                authStatus.textContent = "Signed in 💗";
            }
        });

        signOutButton.addEventListener("click", async () => {
            const { error } = await supabaseClient.auth.signOut();

            if (error) {
                showToast("Unable to sign out. Please try again.");
                console.error(error.message);
            }
        });
    }

    function setChatVisibility(signedIn) {
        if (authPanel) authPanel.style.display = signedIn ? "none" : "grid";
        if (chatMessages) chatMessages.style.display = signedIn ? "" : "none";
        if (chatForm) chatForm.style.display = signedIn ? "" : "none";
        if (emojiButton) emojiButton.style.display = signedIn ? "" : "none";
        if (signOutButton) signOutButton.style.display =
            signedIn ? "inline-block" : "none";

        const notice = document.querySelector(".demo-notice");
        if (notice) {
            notice.textContent = signedIn
                ? "Private ArLa chat · shared across your signed-in devices 💗"
                : "Sign in to open your private ArLa conversation.";
        }

        const note = chatForm?.parentElement.querySelector(".small-note");
        if (note) {
            note.textContent = signedIn
                ? "A little space for the two of you. 💗"
                : "Only your authorized accounts should have access.";
        }
    }

    async function loadMessages() {
        if (!supabaseClient || !currentUser || !chatMessages) return;

        const { data, error } = await supabaseClient
            .from("messages")
            .select("id, sender_id, content, created_at")
            .order("created_at", { ascending: true });

        if (error) {
            console.error("ArLa message loading error:", error.message);
            showToast("Couldn't load messages. Check your Supabase policies.");
            return;
        }

        chatMessages.replaceChildren();
        knownMessageIds = new Set();

        const dateLabel = document.createElement("div");
        dateLabel.className = "chat-date";
        dateLabel.textContent = "YOUR LITTLE UNIVERSE 💗";
        chatMessages.appendChild(dateLabel);

        (data || []).forEach(displayMessage);
        scrollChatToBottom();
    }

    function subscribeToMessages() {
        if (!supabaseClient || !currentUser) return;

        if (realtimeChannel) {
            supabaseClient.removeChannel(realtimeChannel);
        }

        realtimeChannel = supabaseClient
            .channel("arla-shared-messages")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages"
                },
                (payload) => displayMessage(payload.new)
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("ArLa real-time chat connected 💗");
                }
            });
    }

    async function activateChat(user) {
        if (!user || initializedUserId === user.id) return;

        initializedUserId = user.id;
        currentUser = user;
        setChatVisibility(true);

        if (chatMessages) chatMessages.replaceChildren();

        subscribeToMessages();
        await loadMessages();
    }

    async function deactivateChat() {
        initializedUserId = null;
        currentUser = null;
        knownMessageIds = new Set();

        if (supabaseClient && realtimeChannel) {
            await supabaseClient.removeChannel(realtimeChannel);
            realtimeChannel = null;
        }

        if (chatMessages) chatMessages.replaceChildren();

        setChatVisibility(false);

        if (authStatus) {
            authStatus.textContent =
                "Sign in to see messages shared by you and Ella.";
        }
    }

    if (chatForm && chatInput && chatMessages) {
        setChatVisibility(false);

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {
            if (authStatus) {
                authStatus.textContent =
                    "Supabase library missing. Check index.html and refresh.";
            }
            console.error("ArLa: Supabase JS library not found.");
        } else {
            supabaseClient = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

            supabaseClient.auth.onAuthStateChange((event, session) => {
                if (session?.user) {
                    setTimeout(() => activateChat(session.user), 0);
                } else if (event === "SIGNED_OUT") {
                    setTimeout(() => deactivateChat(), 0);
                }
            });

            supabaseClient.auth.getSession().then(({ data, error }) => {
                if (error) {
                    console.error("ArLa session error:", error.message);
                    if (authStatus) {
                        authStatus.textContent =
                            "Could not check your session. Refresh and try again.";
                    }
                    return;
                }

                if (data.session?.user) {
                    activateChat(data.session.user);
                } else if (authStatus) {
                    authStatus.textContent =
                        "Sign in to see messages shared by you and Ella.";
                }
            });
        }

        chatForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const content = chatInput.value.trim();

            if (!content) {
                showToast("Write a little message first. 💗");
                return;
            }

            if (!supabaseClient || !currentUser) {
                showToast("Please sign in before sending a message.");
                return;
            }

            const sendButton =
                chatForm.querySelector('button[type="submit"]');

            if (sendButton) sendButton.disabled = true;

            const { error } = await supabaseClient
                .from("messages")
                .insert({
                    sender_id: currentUser.id,
                    content
                });

            if (sendButton) sendButton.disabled = false;

            if (error) {
                console.error("ArLa send error:", error.message);
                showToast("Message not sent. Check your connection and policies.");
                return;
            }

            chatInput.value = "";
            chatInput.focus();
        });
    }

    if (emojiButton && chatInput) {
        emojiButton.addEventListener("click", () => {
            chatInput.value += " 💗";
            chatInput.focus();
        });
    }

    /* =================================
       5. MEMORY PHOTO LIGHTBOX
    ================================= */

    const photoModal = document.getElementById("photoModal");
    const lightboxImage = document.getElementById("lightboxImage");
    const lightboxCaption = document.getElementById("lightboxCaption");

    document.querySelectorAll(".memory-card").forEach((card) => {
        card.addEventListener("click", () => {
            const photoPath = card.dataset.photo;
            const caption = card.dataset.caption || "A beautiful memory 💗";

            if (!photoModal || !lightboxImage || !lightboxCaption) {
                return;
            }

            lightboxImage.src = photoPath;
            lightboxCaption.textContent = caption;

            openModal(photoModal);
        });
    });


    /* =================================
       6. LOVE LETTERS
    ================================= */

    const letterModal = document.getElementById("letterModal");
    const letterTitle = document.getElementById("letterTitle");
    const letterBody = document.getElementById("letterBody");

    const letters = {
        first: {
            title: "To the girl I choose 💗",
            body: `My Ella,

Sometimes I think about how something as small as a message could become such a beautiful part of my life.

You came into my world unexpectedly, but loving you has become one of the most meaningful parts of my story.

I don't want to love you only when everything feels easy. I want to learn you, understand you, respect you, and keep showing up for you.

You deserve honesty, tenderness, patience, and a love that makes you feel safe.

Out of all the people I could have met, I'm grateful that I met you.

If I had to begin this story again, I would still want the chance to find you.

You are my Ella, and you will always have a special place in my heart.`
        },

        distance: {
            title: "When I miss you 🌙",
            body: `My beautiful girl,

Some days, the distance between us feels so small because I can hear your voice, read your messages, and imagine your smile.

Other days, I wish I could simply reach for your hand, pull you into a hug, and remind you without using a single word that you are loved.

Until I can do those little things whenever I want, I hope my words remind you that you matter to me.

I look forward to more mornings together, more dates, more laughter, and the ordinary moments that become extraordinary when I share them with you.

Until then, take care of yourself for me, my love.

Somewhere, your Arry is thinking about you. 💗`
        },

        forever: {
            title: "My promise to you 🌷",
            body: `My Ella,

I cannot promise that every day will be perfect. We are two people learning, growing, and figuring things out together.

But I want to keep choosing honesty over hiding, understanding over assumptions, and communication over silence.

I want to listen when you are hurt, respect your feelings when we disagree, and take responsibility when my actions cause pain.

I want us to have a love where neither of us has to be afraid to speak honestly.

And when life gives us beautiful moments, I want us to celebrate them together.

I hope we keep building something that feels good not only in our words, but in our actions.

Thank you for being part of my story.

With all my love,
Your Arry. ❤️`
        }
    };

    document.querySelectorAll("[data-letter]").forEach((button) => {
        button.addEventListener("click", () => {
            const letter = letters[button.dataset.letter];

            if (!letter || !letterModal || !letterTitle || !letterBody) {
                showToast("This letter could not be opened. 💌");
                return;
            }

            letterTitle.textContent = letter.title;
            letterBody.textContent = letter.body;

            openModal(letterModal);
        });
    });


    /* =================================
       7. MODAL HELPERS
    ================================= */

    function openModal(modal) {
        if (!modal) return;

        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");

        document.body.style.overflow = "hidden";

        const closeButton = modal.querySelector(".modal-close");

        if (closeButton) {
            closeButton.focus();
        }
    }

    function closeModal(modal) {
        if (!modal) return;

        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");

        // Restore scrolling only when no other modal is open.
        if (!document.querySelector(".modal.open")) {
            document.body.style.overflow = "";
        }
    }

    document.querySelectorAll("[data-close]").forEach((button) => {
        button.addEventListener("click", () => {
            const modalId = button.dataset.close;

            closeModal(document.getElementById(modalId));
        });
    });

    // Close an open modal with Escape.
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;

        document.querySelectorAll(".modal.open").forEach((modal) => {
            closeModal(modal);
        });

        if (sidebar && menuToggle) {
            sidebar.classList.remove("mobile-open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.textContent = "☰";
        }
    });


    /* =================================
       8. TOAST NOTIFICATIONS
    ================================= */

    const toast = document.getElementById("toast");
    let toastTimer;

    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 2800);
    }

    // Let other functions in this file use showToast.
    window.showArLaToast = showToast;


    /* =================================
       9. INITIAL PAGE
    ================================= */

    // Ensure Home is visible on first load.
    showPage("home");

    console.log("💗 ArLa Universe loaded successfully!");

});