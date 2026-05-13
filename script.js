document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM — авторизация
    const authModal = document.getElementById('authModal');
    const registerModal = document.getElementById('registerModal');
    const userPanel = document.getElementById('userPanel');
    const currentUserEl = document.getElementById('currentUser');
    const logoutBtn = document.getElementById('logoutBtn');

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toRegisterBtn = document.getElementById('toRegister');
    const toLoginBtn = document.getElementById('toLogin');

    // Элементы основного приложения
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const balanceEl = document.getElementById('balance');
    const tableBody = document.getElementById('tableBody');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const modal = document.getElementById('modal');
    const entryForm = document.getElementById('entryForm');
    const modalTitle = document.getElementById('modalTitle');
    const cancelBtn = document.getElementById('cancelBtn');

    // Данные приложения
    let entries = [];
    let currentUser = null;
    let currentEditId = null;

    // Инициализация
    init();

    function init() {
        checkAuth();
        setupEventListeners();
    }

    function setupEventListeners() {
        // Обработчики авторизации
        loginForm.addEventListener('submit', handleLogin);
        registerForm.addEventListener('submit', handleRegister);
        toRegisterBtn.addEventListener('click', showRegister);
        toLoginBtn.addEventListener('click', showLogin);
        logoutBtn.addEventListener('click', handleLogout);

        // Обработчики основного приложения
        addIncomeBtn.addEventListener('click', () => openModal('income'));
        addExpenseBtn.addEventListener('click', () => openModal('expense'));
        cancelBtn.addEventListener('click', closeModal);
        entryForm.addEventListener('submit', saveEntry);
    }

    function checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            loadUserData();
            showApp();
        } else {
            showAuth();
        }
    }

    function showAuth() {
        authModal.classList.remove('hidden');
        document.querySelector('.container').classList.add('hidden');
    }

    function showApp() {
        authModal.classList.add('hidden');
        registerModal.classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
        userPanel.classList.remove('hidden');
        currentUserEl.textContent = currentUser.username;
    }

    function handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('budgetUsers')) || {};

        if (users[username] && users[username].password === password) {
            currentUser = { username };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadUserData();
            showApp();
            showNotification('Добро пожаловать, ' + username + '!');
        } else {
            showNotification('Неверное имя пользователя или пароль', 'error');
        }
    }

    function handleRegister(e) {
        e.preventDefault();

        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }

        let users = JSON.parse(localStorage.getItem('budgetUsers')) || {};

        if (users[username]) {
            showNotification('Пользователь с таким именем уже существует', 'error');
            return;
        }

        users[username] = {
            password: password,
            data: { entries: [] }
        };

        localStorage.setItem('budgetUsers', JSON.stringify(users));
        showNotification('Аккаунт создан! Теперь войдите в систему.');
        showLogin();
    }

    function handleLogout() {
        localStorage.removeItem('currentUser');
        currentUser = null;
        entries = [];
        renderEntries();
        updateBalance();
        showAuth();
        showNotification('Вы вышли из системы');
    }

    function loadUserData() {
        const users = JSON.parse(localStorage.getItem('budgetUsers'));
        if (users && users[currentUser.username]) {
            entries = users[currentUser.username].data.entries || [];
        } else {
            entries = [];
        }
        renderEntries();
        updateBalance();
    }

    function saveUserData() {
        if (!currentUser) return;

        let users = JSON.parse(localStorage.getItem('budgetUsers'));
        if (users && users[currentUser.username]) {
            users[currentUser.username].data.entries = entries;
            localStorage.setItem('budgetUsers', JSON.stringify(users));
        }
    }

    function showRegister() {
        authModal.classList.add('hidden');
        registerModal.classList.remove('hidden');
    }

    function showLogin() {
        registerModal.classList.add('hidden');
        authModal.classList.remove('hidden');
    }

    function openModal(type) {
        currentEditId = null;
        modalTitle.textContent = type === 'income' ? 'Добавить доход' : 'Добавить расход';
        document.getElementById('entryType').value = type;
        resetForm();
        modal.classList.remove('hidden');
        document.getElementById('entryDate').value = getTodayDate();
    }

    function closeModal() {
        modal.classList.add('hidden');
        resetForm();
    }

    function resetForm() {
        entryForm.reset();
        document.getElementById('entryDate').value = getTodayDate();
    }

    function getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    function saveEntry(e) {
        e.preventDefault();

        const newEntry = {
            id: currentEditId || Date.now(),
            date: document.getElementById('entryDate').value,
            type: document.getElementById('entryType').value,
            category: document.getElementById('entryCategory').value,
            amount: parseFloat(document.getElementById('entryAmount').value),
            description: document.getElementById('entryDescription').value
        };

        if (currentEditId) {
            // Редактирование существующей записи
            const index = entries.findIndex(entry => entry.id === currentEditId);
            entries[index] = newEntry;
            showNotification('Запись обновлена!');
        } else {
            // Добавление новой записи
            entries.unshift(newEntry); // Добавляем в начало для хронологического порядка
            showNotification('Запись добавлена!');
        }

        saveUserData();
        renderEntries();
        updateBalance();
        closeModal();
    }

    function renderEntries() {
        tableBody.innerHTML = '';

        if (entries.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">Нет записей. Добавьте первый доход или расход!</td></tr>';
            return;
        }

        entries.forEach(entry => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(entry.date)}</td>
                <td class="${entry.type}">${entry.type === 'income' ? 'Доход' : 'Расход'}</td>
                <td>${entry.category}</td>
                <td>${formatCurrency(entry.amount)}</td>
                <td>${entry.description || '—'}</td>
                <td>
                    <button class="delete-btn" data-id="${entry.id}">Удалить</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteEntry(this.getAttribute('data-id'));
            });
        });
    }

    function deleteEntry(id) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        entries = entries.filter(entry => entry.id !== parseInt(id));
        saveUserData();
        renderEntries();
        updateBalance();
        showNotification('Запись удалена!');
    }
}

function updateBalance() {
    const totalIncome = entries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

    const totalExpenses = entries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

    const balance = totalIncome - totalExpenses;

    totalIncomeEl.textContent = formatCurrency(totalIncome);
    totalExpensesEl.textContent = formatCurrency(totalExpenses);
    balanceEl.textContent = formatCurrency(balance);

    // Подсвечиваем отрицательный баланс
    balanceEl.classList.toggle('negative', balance < 0);
    balanceEl.classList.add('updated');

    setTimeout(() => {
        balanceEl.classList.remove('updated');
    }, 300);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0
    }).format(amount);
}

function showNotification(message, type = 'success') {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Дополнительные функции для улучшения UX

// Сортировка записей по дате (новые сверху)
function sortEntriesByDate() {
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Фильтрация записей (опционально — можно добавить в интерфейс позже)
function filterEntries(filterType = null, category = null) {
    let filtered = [...entries];

    if (filterType) {
        filtered = filtered.filter(entry => entry.type === filterType);
    }

    if (category) {
        filtered = filtered.filter(entry => entry.category === category);
    }

    return filtered;
}

// Экспорт данных в CSV (базовая реализация)
function exportToCSV() {
    if (entries.length === 0) {
        showNotification('Нет данных для экспорта', 'info');
        return;
    }

    const csvRows = [];
    csvRows.push('Дата,Тип,Категория,Сумма,Описание');

    entries.forEach(entry => {
        const row = [
            `"${formatDate(entry.date)}"`,
            `"${entry.type === 'income' ? 'Доход' : 'Расход'}"`,
            `"${entry.category}"`,
            `"${entry.amount}"`,
            `"${entry.description || ''}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_export_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Импорт данных из CSV (упрощённая версия)
function importFromCSV(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n').slice(1); // Пропускаем заголовок

        lines.forEach(line => {
            const [date, typeStr, category, amountStr, description] = line.split(',');
            if (!date || !typeStr || !amountStr) return;

            const newEntry = {
                id: Date.now() + Math.random(),
                date: new Date(date).toISOString().split('T')[0],
                type: typeStr.trim() === 'Доход' ? 'income' : 'expense',
                category: category.trim(),
                amount: parseFloat(amountStr.replace(/"/g, '')),
                description: description ? description.replace(/"/g, '') : ''
            };

            entries.push(newEntry);
        });

        saveUserData();
        renderEntries();
        updateBalance();
        showNotification('Данные успешно импортированы!');
    };
    reader.readAsText(file);
}

// Функция для сброса всех данных пользователя (с подтверждением)
function resetUserData() {
    if (confirm('Вы уверены, что хотите сбросить все данные? Это действие нельзя отменить!')) {
        entries = [];
        saveUserData();
        renderEntries();
        updateBalance();
        showNotification('Все данные сброшены');
    }
}

// Обработчики для дополнительных функций (можно добавить кнопки в интерфейс)
document.getElementById('exportBtn')?.addEventListener('click', exportToCSV);
document.getElementById('importBtn')?.addEventListener('change', function(e) {
    importFromCSV(e.target.files[0]);
});
document.getElementById('resetBtn')?.addEventListener('click', resetUserData);

// Автосохранение каждые 30 секунд
setInterval(() => {
    if (currentUser) {
        saveUserData();
    }
}, 30000);

// Обработка закрытия страницы — сохраняем данные
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        saveUserData();
    }
});
});
