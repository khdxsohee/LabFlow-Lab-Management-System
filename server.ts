import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("lab.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivery_date DATE
  );

  CREATE TABLE IF NOT EXISTS booking_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER,
    test_id INTEGER,
    test_name TEXT,
    price REAL,
    FOREIGN KEY(booking_id) REFERENCES bookings(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial settings
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as { count: number };
if (settingsCount.count === 0) {
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run("lab_name", "LabFlow Diagnostics");
  insertSetting.run("lab_address", "123 Health Street, Medical District, Karachi");
  insertSetting.run("lab_phone", "021-3456789");
  insertSetting.run("whatsapp_template", "Assalam-o-Alaikum {patient_name}, Aapki lab report tayyar hai. Booking ID: {booking_id}. Total Amount: PKR {total_amount}. Shukriya!");
}

// Seed initial tests if empty
const testCount = db.prepare("SELECT COUNT(*) as count FROM tests").get() as { count: number };
if (testCount.count === 0) {
  const insertTest = db.prepare("INSERT INTO tests (name, price, category) VALUES (?, ?, ?)");
  insertTest.run("Complete Blood Count (CBC)", 800, "Hematology");
  insertTest.run("Blood Sugar (Fasting)", 300, "Biochemistry");
  insertTest.run("Lipid Profile", 1500, "Biochemistry");
  insertTest.run("Liver Function Test (LFT)", 1200, "Biochemistry");
  insertTest.run("Renal Function Test (RFT)", 1000, "Biochemistry");
  insertTest.run("Thyroid Profile (T3, T4, TSH)", 2500, "Hormones");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/tests", (req, res) => {
    const tests = db.prepare("SELECT * FROM tests").all();
    res.json(tests);
  });

  app.get("/api/bookings", (req, res) => {
    const bookings = db.prepare(`
      SELECT b.*, GROUP_CONCAT(bi.test_name, ', ') as test_names 
      FROM bookings b 
      LEFT JOIN booking_items bi ON b.id = bi.booking_id 
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `).all();
    res.json(bookings);
  });

  app.post("/api/bookings", (req, res) => {
    const { patient_name, whatsapp, total_amount, delivery_date, items } = req.body;
    
    const insertBooking = db.prepare(`
      INSERT INTO bookings (patient_name, whatsapp, total_amount, delivery_date) 
      VALUES (?, ?, ?, ?)
    `);
    
    const info = insertBooking.run(patient_name, whatsapp, total_amount, delivery_date);
    const bookingId = info.lastInsertRowid;

    const insertItem = db.prepare(`
      INSERT INTO booking_items (booking_id, test_id, test_name, price) 
      VALUES (?, ?, ?, ?)
    `);

    for (const item of items) {
      insertItem.run(bookingId, item.id, item.name, item.price);
    }

    res.json({ id: bookingId, status: "success" });
  });

  app.patch("/api/bookings/:id/status", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
    res.json({ status: "success" });
  });

  app.delete("/api/bookings/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM booking_items WHERE booking_id = ?").run(id);
    db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
    res.json({ status: "success" });
  });

  app.post("/api/tests", (req, res) => {
    try {
      const { name, price, category } = req.body;
      if (!name || isNaN(price)) {
        return res.status(400).json({ error: "Invalid test data. Name and price are required." });
      }
      const insertTest = db.prepare("INSERT INTO tests (name, price, category) VALUES (?, ?, ?)");
      const info = insertTest.run(name, price, category);
      res.json({ id: info.lastInsertRowid, status: "success" });
    } catch (error) {
      console.error("Error adding test:", error);
      res.status(500).json({ error: "Failed to save test to database." });
    }
  });

  app.delete("/api/tests/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM tests WHERE id = ?").run(id);
    res.json({ status: "success" });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsObj = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsObj);
  });

  app.patch("/api/settings", (req, res) => {
    const updates = req.body;
    const updateSetting = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    for (const [key, value] of Object.entries(updates)) {
      updateSetting.run(key, value);
    }
    res.json({ status: "success" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
