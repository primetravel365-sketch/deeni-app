// Keep account creation separate from sign-in, including after signup succeeds.
module.exports = function separateSignup(html) {
  function replace(before, after) {
    if (html.split(before).length !== 2) throw Error('Expected signup integration anchor: ' + before.slice(0, 80));
    html = html.replace(before, () => after);
  }
  replace('<button type="submit" name="action" value="signup">إنشاء حساب</button>',
    '<button type="button" id="account-open-signup">إنشاء حساب</button>');
  replace('          </form>\n        </section>\n        <div id="onboarding-new">',
    `          </form>
          <form id="account-signup-form" hidden>
            <h2>إنشاء حساب</h2>
            <label for="account-signup-email">البريد الإلكتروني</label>
            <input id="account-signup-email" type="email" autocomplete="username" inputmode="email" dir="ltr" required>
            <label for="account-signup-password">كلمة المرور</label>
            <input id="account-signup-password" type="password" autocomplete="new-password" minlength="6" required>
            <div class="account-actions">
              <button type="submit">إنشاء حساب</button>
              <button type="button" id="account-back-to-login">رجوع</button>
            </div>
            <p id="account-signup-status" role="status" aria-live="polite"></p>
          </form>
        </section>
        <div id="onboarding-new">`);
  replace('#account-form label,#prayer-notif-rows>label', '#account-panel label,#prayer-notif-rows>label');
  replace('#account-form input,#prayer-notif-selected', '#account-panel input,#prayer-notif-selected');
  replace('#account-form button{', '#account-panel button{');
  replace('#account-form [hidden],#prayer-notif-rows [hidden]', '#account-panel [hidden],#prayer-notif-rows [hidden]');
  replace('#account-status:empty{', '#account-status:empty,#account-signup-status:empty{');
  replace("    const requiresPassword = action === 'login' || action === 'signup';",
    "    const requiresPassword = action === 'login';");
  replace("await request(action === 'signup' ? 'signup' : 'token?grant_type=password', 'POST', credentials);",
    "await request('token?grant_type=password', 'POST', credentials);");
  replace("  form.addEventListener('submit', async event => {", `  const signupForm = document.getElementById('account-signup-form');
  const signupEmail = document.getElementById('account-signup-email');
  const signupPassword = document.getElementById('account-signup-password');
  const signupStatus = document.getElementById('account-signup-status');
  const signupButton = signupForm.querySelector('button[type="submit"]');
  const backButton = document.getElementById('account-back-to-login');

  function showLogin(focusTarget) {
    signupPassword.value = '';
    signupForm.hidden = true;
    form.hidden = false;
    focusTarget.focus();
  }

  const openSignup = document.getElementById('account-open-signup');
  openSignup.addEventListener('click', () => {
    if (form.dataset.busy) return;
    signupEmail.value = email.value.trim();
    signupPassword.value = '';
    signupStatus.textContent = '';
    status.textContent = '';
    password.value = '';
    form.hidden = true;
    signupForm.hidden = false;
    signupEmail.focus();
  });
  backButton.addEventListener('click', () => showLogin(openSignup));
  signupForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (signupButton.disabled || !signupForm.reportValidity()) return;
    signupButton.disabled = true;
    backButton.disabled = true;
    signupStatus.textContent = '';
    const address = signupEmail.value.trim();
    try {
      await request('signup', 'POST', {email: address, password: signupPassword.value});
      email.value = address;
      password.value = '';
      status.textContent = 'أكد بريدك الإلكتروني قبل تسجيل الدخول.';
      showLogin(password);
    } catch {
      signupStatus.textContent = 'تعذّر إكمال الطلب. تحقّق من بياناتك واتصالك بالإنترنت.';
    } finally {
      signupPassword.value = '';
      signupButton.disabled = false;
      backButton.disabled = false;
    }
  });

  form.addEventListener('submit', async event => {`);
  return html;
};
