// Check auth status and update navbar
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  // Update both navbar copies
  const navbars = [
    { signupLi: 'signupLi', userMenuLi: 'userMenuLi', userMenuBtn: 'userMenuBtn', userDropdown: 'userDropdown', userEmail: 'userEmail', logoutLink: 'logoutLink' },
    { signupLi: 'signupLi2', userMenuLi: 'userMenuLi2', userMenuBtn: 'userMenuBtn2', userDropdown: 'userDropdown2', userEmail: 'userEmail2', logoutLink: 'logoutLink2' }
  ];

  navbars.forEach(nav => {
    const signupLi = document.getElementById(nav.signupLi);
    const userMenuLi = document.getElementById(nav.userMenuLi);
    const userMenuBtn = document.getElementById(nav.userMenuBtn);
    const userDropdown = document.getElementById(nav.userDropdown);
    const userEmail = document.getElementById(nav.userEmail);
    const logoutLink = document.getElementById(nav.logoutLink);

    if (token && user) {
      // Hide signup button and show user menu
      if (signupLi) signupLi.style.display = 'none';
      if (userMenuLi) userMenuLi.style.display = 'block';
      
      // Generate avatar initials
      const initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();
      if (userMenuBtn) {
        userMenuBtn.innerHTML = `<span class="avatar">${initials}</span>`;
        userMenuBtn.title = user.firstName + ' ' + user.lastName;
      }
      
      // Update user info in dropdown
      if (userEmail) {
        userEmail.innerHTML = `<div>${user.firstName} ${user.lastName}</div><div>${user.email}</div>`;
      }

      // Toggle dropdown on button click
      if (userMenuBtn) {
        userMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Close other dropdowns
          document.querySelectorAll('.userDropdown.show').forEach(d => {
            if (d !== userDropdown) d.classList.remove('show');
          });
          if (userDropdown) userDropdown.classList.toggle('show');
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (userDropdown && userMenuBtn && !userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
          userDropdown.classList.remove('show');
        }
      });

      // Logout handler
      if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await fetch('/api/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
          } catch (err) {
            console.error(err);
          }
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          location.href = '/index.htm';
        });
      }
    } else {
      // Not logged in
      if (signupLi) signupLi.style.display = 'block';
      if (userMenuLi) userMenuLi.style.display = 'none';
    }
  });
});
