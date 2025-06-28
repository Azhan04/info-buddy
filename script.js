function getUploadedFiles() {
    const files = localStorage.getItem('uploadedFiles');
    return files ? JSON.parse(files) : [];
}

function saveUploadedFiles(files) {
    localStorage.setItem('uploadedFiles', JSON.stringify(files));
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function uploadPdfToLocalStorage(file, uploader) {
    const base64File = await fileToBase64(file);
    const files = getUploadedFiles();
    const newFile = {
        id: Date.now(),
        name: file.name,
        uploader: uploader,
        dataUrl: base64File
    };
    files.push(newFile);
    saveUploadedFiles(files);
    alert('File uploaded successfully.');
    return newFile;
}


function displayUploadedFiles(listElementId, filterFn = () => true) {
    const files = getUploadedFiles();
    const listElement = document.getElementById(listElementId);
    if (!listElement) return;
    listElement.innerHTML = '';
    files.filter(filterFn).forEach(file => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        
        // Create a Blob from the base64 data
        const byteCharacters = atob(file.dataUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {type: 'application/pdf'});
        
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.target = '_blank';
        link.textContent = file.name;
        link.download = file.name; // Allow downloading the file
        li.appendChild(link);
        
        if (listElementId === 'uploadedFilesAdminList') {
            const uploaderSpan = document.createElement('span');
            uploaderSpan.textContent = ` (uploaded by ${file.uploader})`;
            li.appendChild(uploaderSpan);
        }
        
        listElement.appendChild(li);
    });
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username')?.value.trim() || '';
            const password = document.getElementById('password')?.value.trim() || '';

            if (!username || !password) {
                alert('Please enter both username and password.');
                return;
            }

            // Retrieve stored users
            let users = [];
            try {
                const storedUsers = localStorage.getItem('users');
                users = storedUsers ? JSON.parse(storedUsers) : [];
            } catch (error) {
                console.error('Error parsing stored users:', error);
                alert('An error occurred during login. Please try again.');
                return;
            }

            // Find the user
            const user = users.find(u => u.username === username && u.password === password);

            if (!user) {
                alert('Invalid username or password.');
                return;
            }

            // Set current user and role
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userRole', user.role);

            alert(`Login successful as ${username} with role ${user.role}.`);
            window.location.href = `${user.role}_dashboard.html`;
        });
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }

    const uploadPdfButton = document.getElementById('uploadPdfButton');
    const pdfUploadInput = document.getElementById('pdfUploadInput');
    if (uploadPdfButton && pdfUploadInput) {
        uploadPdfButton.addEventListener('click', async () => {
            const file = pdfUploadInput.files[0];
            if (!file) {
                alert('Please select a PDF file to upload.');
                return;
            }
            if (file.type !== 'application/pdf') {
                alert('Only PDF files are allowed.');
                return;
            }
            const currentUser = localStorage.getItem('currentUser');
            if (!currentUser) {
                alert('User not logged in.');
                return;
            }
            try {
                await uploadPdfToLocalStorage(file, currentUser);
                pdfUploadInput.value = '';
                displayUploadedFilesForCurrentUser();
            } catch (error) {
                console.error('Upload error:', error);
                alert('File upload failed. Please try again.');
            }
        });
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const username = document.getElementById('username')?.value.trim() || '';
            const password = document.getElementById('password')?.value.trim() || '';
            const role = document.getElementById('role')?.value || '';

            if (!username || !password || !role) {
                alert('Please fill in all fields.');
                return;
            }

            // In a real application, you would send this data to a server.
            // For this example, we'll just store it in localStorage.
            let users = [];
            try {
                const storedUsers = localStorage.getItem('users');
                users = storedUsers ? JSON.parse(storedUsers) : [];
                
                // Ensure users is an array
                if (!Array.isArray(users)) {
                    console.error('Stored users is not an array:', users);
                    users = [];
                }
            } catch (error) {
                console.error('Error parsing stored users:', error);
            }

            const userExists = users.some(user => user.username === username);

            if (userExists) {
                alert('Username already exists. Please choose a different username.');
                return;
            }

            users.push({ username, password, role });
            try {
                localStorage.setItem('users', JSON.stringify(users));
            } catch (error) {
                console.error('Error storing users:', error);
                alert('An error occurred during registration. Please try again.');
                return;
            }

            // Set current user
            localStorage.setItem('currentUser', username);
            localStorage.setItem('userRole', role);

            alert(`Registration successful as ${username} with role ${role}.`);
            window.location.href = `${role}_dashboard.html`;
        });
    }

    displayUploadedFilesForCurrentUser();
});

function displayUploadedFilesForCurrentUser() {
    const userRole = localStorage.getItem('userRole');
    const currentUser = localStorage.getItem('currentUser');
    if (userRole === 'teacher') {
        displayUploadedFiles('uploadedFilesList', f => f.uploader === currentUser);
    } else if (userRole === 'admin') {
        displayUploadedFiles('uploadedFilesAdminList');
    } else if (userRole === 'student') {
        displayUploadedFiles('uploadedFilesStudentList');
    }
}