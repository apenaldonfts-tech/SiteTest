import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- AYARLAR (BURAYI DOLDUR) ---
const PORT = 3000;
const TELEGRAM_BOT_TOKEN = "8241409965:AAFAgibcvCWQ8wa1jn51BchWE4A_CePpAa4"; // Örn: 123456:ABC-DEF...
const TELEGRAM_CHAT_ID = "6824522530";     // Örn: -100123456789 veya 12345678

// Dosya Yolu Ayarları
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE_PATH = path.join(__dirname, 'whitelist.csv');

const app = express();

app.use(cors());
app.use(express.json());

// CSV Dosyası Yoksa Başlıkları Oluştur
if (!fs.existsSync(CSV_FILE_PATH)) {
    fs.writeFileSync(CSV_FILE_PATH, 'Date,Username,Wallet\n');
}

// Telegram'a Mesaj Gönderme Fonksiyonu
async function sendToTelegram(username, wallet) {
    if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN === "BURAYA_BOT_TOKEN_YAZILACAK") {
        console.log("Telegram Token girilmediği için mesaj gönderilmedi.");
        return;
    }

    const message = `🚨 **YENİ WHITELIST KAYDI!** 🚨\n\n👤 **User:** ${username}\nB **Wallet:** \`${wallet}\`\n🕒 **Zaman:** ${new Date().toLocaleString('tr-TR')}`;
    
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        const data = await response.json();
        if(!data.ok) console.error("Telegram Hatası:", data);
    } catch (error) {
        console.error("Telegram bağlantı hatası:", error);
    }
}

// POST İsteği Geldiğinde Çalışacak Endpoint
app.post('/api/save-wallet', async (req, res) => {
    const { username, wallet } = req.body;

    if (!username || !wallet) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi.' });
    }

    console.log(`Yeni Kayıt: ${username} - ${wallet}`);

    try {
        // 1. CSV Dosyasına Kaydet
        const date = new Date().toISOString();
        const csvLine = `${date},${username},${wallet}\n`;
        
        fs.appendFile(CSV_FILE_PATH, csvLine, (err) => {
            if (err) {
                console.error("CSV Yazma Hatası:", err);
                return res.status(500).json({ success: false, message: 'Dosya hatası' });
            }
        });

        // 2. Telegram'a Gönder
        await sendToTelegram(username, wallet);

        // 3. Başarılı Yanıt Dön
        res.json({ success: true, message: 'Kaydedildi!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server hatası' });
    }
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`Server çalışıyor: http://localhost:${PORT}`);
    console.log(`CSV Dosyası konumu: ${CSV_FILE_PATH}`);
});