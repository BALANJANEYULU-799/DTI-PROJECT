const socket = io('http://localhost:3000');

async function chatWithSeller(itemId) {
    if (!isLoggedIn) {
        showNotification("Please log in to chat with the seller.", "error");
        return;
    }

    try {
        const response = await fetch(`/items`);
        const items = await response.json();
        const item = items.find(i => i._id === itemId);
        if (!item) {
            showNotification("Item not found.", "error");
            return;
        }
        if (item.seller === currentUser) {
            showNotification("You cannot chat with yourself!", "error");
            return;
        }
        const chatRoomId = `${currentUser}_${item.seller}_${itemId}`;
        openChatModal(chatRoomId, item.seller, item.title);
    } catch (error) {
        showNotification("Failed to initiate chat.", "error");
    }
}

function openChatModal(chatRoomId, seller, itemTitle) {
    const existingModal = document.getElementById("chatModal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "chatModal";
    modal.innerHTML = `
        <h3>Chat with ${seller} about "${itemTitle}"</h3>
        <div id="chatMessages"></div>
        <div style="display: flex; margin-top: 10px;">
            <input type="text" id="chatInput" placeholder="Type your message...">
            <button onclick="sendMessage('${chatRoomId}')" class="action-btn" style="width: auto; margin-left: 10px;">Send</button>
        </div>
        <button onclick="document.getElementById('chatModal').remove()" style="margin-top: 10px; background: #ef5350; width: 100%;">Close</button>
    `;
    document.body.appendChild(modal);
    socket.emit('joinRoom', chatRoomId);
    loadChatMessages(chatRoomId);
}

function sendMessage(chatRoomId) {
    const message = document.getElementById("chatInput").value.trim();
    if (!message) {
        showNotification("Please enter a message.", "error");
        return;
    }

    socket.emit('sendMessage', { chatRoomId, sender: currentUser, text: message });
    document.getElementById("chatInput").value = "";
}

async function loadChatMessages(chatRoomId) {
    const chatMessages = document.getElementById("chatMessages");
    chatMessages.innerHTML = "<p>Loading...</p>";

    try {
        const response = await fetch(`/messages/${chatRoomId}`);
        const messages = await response.json();
        chatMessages.innerHTML = "";
        if (messages.length === 0) chatMessages.innerHTML = "<p>No messages yet.</p>";

        messages.forEach(msg => renderMessage(msg, chatMessages));
        socket.on('message', (msg) => renderMessage(msg, chatMessages));
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        showNotification("Failed to load messages.", "error");
        chatMessages.innerHTML = "<p>Error loading messages.</p>";
    }
}

function renderMessage(msg, container) {
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `${msg.sender === currentUser ? "You" : "Seller"}: ${msg.text}`;
    msgDiv.style.cssText = `
        text-align: ${msg.sender === currentUser ? "right" : "left"};
        margin: 5px 0;
        padding: 8px;
        background: ${msg.sender === currentUser ? "#e0f7fa" : "#f0f0f0"};
        border-radius: 5px;
        max-width: 80%;
        word-wrap: break-word;
    `;
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}