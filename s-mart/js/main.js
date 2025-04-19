window.onload = function() {
    loadItems();
    loadOffers();
    updateProfileState();
};

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchItems();
    });

    document.addEventListener("click", (e) => {
        const dropdowns = document.querySelectorAll(".dropdown");
        const navItems = document.querySelectorAll(".nav-item");
        if (!Array.from(dropdowns).some(d => d.contains(e.target)) && 
            !Array.from(navItems).some(n => n.contains(e.target))) {
            dropdowns.forEach(d => d.classList.add("hidden"));
        }
    });

    const debouncedSearch = debounce(searchItems, 300);
    document.getElementById("searchInput").addEventListener("input", debouncedSearch);
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}