// ============================================
//  AUTHENTICATION SCRIPT (Supabase)
// ============================================

(function () {
    'use strict';

    // Configure Supabase Client
    const SUPABASE_URL = 'https://qcmbysyknmdtasrvfkho.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbWJ5c3lrbm1kdGFzcnZma2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEzOTc5MDIsImV4cCI6MjA5Njk3MzkwMn0.rgPijsKW0Wjw1P8HqSyM9llPASmBk58YzbbCkgb236E';

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // DOM Elements
    const loginContainer = document.getElementById('login-container');
    const authForm = document.getElementById('auth-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submit-btn');
    const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
    const loginTitle = document.getElementById('login-title');
    const loginSubtitle = document.getElementById('login-subtitle');
    const errorMsg = document.getElementById('auth-error');
    const successMsg = document.getElementById('auth-success');
    
    // Main UI Elements
    const overlay = document.getElementById('overlay');
    const timeControl = document.getElementById('time-control');
    const birdControl = document.getElementById('bird-control');
    const logoutBtn = document.getElementById('logout-btn');

    // State
    let isLoginMode = true;

    // --- UTILS ---
    function showMessage(msg, isError = true) {
        if (isError) {
            errorMsg.textContent = msg;
            successMsg.textContent = '';
        } else {
            successMsg.textContent = msg;
            errorMsg.textContent = '';
        }
    }

    function clearMessages() {
        errorMsg.textContent = '';
        successMsg.textContent = '';
    }

    // --- TOGGLE LOGIN / SIGNUP ---
    toggleAuthModeBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        clearMessages();
        
        if (isLoginMode) {
            loginTitle.textContent = 'Acesso Restrito';
            loginSubtitle.textContent = 'Faça login para observar o voo livre';
            submitBtn.textContent = 'Entrar';
            toggleAuthModeBtn.innerHTML = 'Ainda não tem conta? <span>Cadastre-se</span>';
        } else {
            loginTitle.textContent = 'Criar Conta';
            loginSubtitle.textContent = 'Cadastre-se para acessar a experiência';
            submitBtn.textContent = 'Cadastrar';
            toggleAuthModeBtn.innerHTML = 'Já tem uma conta? <span>Faça Login</span>';
        }
    });

    // --- FORM SUBMIT ---
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearMessages();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        submitBtn.disabled = true;
        submitBtn.textContent = 'Aguarde...';

        try {
            if (isLoginMode) {
                // LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (error) throw error;
                
                // Login bem-sucedido - o listener de onAuthStateChange vai lidar com a UI
                emailInput.value = '';
                passwordInput.value = '';
            } else {
                // SIGNUP
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                });

                if (error) throw error;

                if (data?.user && data?.session === null) {
                    showMessage('Conta criada! Por favor, verifique seu e-mail para confirmar.', false);
                } else {
                    showMessage('Conta criada com sucesso! Redirecionando...', false);
                }
            }
        } catch (error) {
            console.error('Auth Error:', error.message);
            // Mensagens amigáveis para erros comuns
            if (error.message.includes('Invalid login credentials')) {
                showMessage('E-mail ou senha incorretos.');
            } else if (error.message.includes('User already registered')) {
                showMessage('Este e-mail já está cadastrado.');
            } else if (error.message.includes('Password should be at least 6 characters')) {
                showMessage('A senha deve ter pelo menos 6 caracteres.');
            } else {
                showMessage(error.message);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        }
    });

    // --- LOGOUT ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabase.auth.signOut();
        });
    }

    // --- AUTH STATE LISTENER ---
    supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            // User is logged in
            loginContainer.classList.remove('active');
            
            // Show main UI
            setTimeout(() => {
                overlay.classList.remove('hidden');
                timeControl.classList.remove('hidden');
                birdControl.classList.remove('hidden');
            }, 600); // Wait for login panel to fade out
            
        } else {
            // User is logged out
            loginContainer.classList.add('active');
            clearMessages();
            
            // Hide main UI
            overlay.classList.add('hidden');
            timeControl.classList.add('hidden');
            birdControl.classList.add('hidden');
        }
    });

    // Handle initial state on load
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            loginContainer.classList.remove('active');
            overlay.classList.remove('hidden');
            timeControl.classList.remove('hidden');
            birdControl.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
            timeControl.classList.add('hidden');
            birdControl.classList.add('hidden');
        }
    });

})();
