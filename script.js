// ==================== KODE UTAMA TOKO ONLINE ====================

// Data Produk
const products = [
    {
        id: 1,
        name: "fire silk wonton",
        price: 20000,
        image: "foto/fire silk wonton.jpg",
        description: "Kesan: lembut, pedas aromatik, classy dengan minyak cabai khas Asia.",
        category: "pedas"
    },
    // ... tambahkan produk lainnya
];

// Data Keranjang
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ==================== SISTEM REAL-TIME GITHUB ====================

// GitHub Repository Configuration
const GITHUB_USERNAME = "yourusername"; // GANTI dengan username GitHub Anda
const GITHUB_REPO = "pangsit-toko-online";
const GITHUB_TOKEN = ""; // Kosongkan untuk public repo

// Fungsi untuk simpan order ke GitHub (sebagai file JSON)
async function saveOrderToGitHub(orderData) {
    try {
        // Format nama file unik
        const filename = `orders/order_${Date.now()}.json`;
        
        // Data untuk disimpan
        const orderFile = {
            id: orderData.id,
            customer: orderData.customer,
            products: orderData.products,
            total: orderData.total,
            status: "pending",
            date: new Date().toISOString(),
            timestamp: Date.now()
        };
        
        // Simpan ke localStorage dulu (fallback)
        saveOrderToLocalStorage(orderFile);
        
        // Untuk GitHub, kita simpan di localStorage saja
        // (karena GitHub Pages static, tidak bisa POST)
        console.log('✅ Order disimpan ke sistem lokal');
        
        // Tampilkan QR code untuk admin
        showAdminQR(orderData.id);
        
        return true;
        
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

// Simpan order ke localStorage
function saveOrderToLocalStorage(order) {
    // Ambil semua order
    let allOrders = JSON.parse(localStorage.getItem('pangsit_orders')) || [];
    
    // Tambah order baru
    allOrders.push(order);
    
    // Simpan maksimal 50 order
    if (allOrders.length > 50) {
        allOrders = allOrders.slice(-50);
    }
    
    // Simpan ke localStorage
    localStorage.setItem('pangsit_orders', JSON.stringify(allOrders));
    
    // Dispatch event untuk update admin
    const event = new CustomEvent('newOrder', { detail: order });
    window.dispatchEvent(event);
}

// Tampilkan QR code untuk admin
function showAdminQR(orderId) {
    // Buat QR code container
    const modal = document.querySelector('.checkout-form');
    if (!modal) return;
    
    // Hapus QR code sebelumnya
    const existingQR = document.getElementById('adminQRCode');
    if (existingQR) existingQR.remove();
    
    // Buat QR code baru
    const qrDiv = document.createElement('div');
    qrDiv.id = 'adminQRCode';
    qrDiv.innerHTML = `
        <div style="text-align: center; margin: 20px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
            <h4><i class="fas fa-qrcode"></i> Scan untuk Admin</h4>
            <p style="font-size: 14px; color: #666; margin-bottom: 15px;">
                Scan kode ini di HP admin untuk update status
            </p>
            
            <div id="qrcodeCanvas" style="
                width: 150px;
                height: 150px;
                margin: 0 auto;
                padding: 10px;
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
            "></div>
            
            <div style="
                margin-top: 15px;
                padding: 10px;
                background: #2d3047;
                color: white;
                border-radius: 5px;
                font-family: monospace;
            ">
                ${orderId}
            </div>
            
            <button onclick="shareOrder('${orderId}')" style="
                margin-top: 15px;
                padding: 10px 20px;
                background: #25D366;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">
                <i class="fab fa-whatsapp"></i> Share ke Admin
            </button>
        </div>
    `;
    
    modal.appendChild(qrDiv);
    
    // Generate QR code
    generateQR(orderId);
}

// Generate QR code
function generateQR(text) {
    // Gunakan library QRCode.js via CDN
    const qrcode = new QRCode(document.getElementById("qrcodeCanvas"), {
        text: text,
        width: 128,
        height: 128,
        colorDark : "#2d3047",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
}

// Share order ke WhatsApp admin
function shareOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem('pangsit_orders')) || [];
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const message = `📦 ORDER BARU PANGS!T\n\nID: ${order.id}\nNama: ${order.customer.name}\nTelp: ${order.customer.phone}\nTotal: Rp ${order.total.toLocaleString()}\n\nSegera proses!`;
    
    window.open(`https://wa.me/6283195243139?text=${encodeURIComponent(message)}`, '_blank');
}

// Inisialisasi
function init() {
    // Load produk
    renderProducts();
    
    // Load keranjang
    updateCart();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load QR code library
    loadQRCodeLibrary();
}

// Load QR code library
function loadQRCodeLibrary() {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    document.head.appendChild(script);
}

// Setup event listeners
function setupEventListeners() {
    // Event listener untuk tombol checkout
    const checkoutBtn = document.getElementById('closeOrderModal');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function() {
            // 1. Ambil data dari form
            const name = document.getElementById('fullName').value;
            const phone = document.getElementById('phone').value;
            const address = document.getElementById('address').value;
            
            // 2. Buat order data
            const orderData = {
                id: 'PANG-' + Date.now(),
                customer: { name, phone, address },
                products: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: calculateTotal(),
                date: new Date().toLocaleString('id-ID')
            };
            
            // 3. Simpan ke sistem
            await saveOrderToGitHub(orderData);
            
            // 4. Tampilkan konfirmasi
            alert('✅ Order berhasil! Scan QR code untuk admin.');
        });
    }
}

// Hitung total
function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal + 15000 + (subtotal * 0.1);
}

// Fungsi lainnya (renderProducts, updateCart, dll) tetap sama...