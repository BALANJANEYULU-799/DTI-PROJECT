document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});

async function updateCartCount() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartCount = document.getElementById('cartCount');
    if (!user || !user.userId) {
        cartCount.textContent = '0';
        return;
    }

    try {
        const response = await fetch(`/cart/${user.userId}`);
        const cartItems = await response.json();
        cartCount.textContent = cartItems.length;
        displayCartItems(cartItems);
    } catch (error) {
        console.error('Error updating cart count:', error);
        cartCount.textContent = '0';
    }
}

function displayCartItems(items) {
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    cartItemsDiv.innerHTML = '';
    let total = 0;

    items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'product-item';
        itemDiv.style.animationDelay = `${index * 0.1}s`;
        itemDiv.innerHTML = `
            <img src="${item.image || '/assets/placeholder.jpg'}" alt="${item.title}">
            <h3>${item.title}</h3>
            <p>Price: $${item.price.toFixed(2)}</p>
            <button onclick="removeFromCart('${item._id}')">Remove</button>
        `;
        cartItemsDiv.appendChild(itemDiv);
        total += item.price;
    });

    cartTotalSpan.textContent = total.toFixed(2);
}

async function removeFromCart(itemId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) return;

    try {
        const response = await fetch('/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, itemId })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Item removed from cart!');
            updateCartCount();
        } else {
            alert('Failed to remove from cart: ' + data.error);
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
}

async function proceedToPayment() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) {
        alert('Please sign in to proceed to payment.');
        toggleProfile();
        return;
    }

    try {
        const response = await fetch(`/cart/${user.userId}`);
        const cartItems = await response.json();
        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const total = cartItems.reduce((sum, item) => sum + item.price, 0);
        const paymentResponse = await fetch('/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId, amount: total })
        });
        const paymentData = await paymentResponse.json();
        console.log('Payment response:', paymentData);
        if (paymentResponse.ok) {
            alert('Payment successful! Items will be marked as sold.');
            await fetch('/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.userId })
            });
            updateCartCount();
            toggleCart();
        } else {
            alert('Payment failed: ' + paymentData.error);
        }
    } catch (error) {
        alert('Error during payment: ' + error.message);
        console.error('Payment error:', error);
    }
}

async function checkout() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.userId) {
        alert('Please sign in to clear cart.');
        toggleProfile();
        return;
    }

    try {
        const response = await fetch('/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.userId })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Cart cleared successfully!');
            updateCartCount();
            toggleCart();
        } else {
            alert('Failed to clear cart: ' + data.error);
        }
    } catch (error) {
        alert('Error during checkout: ' + error.message);
        console.error('Checkout error:', error);
    }
}