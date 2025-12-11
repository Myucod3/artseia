function showPage(page) {
    const content = document.getElementById('content');
    
    if (page === 'home') {
            content.innerHTML = `
                <h3>The web for artists</h3>
                <form id="uploadForm">
                    <label>Upload your art!</label><br>
                    <input type="file" id="imgInput" accept="image/*">
                    <button id="upl" type="submit">Upload</button>
                </form>
                <div id="arts"></div>
            `;
            document.getElementById('uploadForm').addEventListener('submit', uploadArt)
                
    } else if (page === 'gallery') {
        content.innerHTML = `
            <h3>Gallery</h3>
            <p>The place with arts</p>
            <div id="arts"></div>
        `;
        loadArts(); 
    } else if (page === 'profile') {
        const name = localStorage.getItem('username') || 'Guest';
        content.innerHTML = `
            <h3>Profile</h3>
            <p>Username: <b>${name}</b></p>
            <button onclick="alert('Donations coming soon!')">Donate</button>
        `;
    } else if (page === 'login') {
        content.innerHTML = `
            <h3>Login</h3>
            <form id="loginForm">
                <label>Username</label><br>
                <input type="text" id="loginName" required><br>
                <label>Password</label><br>
                <input type="password" id="loginPass" required><br>
                <button type="submit">Login</button>
            </form>
            <p>Don't have an account? <a href="#" onclick="showPage('register')">Register</a></p>
            <p id="loginMessage"></p>
     `;
    
        document.getElementById('loginForm').addEventListener('submit',function (event){
            event.preventDefault();
            const name = document.getElementById('loginName').value.trim();
            const pass = document.getElementById('loginPass').value

            const storedUser = JSON.parse(localStorage.getItem('user_' + name))

            if (storedUser && storedUser.password === pass) {
                localStorage.setItem('username', name);
                document.getElementById('username').textContent = name;
                document.getElementById('loginBtn').style.display = 'none';
                document.getElementById('logoutBtn').style.display = 'inline';
                showPage('home')
            } else {
                document.getElementById('loginMessage').textContent = "Incorrect password!"
            }
        });
        document.getElementById('loginForm').addEventListener('submit', async function(event){
        event.preventDefault();
        const email = document.getElementById('loginName').value.trim();
        const pass = document.getElementById('loginPass').value;
        try {
            await login(email, pass); // вызываем функцию Firebase
            document.getElementById('username').textContent = email; // показываем email вместо имени
        } catch (error) {
            document.getElementById('loginMessage').textContent = error.message;
        }
        });
    } else if (page === 'register') {
        content.innerHTML = `
            <h3>Register</h3>
            <form id="registerForm">
                <label>Username:</label><br>
                <input type="text" id="regName" required><br>
                <label>Password:</label><br>
                <input type="password" id="regPass" required><br>
                <button type="submit">Create Account</button>
            </form>
            <p>Already have an account? <a href="#" onclick="showPage('login')">Login</a></p>
            <p id="regMessage"></p>
        `;

        document.getElementById('registerForm').addEventListener('submit',function(event){
            event.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const pass = document.getElementById('regPass').value

            if(localStorage.getItem('user_'+ name)) {
                document.getElementById('regMessage').textContent = 'This user already exists!';
            } else {
                localStorage.setItem('user_'+ name, JSON.stringify({ password: pass }));
                document.getElementById('regMessage').textContent = 'Account created!'
            }
        });
        document.getElementById('registerForm').addEventListener('submit', async function(event){
            event.preventDefault();
            const email = document.getElementById('regName').value.trim();
            const pass = document.getElementById('regPass').value;
                try {
                    await register(email, pass); // вызываем функцию Firebase
                    alert("Account created!");
                } catch (error) {
                    document.getElementById('regMessage').textContent = error.message;
                }
        });
    }
};

function uploadArt(event) {
    event.preventDefault();
    const fileInput = document.getElementById('imgInput');
    const art = document.getElementById('arts'); 
    const file = fileInput.files[0];

    if (file) {
        const wrapper = document.createElement('div'); 
        wrapper.className = 'artDiv';

        const reader = new FileReader();
        reader.onload = function(e) {
            const imgData = e.target.result

            const img = document.createElement('img');

            const name = document.createElement('p');
            name.textContent = localStorage.getItem('username')


            name.addEventListener('click', function () {
                showPage('profile')
            });


            img.src = e.target.result;
            img.width = 300;
            img.height = 400;
            wrapper.appendChild(img);
            
            const likeButton = document.createElement('button')
            likeButton.className = 'like-btn'
            likeButton.textContent = '❤️ 0'
            
            likeButton.addEventListener('click', function(){
                let currentLikes = parseInt(this.textContent.replace('❤️ ', ''));

                const currentUser = localStorage.getItem('username');

                if(currentUser){
                    this.textContent = '❤️ ' + (currentLikes + 1)
                };
                saveArts();
            });

            wrapper.appendChild(name);
            wrapper.appendChild(img);
            wrapper.appendChild(likeButton);
            art.appendChild(wrapper);
            saveArts();
        };

        reader.readAsDataURL(file);
        } else {
            alert("Выберите картинку перед загрузкой!");
        };
}

async function uploadArt(event) {
    event.preventDefault();
    const fileInput = document.getElementById('imgInput');
    const file = fileInput.files[0];
    const currentUser = auth.currentUser;

    if (!file || !currentUser) {
        alert("Выберите картинку и войдите в аккаунт!");
        return;
    }

    const storageRef = ref(storage, `images/${currentUser.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    // Сохраняем ссылку в Firestore
    await addDoc(collection(db, "images"), {
        userId: currentUser.uid,
        username: currentUser.displayName || currentUser.email,
        url: url,
        likes: 0
    });

    loadArts(); // обновляем галерею после загрузки
}

function saveArts() {
    const artDivs = document.querySelectorAll('#arts .artDiv');
    const arts = [];

    artDivs.forEach(div => {
        const img = div.querySelector('img');
        const likeBtn = div.querySelector('.like-btn')


        arts.push({
            src: img.src,
            likes: likeBtn.textContent.replace('❤️ ', ''),
            username: div.querySelector('p').textContent
        });
    });

    localStorage.setItem('arts', JSON.stringify(arts));
}

function saveArts() {
    const artDivs = document.querySelectorAll('#arts .artDiv');
    const arts = [];

    artDivs.forEach(div => {
        const img = div.querySelector('img');
        const likeBtn = div.querySelector('.like-btn')


        arts.push({
            src: img.src,
            likes: likeBtn.textContent.replace('❤️ ', ''),
            username: div.querySelector('p').textContent
        });
    });

    localStorage.setItem('arts', JSON.stringify(arts));
}

function loadArts() {
    const saved = localStorage.getItem('arts');
    
    if (!saved) return;

    const arts = JSON.parse(saved);
    const art = document.getElementById('arts');

    arts.forEach(a => {
        const wrapper = document.createElement('div');
        wrapper.className = 'artDiv';

        const userName = document.createElement('p');
        userName.textContent = a.username;
        userName.addEventListener('click', () => showPage('profile'));
        wrapper.appendChild(userName);

        const img = document.createElement('img');
        img.src = a.src;
        img.width = 300;
        img.height = 400;

        const likeButton = document.createElement('button');
        likeButton.className = 'like-btn';
        likeButton.textContent = '❤️ ' + a.likes;

        likeButton.addEventListener('click', function(){
            let currentLikes = parseInt(this.textContent.replace('❤️ ',''));
            this.textContent = '❤️ ' + (currentLikes + 1);
            saveArts();
        });

        

        wrapper.appendChild(img);
        wrapper.appendChild(likeButton);
        art.appendChild(wrapper);
    });
}

async function loadArts() {
    const artContainer = document.getElementById('arts');
    artContainer.innerHTML = '';

    const querySnapshot = await getDocs(collection(db, "images"));
    querySnapshot.forEach(doc => {
        const data = doc.data();
        const wrapper = document.createElement('div');
        wrapper.className = 'artDiv';

        const userName = document.createElement('p');
        userName.textContent = data.username;
        userName.addEventListener('click', () => showPage('profile'));
        wrapper.appendChild(userName);

        const img = document.createElement('img');
        img.src = data.url;
        img.width = 300;
        img.height = 400;
        wrapper.appendChild(img);

        const likeButton = document.createElement('button');
        likeButton.className = 'like-btn';
        likeButton.textContent = '❤️ ' + data.likes;
        likeButton.addEventListener('click', async function () {
            data.likes++;
            likeButton.textContent = '❤️ ' + data.likes;
            // Обновляем лайки в Firestore
            await addDoc(collection(db, "images"), data); 
        });
        wrapper.appendChild(likeButton);

        artContainer.appendChild(wrapper);
    });
}

window.onload = function () {    
    const name = localStorage.getItem('username');
    const usernameEl = document.getElementById('username');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    if (name) {
        usernameEl.textContent = name;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline';
        showPage('home')
        loadArts();
    } else {
        usernameEl.textContent = 'Guest';
        loginBtn.style.display = 'inline';
        logoutBtn.style.display = 'none'
        showPage('login');
    }

    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('username');

        loginBtn.style.display = 'inline';
        logoutBtn.style.display = 'none';

        usernameEl.textContent = 'Guest'
        
        showPage('login')
    });
};


