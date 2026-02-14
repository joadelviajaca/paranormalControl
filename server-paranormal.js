import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// --- CONFIGURACIÓN ---
const app = express();
const PORT = 4000;
const SECRET_KEY = 'classified_bureau_secret_X99';

app.use(cors());
app.use(express.json());

// --- DATABASE (IN MEMORY) ---
let mongoServer;
const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("👁️  Bureau Database: CONNECTED [Top Secret Clearance]");
  await seedDatabase();
};

// --- HELPER: WRAPPED RESPONSE ---
const sendResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    data: data
  });
};

// --- MODELOS ---
const AgentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  codeName: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  clearanceLevel: { type: Number, default: 1 } // 1 a 5
});

const AnomalySchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: { type: String, required: true },
  dangerLevel: { type: String, enum: ['Safe', 'Euclid', 'Keter'], required: true },
  status: { type: String, enum: ['Contained', 'Breached', 'Unknown'], default: 'Contained' },
  registeredBy: { type: String }
});

// RECURSO EXTRA 1: Equipamiento (Para despistar/CRUD extra)
const EquipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Weapon', 'Defense', 'Utility'], required: true },
  condition: { type: String, enum: ['New', 'Used', 'Damaged'], default: 'New' },
  assignedTo: { type: String, default: null } // codeName del agente
});

// RECURSO EXTRA 2: Ubicaciones (Solo lectura)
const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coordinates: { type: String, required: true },
  riskLevel: { type: String, default: 'Low' }
});

const Agent = mongoose.model('Agent', AgentSchema);
const Anomaly = mongoose.model('Anomaly', AnomalySchema);
const Equipment = mongoose.model('Equipment', EquipmentSchema);
const Location = mongoose.model('Location', LocationSchema);

// --- SEED ---
const seedDatabase = async () => {
  if ((await Agent.countDocuments()) === 0) {
    const hash = await bcrypt.hash('1234', 10);

    // Agentes
    await Agent.create([
      { email: 'director@bureau.com', password: hash, codeName: 'Director Faden', department: 'Dirección', clearanceLevel: 5 },
      { email: 'agent@bureau.com', password: hash, codeName: 'Agente Mulder', department: 'Investigación', clearanceLevel: 1 }
    ]);

    // Anomalías
    await Anomaly.create([
      { subject: 'OBJ-084', description: 'Nevera que altera el tiempo.', dangerLevel: 'Safe', status: 'Contained', registeredBy: 'Director Faden' },
      { subject: 'OBJ-102', description: 'Sombra autónoma.', dangerLevel: 'Keter', status: 'Breached', registeredBy: 'Director Faden' },
      { subject: 'OBJ-333', description: 'Pato de goma psíquico.', dangerLevel: 'Euclid', status: 'Contained', registeredBy: 'Agente Mulder' }
    ]);

    // Equipamiento (Datos de relleno)
    await Equipment.create([
      { name: 'Proton Pack V2', type: 'Weapon', condition: 'Used', assignedTo: 'Agente Mulder' },
      { name: 'PKE Meter', type: 'Utility', condition: 'New', assignedTo: null },
      { name: 'Holy Water Grenade', type: 'Weapon', condition: 'Damaged', assignedTo: null }
    ]);

    // Ubicaciones
    await Location.create([
      { name: 'Area 51', coordinates: '37.2343, -115.8067', riskLevel: 'High' },
      { name: 'Bermuda Triangle', coordinates: '25.0000, -71.0000', riskLevel: 'Medium' }
    ]);
    
    console.log("📂 Archivos Clasificados cargados. Director: director@bureau.com / Agente: agent@bureau.com (Pass: 1234)");
  }
};

// --- MIDDLEWARES ---
app.use((req, res, next) => { setTimeout(next, 300); }); // Latencia

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ status: 'error', message: 'Token requerido.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ status: 'error', message: 'Token inválido.' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTER ---
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const agent = await Agent.findOne({ email });
  if (!agent || !(await bcrypt.compare(password, agent.password))) return res.status(401).json({ status: 'error', message: 'Credenciales incorrectas' });

  // Token sin password
  const payload = { id: agent._id, email: agent.email, codeName: agent.codeName, department: agent.department, clearanceLevel: agent.clearanceLevel };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  sendResponse(res, { token });
});

app.post('/auth/register', async (req, res) => {
  const { email, password, codeName, department } = req.body;
  if (await Agent.findOne({ email })) return res.status(400).json({ status: 'error', message: 'Email existe' });
  if (await Agent.findOne({ codeName })) return res.status(400).json({ status: 'error', message: 'CodeName existe' });
  
  const hash = await bcrypt.hash(password, 10);
  await Agent.create({ email, password: hash, codeName, department, clearanceLevel: 1 });
  sendResponse(res, { message: 'Agente registrado.' }, 201);
});

app.get('/check-codename', async (req, res) => {
  const { codeName } = req.query;
  const exists = await Agent.exists({ codeName });
  sendResponse(res, { exists: !!exists });
});

app.get('/auth/validate-token', authenticateToken, (req, res) => {
  sendResponse(res, { valid: true });
});

// --- ANOMALY ROUTER ---
app.get('/anomalies', authenticateToken, async (req, res) => {
  const list = await Anomaly.find();
  sendResponse(res, list);
});

app.post('/anomalies', authenticateToken, async (req, res) => {
  const { subject, description, dangerLevel } = req.body;
  if(!subject || !description) return res.status(400).json({ status: 'error', message: 'Datos incompletos' });
  const newItem = await Anomaly.create({ subject, description, dangerLevel, registeredBy: req.user.codeName });
  sendResponse(res, newItem, 201);
});

// PUT /anomalies/:id (Modificar Anomalía)
app.put('/anomalies/:id', authenticateToken, async (req, res) => {
  try {
    const { description, status, dangerLevel } = req.body;
    const updated = await Anomaly.findByIdAndUpdate(req.params.id, { description, status, dangerLevel }, { new: true });
    if (!updated) return res.status(404).json({ status: 'error', message: 'Anomalía no encontrada' });
    sendResponse(res, updated);
  } catch(e) { res.status(500).json({ status: 'error', message: 'Error interno' }); }
});

app.delete('/anomalies/:id', authenticateToken, async (req, res) => {
  if (req.user.clearanceLevel < 5) return res.status(403).json({ status: 'error', message: 'Nivel insuficiente.' });
  await Anomaly.findByIdAndDelete(req.params.id);
  sendResponse(res, { message: 'Eliminado.' });
});

// --- EQUIPMENT ROUTER (RECURSO EXTRA PARA DESPISTAR) ---
app.get('/equipment', authenticateToken, async (req, res) => {
  const list = await Equipment.find();
  sendResponse(res, list);
});

app.post('/equipment', authenticateToken, async (req, res) => {
  const newItem = await Equipment.create(req.body);
  sendResponse(res, newItem, 201);
});

app.put('/equipment/:id', authenticateToken, async (req, res) => {
  const updated = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
  sendResponse(res, updated);
});

app.delete('/equipment/:id', authenticateToken, async (req, res) => {
  await Equipment.findByIdAndDelete(req.params.id);
  sendResponse(res, { message: 'Item dado de baja.' });
});

// --- LOCATIONS ROUTER (SOLO LECTURA) ---
app.get('/locations', authenticateToken, async (req, res) => {
  const list = await Location.find();
  sendResponse(res, list);
});

// --- INIT ---
connectDB().then(() => {
  app.listen(PORT, () => console.log(`👻 Bureau API v2 escuchando en http://localhost:${PORT}`));
});