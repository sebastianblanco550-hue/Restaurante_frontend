// --- CONFIGURACIÓN DE DESPLIEGUE ---
// Cambia esto por tu URL de Render cuando subas el backend (Ej: "https://mi-api-restaurante.onrender.com")
const BACKEND_DOMAIN = "localhost:8000"; 
const PROTOCOL_HTTP = (window.location.hostname === "localhost" || window.location.protocol === "file:") ? "http://" : "https://";
const PROTOCOL_WS = (window.location.hostname === "localhost" || window.location.protocol === "file:") ? "ws://" : "wss://";

const API_BASE = `${PROTOCOL_HTTP}${BACKEND_DOMAIN}/api`;
const WS_BASE = `${PROTOCOL_WS}${BACKEND_DOMAIN}/ws/kitchen`;

let RESTAURANT_ID = localStorage.getItem("session_rest_id") || "";

// Formateador de moneda COP
const formatCOP = (amount) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);
};

// --- UTILIDADES GLOBALES Y TEMA ---
function initTheme() {
    const savedTheme = localStorage.getItem('saas_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}
initTheme(); // Ejecutar al cargar la página

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('saas_theme', next);
    
    // Actualizar icono del botón si existe
    const btn = document.getElementById('theme-btn');
    if(btn) btn.innerText = next === 'dark' ? '☀️' : '🌙';
}

function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function checkSession(requiredRole) {
    const role = localStorage.getItem("session_role");
    const rest = localStorage.getItem("session_rest_id");
    
    // Si no hay sesión, al login
    if (!rest || !role) {
        window.location.href = 'login.html';
        return;
    }
    
    // Asignar dinámicamente si no estaba seteado en la recarga
    RESTAURANT_ID = rest;

    // Si requiere un rol específico, validar. El Admin tiene pase libre a todo.
    if (requiredRole && role !== requiredRole && role !== 'admin') {
        alert("Acceso denegado. Este panel es exclusivo para " + requiredRole);
        window.location.href = 'login.html';
    }
}

function addAdminBackButton() {
    const role = localStorage.getItem("session_role");
    if (role === 'admin') {
        const btn = document.createElement('button');
        btn.innerText = "🔙 Volver al Panel Admin";
        btn.className = "btn";
        btn.style.position = "fixed";
        btn.style.bottom = "20px";
        btn.style.left = "20px";
        btn.style.zIndex = "1000";
        btn.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";
        btn.onclick = () => window.location.href = 'admin.html';
        document.body.appendChild(btn);
    }
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// --- LÓGICA DE ADMINISTRADOR ---

// MENÚ
async function loadMenuAdmin() {
    const list = document.getElementById('menu-list');
    if(!list) return;
    try {
        const res = await fetch(`${API_BASE}/menu/${RESTAURANT_ID}`);
        const data = await res.json();
        list.innerHTML = "";
        if(data.length === 0) list.innerHTML = "<p>No hay productos en el menú.</p>";
        
        data.forEach(item => {
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; padding: 10px; background: rgba(255,255,255,0.6); border-radius:8px;">
                    <div><strong>${item.name}</strong> <span style="font-size:0.8em; color:var(--text-muted)">(${item.category})</span></div>
                    <div style="color:var(--success); font-weight:bold;">${formatCOP(item.price)}</div>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

async function addProduct() {
    const name = document.getElementById('p_name').value;
    const price = parseFloat(document.getElementById('p_price').value);
    const cat = document.getElementById('p_cat').value;
    
    if(!name || !price) return alert("Completa los campos");

    try {
        const res = await fetch(`${API_BASE}/menu/${RESTAURANT_ID}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, price, category: cat})
        });
        if(res.ok) {
            showToast("Producto agregado");
            document.getElementById('p_name').value = "";
            document.getElementById('p_price').value = "";
            loadMenuAdmin();
        }
    } catch(e) { console.error(e); }
}

// MESAS
async function loadTablesAdmin() {
    const list = document.getElementById('tables-list');
    if(!list) return;
    try {
        const res = await fetch(`${API_BASE}/tables/${RESTAURANT_ID}`);
        const data = await res.json();
        list.innerHTML = "";
        if(data.length === 0) list.innerHTML = "<p>No hay mesas configuradas.</p>";
        
        data.forEach(t => {
            list.innerHTML += `
                <div style="padding: 10px; background: rgba(255,255,255,0.6); border-radius:8px; margin-bottom:5px;">
                    <strong>${t.name}</strong>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

async function addTable() {
    const name = document.getElementById('t_name').value;
    if(!name) return alert("Ingresa el nombre de la mesa");
    try {
        const res = await fetch(`${API_BASE}/tables/${RESTAURANT_ID}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name})
        });
        if(res.ok) {
            showToast("Mesa agregada");
            document.getElementById('t_name').value = "";
            loadTablesAdmin();
        }
    } catch(e) { console.error(e); }
}

// PERSONAL / STAFF
async function loadStaffAdmin() {
    const list = document.getElementById('staff-list');
    if(!list) return;
    try {
        const res = await fetch(`${API_BASE}/staff/${RESTAURANT_ID}`);
        const data = await res.json();
        list.innerHTML = "";
        if(data.length === 0) list.innerHTML = "<p>No hay empleados creados.</p>";
        
        data.forEach(s => {
            let roleIcon = s.role === 'mesero' ? '📱' : '👨‍🍳';
            list.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; padding: 10px; background: rgba(255,255,255,0.6); border-radius:8px; margin-bottom:5px;">
                    <div><strong>${roleIcon} ${s.name}</strong><br><span style="font-size:0.8em; color:var(--text-muted)">User: ${s.username}</span></div>
                    <span class="badge ${s.role === 'mesero' ? 'ready' : 'pending'}">${s.role}</span>
                </div>
            `;
        });
    } catch(e) { console.error(e); }
}

async function addStaff() {
    const name = document.getElementById('s_name').value;
    const user = document.getElementById('s_user').value;
    const pwd = document.getElementById('s_pwd').value;
    const role = document.getElementById('s_role').value;
    
    if(!name || !user || !pwd) return alert("Llena todos los campos");
    
    try {
        const res = await fetch(`${API_BASE}/staff/${RESTAURANT_ID}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, username: user, password: pwd, role})
        });
        const data = await res.json();
        if(res.ok) {
            showToast("Empleado agregado");
            document.getElementById('s_name').value = "";
            document.getElementById('s_user').value = "";
            document.getElementById('s_pwd').value = "";
            loadStaffAdmin();
        } else {
            alert(data.detail);
        }
    } catch(e) { console.error(e); }
}

// --- LÓGICA DE MESERO (CARRITO) ---
let cart = [];
let fullMenu = [];
let currentSubtotal = 0;
let currentTip = 0;

async function loadMenuWaiter() {
    const container = document.getElementById('menu-buttons');
    if(!container) return;
    try {
        const res = await fetch(`${API_BASE}/menu/${RESTAURANT_ID}`);
        fullMenu = await res.json();
        
        container.innerHTML = "";
        if(fullMenu.length === 0) container.innerHTML = "<p>Menú vacío.</p>";
        
        fullMenu.forEach(item => {
            container.innerHTML += `
                <button class="btn menu-item-btn" onclick="addToCart('${item.id}')" style="background:var(--glass-bg); color:var(--text-main); border:1px solid var(--primary); display:flex; flex-direction:column; align-items:center; padding:15px;">
                    <strong style="font-size:1.1rem; text-align:center;">${item.name}</strong>
                    <span style="color:var(--success); margin-top:5px;">${formatCOP(item.price)}</span>
                </button>
            `;
        });
    } catch(e) { console.error(e); }
}

async function loadTablesWaiter() {
    const select = document.getElementById('mesa');
    if(!select) return;
    try {
        const res = await fetch(`${API_BASE}/tables/${RESTAURANT_ID}`);
        const tables = await res.json();
        select.innerHTML = "";
        if(tables.length === 0) select.innerHTML = "<option value=''>No hay mesas configuradas</option>";
        tables.forEach(t => {
            select.innerHTML += `<option value="${t.name}">${t.name}</option>`;
        });
    } catch(e) { console.error(e); }
}

function addToCart(itemId) {
    const item = fullMenu.find(i => i.id === itemId);
    if(!item) return;
    const existing = cart.find(c => c.id === itemId);
    if(existing) existing.quantity += 1;
    else cart.push({ ...item, quantity: 1, notes: "" });
    renderCart();
}

function updateCartNotes(itemId, val) {
    const existing = cart.find(c => c.id === itemId);
    if(existing) existing.notes = val;
}

function updateTip(percentage) {
    if(currentSubtotal === 0) return;
    currentTip = currentSubtotal * (percentage / 100);
    renderCart(); // Re-render to show updated tip total
}

function renderCart() {
    const div = document.getElementById('cart-items');
    const subDiv = document.getElementById('cart-subtotal');
    const tipDiv = document.getElementById('cart-tip');
    const totalDiv = document.getElementById('cart-total');
    
    div.innerHTML = "";
    if(cart.length === 0) {
        div.innerHTML = "<p style='color:var(--text-muted)'>El carrito está vacío</p>";
        if(subDiv) subDiv.innerText = formatCOP(0);
        if(tipDiv) tipDiv.innerText = formatCOP(0);
        if(totalDiv) totalDiv.innerText = formatCOP(0);
        document.getElementById("btn-send").disabled = true;
        return;
    }
    
    document.getElementById("btn-send").disabled = false;
    currentSubtotal = 0;
    
    cart.forEach(item => {
        currentSubtotal += item.price * item.quantity;
        div.innerHTML += `
            <div style="background:rgba(255,255,255,0.7); padding:10px; border-radius:8px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${item.quantity}x ${item.name}</strong>
                    <span>${formatCOP(item.price * item.quantity)}</span>
                </div>
                <input type="text" placeholder="Notas (opcional)" class="input-field" style="margin-top:5px; padding:5px; font-size:0.85em;" onchange="updateCartNotes('${item.id}', this.value)" value="${item.notes}">
            </div>
        `;
    });
    
    if(subDiv) subDiv.innerText = formatCOP(currentSubtotal);
    if(tipDiv) tipDiv.innerText = formatCOP(currentTip);
    if(totalDiv) totalDiv.innerText = formatCOP(currentSubtotal + currentTip);
}

async function sendOrder() {
    const mesa = document.getElementById("mesa").value;
    if(cart.length === 0 || !mesa) return alert("Selecciona mesa y productos");

    const payload = {
        restaurant_id: RESTAURANT_ID,
        table_name: mesa,
        waiter_name: localStorage.getItem("session_user_name") || "Mesero",
        items: cart.map(c => ({ item_name: c.name, quantity: c.quantity, price: c.price, notes: c.notes }))
    };

    const btn = document.getElementById("btn-send");
    btn.innerText = "Enviando..."; btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        if(response.ok) {
            showToast("✅ Orden enviada a cocina");
            showInvoice(data.order, currentSubtotal, currentTip);
            cart = [];
            currentTip = 0;
            renderCart();
        }
    } catch (e) {
        console.error(e);
        alert("Error de conexión");
    } finally {
        btn.innerText = "Generar Factura y Enviar a Cocina";
        btn.disabled = false;
    }
}

// --- FACTURACIÓN (TICKET SIMPLIFICADO) ---
function showInvoice(order, subtotal, tip) {
    const modal = document.getElementById("invoice-modal");
    if(!modal) return;
    
    let html = `
        <div style="font-family:'Courier New', Courier, monospace; font-size: 0.95rem; line-height: 1.4; color: #000; background: #fff; padding: 20px; text-align: left;">
            <div style="text-align:center; margin-bottom:15px;">
                <h2 style="margin:0; font-size:1.2rem; text-transform:uppercase;">${localStorage.getItem("session_rest_name") || "TICKET"}</h2>
                <div>Mesa: ${order.table_name}</div>
                <div>Ord: #${order.id.substring(0,6)} | Mesero: ${order.waiter_name}</div>
            </div>
            <div style="border-bottom: 1px dashed #000; margin-bottom:10px;"></div>
    `;
    
    order.items.forEach(it => {
        html += `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <div style="flex:1;">${it.quantity}x ${it.item_name}</div>
                <div>${formatCOP(it.quantity * it.price)}</div>
            </div>
        `;
    });
    
    html += `
            <div style="border-top: 1px dashed #000; margin-top:10px; padding-top:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span>Subtotal:</span>
                    <span>${formatCOP(subtotal)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <span>Propina sugerida:</span>
                    <span>${formatCOP(tip)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:8px; font-weight:bold; font-size:1.1rem;">
                    <span>TOTAL:</span>
                    <span>${formatCOP(subtotal + tip)}</span>
                </div>
            </div>
            <div style="text-align:center; margin-top:20px; font-size:0.8rem;">
                ¡Gracias por su visita!
            </div>
        </div>
    `;
    
    document.getElementById("invoice-content").innerHTML = html;
    modal.style.display = "flex";
}

function closeInvoice() {
    document.getElementById("invoice-modal").style.display = "none";
}

function printInvoice() {
    const content = document.getElementById("invoice-content").innerHTML;
    const printWindow = window.open('', '', 'width=350,height=600');
    printWindow.document.write(`
        <html><head><title>Ticket</title>
        <style>body{margin:0; padding:10px; background:#fff;}</style>
        </head><body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// --- LÓGICA DE LA COCINA (KDS) ---
let ws;
async function initKitchen() {
    const ordersDiv = document.getElementById("kitchen-orders");
    if (!ordersDiv) return;

    ordersDiv.innerHTML = "<p>Sincronizando órdenes...</p>";
    
    try {
        const res = await fetch(`${API_BASE}/orders/${RESTAURANT_ID}`);
        const orders = await res.json();
        ordersDiv.innerHTML = "";
        if(orders.length === 0) ordersDiv.innerHTML = "<div style='grid-column: 1/-1; text-align:center;'><p>No hay órdenes pendientes</p></div>";
        else orders.reverse().forEach(o => renderOrderCard(o, ordersDiv, false));
    } catch(e) { console.error("Error sincronizando", e); }

    ws = new WebSocket(`${WS_BASE}/${RESTAURANT_ID}`);
    ws.onopen = () => showToast("KDS En línea 🟢");
    ws.onmessage = function(event) {
        const message = JSON.parse(event.data);
        if(message.type === "NEW_ORDER") {
            if(ordersDiv.innerHTML.includes("No hay órdenes")) ordersDiv.innerHTML = "";
            renderOrderCard(message.data, ordersDiv, true);
        }
    };
    ws.onclose = () => {
        showToast("Desconectado 🔴. Reintentando...");
        setTimeout(initKitchen, 5000);
    };
}

function renderOrderCard(order, container, isNew) {
    if(document.getElementById(`order-${order.id}`)) return;
    
    let itemsHtml = order.items.map(item => `
        <li style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed var(--glass-border);">
            <strong>${item.quantity}x ${item.item_name}</strong>
            ${item.notes ? `<br><span style="font-size:0.9em; color:var(--warning);">Nota: ${item.notes}</span>` : ''}
        </li>
    `).join("");
    
    const orderCard = document.createElement('div');
    orderCard.className = "card";
    if(isNew) orderCard.style.animation = "slideIn 0.5s ease";
    orderCard.id = `order-${order.id}`;
    
    let badgeClass = order.status === 'ready' ? 'ready' : 'pending';
    let badgeText = order.status === 'ready' ? 'Lista' : 'Nueva';
    
    orderCard.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
            <h3 class="card-title">${order.table_name}</h3>
            <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <p style="font-size: 0.85em; color: var(--text-muted); margin-bottom: 15px;">
            Mesero: ${order.waiter_name}
        </p>
        <ul style="list-style: none; margin-bottom: 15px;">${itemsHtml}</ul>
        ${order.status !== 'ready' ? `<button class="btn success" style="width:100%" onclick="markOrderReady('${order.id}', this)">Marcar Lista</button>` : `<button class="btn" style="width:100%; background:var(--text-muted)" onclick="markOrderCompleted('${order.id}', this)">Archivar (Entregada)</button>`}
    `;
    
    container.prepend(orderCard);
}

async function markOrderReady(orderId, buttonElement) {
    buttonElement.innerText = "...";
    buttonElement.disabled = true;
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/ready?restaurant_id=${RESTAURANT_ID}`, { method: "PUT" });
        if (response.ok) {
            const card = document.getElementById(`order-${orderId}`);
            card.querySelector('.badge').className = "badge ready";
            card.querySelector('.badge').innerText = "Lista";
            buttonElement.outerHTML = `<button class="btn" style="width:100%; background:var(--text-muted)" onclick="markOrderCompleted('${orderId}', this)">Archivar (Entregada)</button>`;
            showToast("Orden lista");
        }
    } catch (e) {}
}

async function markOrderCompleted(orderId, buttonElement) {
    buttonElement.innerText = "...";
    try {
        const response = await fetch(`${API_BASE}/orders/${orderId}/completed?restaurant_id=${RESTAURANT_ID}`, { method: "PUT" });
        if (response.ok) {
            document.getElementById(`order-${orderId}`).remove();
        }
    } catch (e) {}
}
