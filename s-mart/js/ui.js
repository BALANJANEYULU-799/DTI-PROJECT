function toggleProfile() {
    const profileDropdown = document.getElementById('profileDropdown');
    profileDropdown.classList.toggle('hidden');
    document.getElementById('sellDropdown').classList.add('hidden');
    document.getElementById('cartDropdown').classList.add('hidden');
    document.getElementById('helpDropdown').classList.add('hidden');
}

function toggleSell() {
    document.getElementById('sellDropdown').classList.toggle('hidden');
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('cartDropdown').classList.add('hidden');
    document.getElementById('helpDropdown').classList.add('hidden');
}

function toggleCart() {
    const cartDropdown = document.getElementById('cartDropdown');
    cartDropdown.classList.toggle('hidden');
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('sellDropdown').classList.add('hidden');
    document.getElementById('helpDropdown').classList.add('hidden');
    if (!cartDropdown.classList.contains('hidden')) updateCartCount();
}

function toggleHelp() {
    document.getElementById('helpDropdown').classList.toggle('hidden');
    document.getElementById('profileDropdown').classList.add('hidden');
    document.getElementById('sellDropdown').classList.add('hidden');
    document.getElementById('cartDropdown').classList.add('hidden');
}