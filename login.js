const form = document.getElementById('loginForm');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');

form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const email = form.email.value;
    const password = form.password.value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();
        if (json.ok) {
                localStorage.setItem('authToken', json.token);
                localStorage.setItem('user', JSON.stringify(json.user));
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
                setTimeout(() => location.href = '/index.htm', 700);
        } else {
            errorMessage.textContent = json.error || 'Invalid email or password.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    } catch (err) {
        console.error(err);
        alert('Could not reach server.');
    }
});
