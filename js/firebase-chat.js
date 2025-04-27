import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDb7Rw9gf3k3OqUjpImv03oBJbDdAzsGpM",
    authDomain: "gandi-hub-474d2.firebaseapp.com",
    projectId: "gandi-hub-474d2",
    storageBucket: "gandi-hub-474d2.appspot.com",
    messagingSenderId: "877278458127",
    appId: "1:877278458127:web:22728337144c770a4b8e7a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveChat(messages, title) {
    try {
        const chatData = {
            title: title || `Chat ${new Date().toLocaleString()}`,
            messages: messages,
            timestamp: new Date(),
            type: title ? 'saved' : 'history'
        };
        
        await addDoc(collection(db, "chats"), chatData);
        await loadChatHistory();
    } catch (error) {
        console.error("Error saving chat:", error);
    }
}

export async function loadChatHistory() {
    try {
        const historyList = document.getElementById('chatHistoryList');
        const savedList = document.getElementById('savedChatsList');
        
        historyList.innerHTML = '';
        savedList.innerHTML = '';

        const q = query(collection(db, "chats"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const chat = doc.data();
            const element = createChatElement(chat, doc.id);
            
            if (chat.type === 'saved') {
                savedList.appendChild(element);
            } else {
                historyList.appendChild(element);
            }
        });
    } catch (error) {
        console.error("Error loading chats:", error);
    }
}

function createChatElement(chat, chatId) {
    const a = document.createElement('a');
    a.href = '#';
    a.className = 'nav-link chat-history-item';
    a.innerHTML = `
        <i class="bi bi-${chat.type === 'saved' ? 'bookmark-fill' : 'clock-history'}"></i>
        <span>${chat.title}</span>
    `;
    a.onclick = (e) => {
        e.preventDefault();
        loadChatMessages(chatId);
    };
    return a;
}
