document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
});

async function fetchItems() {
    try {
        const response = await fetch('/items');
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error fetching items:', error);
    }
}

function displayItems(items) {
    const productList = document.getElementById('productList');
    productList.innerHTML = '';
    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'product-item';
        itemDiv.style.animationDelay = `${index * 0.1}s`;
        itemDiv.innerHTML = `
            <img src="${item.image || '/assets/placeholder.jpg'}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>Author/Manufacturer: ${item.author || 'N/A'}</p>
            <p>Category: ${item.category}</p>
            <p>Price: $${item.price.toFixed(2)}</p>
            <p>Condition: ${item.condition}</p>
            <p>${item.conditionDesc || 'No description'}</p>
            <button onclick="addToCart('${item._id}')">Add to Cart</button>
        `;
        productList.appendChild(itemDiv);
    });
}

async function listItem() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) {
        alert('Please sign in to list an item.');
        toggleProfile();
        return;
    }

    const title = document.getElementById('itemTitle').value.trim();
    const author = document.getElementById('itemAuthor').value.trim() || 'N/A';
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const condition = document.getElementById('itemCondition').value;
    const conditionDesc = document.getElementById('conditionDesc').value.trim();
    const image = document.getElementById('itemImage').files[0];
    const seller = user.username;

    if (!title || !price || !condition) {
        alert('Please fill in Title, Price, and Condition.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('condition', condition);
    formData.append('conditionDesc', conditionDesc);
    formData.append('seller', seller);
    if (image) formData.append('image', image);

    try {
        const response = await fetch('/items', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        console.log('List item response:', data);
        if (response.ok) {
            alert('Item listed successfully!');
            clearSellForm();
            fetchItems();
            toggleSell();
        } else {
            alert('Failed to list item: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error listing item: ' + error.message);
        console.error('List item error:', error);
    }
}

function clearSellForm() {
    document.getElementById('itemTitle').value = '';
    document.getElementById('itemAuthor').value = '';
    document.getElementById('itemCategory').value = 'Textbooks';
    document.getElementById('itemPrice').value = '';
    document.getElementById('itemCondition').value = 'New';
    document.getElementById('conditionDesc').value = '';
    document.getElementById('itemImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
}

function previewImage() {
    const file = document.getElementById('itemImage').files[0];
    const preview = document.getElementById('imagePreview');
    if (file) {
        preview.src = URL.createObjectURL(file);
        preview.classList.remove('hidden');
    }
}

async function searchItems() {
    const query = document.getElementById('searchInput').value.trim();
    const filter = document.getElementById('searchFilter').value;
    try {
        const response = await fetch(`/search?query=${encodeURIComponent(query)}&filter=${filter}`);
        const items = await response.json();
        displayItems(items);
    } catch (error) {
        console.error('Error searching items:', error);
    }
}

async function addToCart(itemId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) {
        alert('Please sign in to add items to cart.');
        toggleProfile();
        return;
    }

    try {
        const response = await fetch('/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, itemId })
        });
        const data = await response.json();
        console.log('Add to cart response:', data);
        if (response.ok) {
            alert('Item added to cart!');
            updateCartCount();
        } else {
            alert('Failed to add to cart: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error adding to cart: ' + error.message);
        console.error('Add to cart error:', error);
    }
}