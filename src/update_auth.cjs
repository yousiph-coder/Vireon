const fs = require('fs');
let mainJs = fs.readFileSync('src/../src/main.js', 'utf8');

// We will inject the import statement at the top if it doesn't exist
if (!mainJs.includes("import { supabase } from './supabaseClient.js'")) {
    mainJs = "import { supabase } from './supabaseClient.js';\n" + mainJs;
}

// Replace login logic
mainJs = mainJs.replace(/const mockJWT = `header\.\$\{btoa\(JSON\.stringify\(\{ email, role: 'creator' \}\)\)\}\.signature`;[\s\S]*?loginForm\.reset\(\);\s*\}, 1000\);/g, `
        // Supabase Login
        supabase.auth.signInWithPassword({ email, password }).then(({ data, error }) => {
          if (error) {
            showError(loginError, error.message);
          } else {
            localStorage.setItem('token', data.session.access_token);
            const namePrefix = email.split('@')[0];
            localStorage.setItem('user_name', data.user.user_metadata?.full_name || namePrefix);
            navigate('/dashboard');
            loginForm.reset();
          }
        });
`);

// Replace signup logic
mainJs = mainJs.replace(/const mockJWT = `header\.\$\{btoa\(JSON\.stringify\(\{ email, name \}\)\)\}\.signature`;[\s\S]*?signupForm\.reset\(\);\s*\}, 1200\);/g, `
        // Supabase Signup
        supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        }).then(({ data, error }) => {
          if (error) {
            showError(signupError, error.message);
          } else {
            if (data.session) {
              localStorage.setItem('token', data.session.access_token);
              localStorage.setItem('user_name', name);
              navigate('/dashboard');
            } else {
              showError(signupError, 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.');
            }
            signupForm.reset();
          }
        });
`);

// Replace logout logic (search for logoutUser function)
mainJs = mainJs.replace(/function logoutUser\(\) \{[\s\S]*?navigate\('\/login'\);\s*\}/g, `function logoutUser() {
    showGlobalSpinner('جاري تسجيل الخروج...');
    supabase.auth.signOut().then(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user_name');
      hideGlobalSpinner();
      navigate('/login');
    });
  }`);

fs.writeFileSync('src/../src/main.js', mainJs, 'utf8');
console.log('Main.js auth replaced with Supabase!');
