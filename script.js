import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
    apiKey: "AIzaSyAyMy_k_nEcS0d3yvkADSmV5nESXyh7iIk",
    authDomain: "artseia.firebaseapp.com",
    projectId: "artseia",
    storageBucket: "artseia.firebasestorage.app",
    messagingSenderId: "744755377300",
    appId: "1:744755377300:web:a36b65d72e4a43df607081",
    measurementId: "G-T0V8CJMJ6W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// --- Показ страниц ---
function showPage(page) {
    const content = document.getElementById('content');

    if (page === 'home') {
        content.innerHTML = `
            <h3>The web for artists</h3>
            <form id="uploadForm">
                <label>Upload your art!</label><br>
                <input type="file" id="imgInput" accept="image/*">
                <button type="submit">Upload</button>
            </form>
            <div id="arts"></div>
        `;
        document.getElementById('uploadForm').addEventListener('submit', uploadArt);
        loadArts();
    }

    else if (page === 'gallery') {
        content.innerHTML = `
            <h3>Gallery</h3>
            <div id="arts"></div>
        `;
        loadArts();
    }

    else if (page === 'profile') {
        const user = auth.currentUser;
        const name = user ? user.email : localStorage.getItem('username') || 'Guest';
        content.innerHTML = `
            <h3>Profile</h3>
            <p>Username: <b>${name}</b></p>
            <button onclick="alert('Donations coming soon!')">Donate</button>
        `;
    }

    else if (page === 'login') {
        content.innerHTML = `
            <h3>Login</h3>
            <form id="loginForm">
                <label>Email:</label><br>
                <input type="email" id="loginEmail" required><br>
                <label>Password:</label><br>
                <input type="password" id="loginPass" required><br>
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="showPage('register')">Register</a></p>
            <p id="loginMessage"></p>
        `;

        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const pass = document.getElementById('loginPass').value;

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                document.getElementById('username').textContent = email;
                localStorage.setItem('username', email);
                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('logoutBtn').style.display = 'inline';
                showPage('home');
            } catch (error) {
                document.getElementById('loginMessage').textContent = error.message;
            }
        });
    }

    else if (page === 'register') {
        content.innerHTML = `
            <h3>Register</h3>
            <form id="registerForm">
                <label>Email:</label><br>
                <input type="email" id="regEmail" required><br>
                <label>Password:</label><br>
                <input type="password" id="regPass" required><br>
                <button type="submit">Create Account</button>
            </form>
            <p>Already have an account? <a href="#" onclick="showPage('login')">Login</a></p>
            <p id="regMessage"></p>
        `;

        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPass').value;

            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                alert("Account created!");
                showPage('login');
            } catch (error) {
                document.getElementById('regMessage').textContent = error.message;
            }
        });
    }
}


async function uploadArt(event) {
    event.preventDefault();
    const fileInput = document.getElementById('imgInput');
    const file = fileInput.files[0];
    const currentUser = auth.currentUser;

    if (!file) { alert("Выберите картинку!"); return; }

    if (currentUser) {
        const storageRef = ref(storage, `images/${currentUser.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        await addDoc(collection(db, "images"), { userId: currentUser.uid, username: currentUser.email, url, likes: 0 });
        loadArts();
    } else {
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const arts = JSON.parse(localStorage.getItem('arts') || '[]');
            arts.push({ src: e.target.result, likes: 0, username: localStorage.getItem('username') || 'Guest' });
            localStorage.setItem('arts', JSON.stringify(arts));
            loadArts();
        };
        reader.readAsDataURL(file);
    }
}

// --- Загрузка арта из Firebase или localStorage ---
async function loadArts() {
    const artContainer = document.getElementById('arts');
    artContainer.innerHTML = '';
    const currentUser = auth.currentUser;

    if (currentUser) {
        const querySnapshot = await getDocs(collection(db, "images"));
        querySnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const wrapper = document.createElement('div');
            wrapper.className = 'artDiv';

            const userName = document.createElement('p');
            userName.textContent = data.username;
            wrapper.appendChild(userName);

            const img = document.createElement('img');
            img.src = data.url;
            img.width = 300;
            img.height = 400;
            wrapper.appendChild(img);

            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
            likeBtn.textContent = '❤️ ' + data.likes;

            likeBtn.addEventListener('click', async () => {
                data.likes++;
                likeBtn.textContent = '❤️ ' + data.likes;
                const docRef = doc(db, "images", docSnap.id);
                await updateDoc(docRef, { likes: data.likes });
            });

            wrapper.appendChild(likeBtn);
            artContainer.appendChild(wrapper);
        });
    } else {
        
        const saved = JSON.parse(localStorage.getItem('arts') || '[]');
        saved.forEach(a => {
            const wrapper = document.createElement('div');
            wrapper.className = 'artDiv';

            const userName = document.createElement('p');
            userName.textContent = a.username;
            wrapper.appendChild(userName);

            const img = document.createElement('img');
            img.src = a.src;
            img.width = 300;
            img.height = 400;
            wrapper.appendChild(img);

            const likeBtn = document.createElement('button');
            likeBtn.className = 'like-btn';
            likeBtn.textContent = '❤️ ' + a.likes;

            likeBtn.addEventListener('click', function() {
                a.likes++;
                likeBtn.textContent = '❤️ ' + a.likes;
                localStorage.setItem('arts', JSON.stringify(saved));
            });

            wrapper.appendChild(likeBtn);
            artContainer.appendChild(wrapper);
        });
    }
}


window.onload = function() {
    const name = localStorage.getItem('username');
    const usernameEl = document.getElementById('username');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (auth.currentUser) {
        usernameEl.textContent = auth.currentUser.email;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline';
        showPage('home');
    } else if (name) {
        usernameEl.textContent = name;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline';
        showPage('home');
    } else {
        usernameEl.textContent = 'Guest';
        loginBtn.style.display = 'inline';
        logoutBtn.style.display = 'none';
        showPage('login');
    }

    logoutBtn.addEventListener('click', async function() {
        await signOut(auth);
        localStorage.removeItem('username');
        usernameEl.textContent = 'Guest';
        loginBtn.style.display = 'inline';
        logoutBtn.style.display = 'none';
        showPage('login');
    });
};

window.showPage = showPage;
window.registerUser = registerUser;
window.loginUser = loginUser;
