const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const pool = require('./db');
const { verifyToken, requireAdmin, secret } = require('./middleware/auth');

const app = express();
const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  fileFilter(req, file, cb) {
    const allowed = ['image/png', 'image/jpeg'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG and JPG images are allowed'));
    }
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

function parsePositiveNumber(value) {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

app.post('/auth/register', upload.single('profile'), async (req, res) => {
  try {
    const { name, email, password, phone, flat_no } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if (!name || !email || !password || !flat_no) {
      return res.status(400).json({ error: 'Name, email, password and flat number are required' });
    }

    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (name, email, password, phone, flat_no, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || '', flat_no, 'member', profileImage]
    );

    const user = { id: result.insertId, role: 'member', name, email, profile_image: profileImage };
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, secret, { expiresIn: '8h' });
    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to register user' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [user] = await query('SELECT id, name, email, password, role, profile_image FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, secret, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_image: user.profile_image } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const totalMembers = await query("SELECT COUNT(*) AS count FROM users WHERE role='member'");
    const totalWorkers = await query('SELECT COUNT(*) AS count FROM workers');
    const totalExpenses = await query('SELECT IFNULL(SUM(amount), 0) AS total FROM expenses');
    const totalMaintenance = await query("SELECT IFNULL(SUM(amount), 0) AS total FROM maintenance WHERE status='Paid'");
    const recentExpenses = await query(
      'SELECT e.id, e.category, e.expense_date, e.amount, e.description FROM expenses e ORDER BY e.expense_date DESC LIMIT 5'
    );
    const recentAttendance = await query(
      'SELECT a.id, w.name AS worker_name, a.date, a.status FROM attendance a JOIN workers w ON a.worker_id = w.id ORDER BY a.date DESC LIMIT 5'
    );

    res.json({
      totalMembers: totalMembers[0].count,
      totalWorkers: totalWorkers[0].count,
      totalExpenses: totalExpenses[0].total,
      totalMaintenance: totalMaintenance[0].total,
      recentExpenses,
      recentAttendance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load dashboard' });
  }
});

app.get('/members', verifyToken, async (req, res) => {
  try {
    const members = await query('SELECT id, name, email, phone, flat_no, profile_image, created_at FROM users WHERE role = ? ORDER BY created_at DESC', ['member']);
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load members' });
  }
});

app.get('/members/:id', verifyToken, async (req, res) => {
  try {
    const [member] = await query('SELECT id, name, email, phone, flat_no, profile_image, created_at FROM users WHERE id = ? AND role = ?', [req.params.id, 'member']);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load member' });
  }
});

app.post('/members', verifyToken, requireAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, email, phone, flat_no, password } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if (!name || !email || !flat_no) {
      return res.status(400).json({ error: 'Name, email and flat number are required' });
    }
    const [existing] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    const passwordHash = await bcrypt.hash(password || 'member123', 10);
    await query('INSERT INTO users (name, email, phone, flat_no, password, role, profile_image) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      name,
      email,
      phone || '',
      flat_no,
      passwordHash,
      'member',
      profileImage,
    ]);
    res.status(201).json({ message: 'Member created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create member' });
  }
});

app.put('/members/:id', verifyToken, requireAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, email, phone, flat_no, password } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    const fields = [];
    const values = [];
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (email) {
      fields.push('email = ?');
      values.push(email);
    }
    if (phone) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (flat_no) {
      fields.push('flat_no = ?');
      values.push(flat_no);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      fields.push('password = ?');
      values.push(passwordHash);
    }
    if (profileImage) {
      fields.push('profile_image = ?');
      values.push(profileImage);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    values.push(req.params.id, 'member');
    await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ? AND role = ?`,
      values
    );
    res.json({ message: 'Member updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update member' });
  }
});

app.delete('/members/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM users WHERE id = ? AND role = ?', [req.params.id, 'member']);
    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete member' });
  }
});

app.get('/workers', verifyToken, async (req, res) => {
  try {
    const workers = await query('SELECT id, name, phone, type, salary, profile_image, created_at FROM workers ORDER BY created_at DESC');
    res.json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load workers' });
  }
});

app.get('/workers/:id', verifyToken, async (req, res) => {
  try {
    const [worker] = await query('SELECT id, name, phone, type, salary, profile_image, created_at FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load worker' });
  }
});

app.post('/workers', verifyToken, requireAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, phone, type, salary } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    const salaryValue = salary === undefined || salary === null || salary === '' ? 0 : parsePositiveNumber(salary);
    if (salaryValue === null) {
      return res.status(400).json({ error: 'Salary must be a non-negative number' });
    }
    await query('INSERT INTO workers (name, phone, type, salary, profile_image) VALUES (?, ?, ?, ?, ?)', [name, phone || '', type, salaryValue, profileImage]);
    res.status(201).json({ message: 'Worker created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create worker' });
  }
});

app.put('/workers/:id', verifyToken, requireAdmin, upload.single('profile'), async (req, res) => {
  try {
    const { name, phone, type, salary } = req.body;
    const profileImage = req.file ? req.file.filename : null;
    const fields = [];
    const values = [];
    if (name) {
      fields.push('name = ?');
      values.push(name);
    }
    if (phone) {
      fields.push('phone = ?');
      values.push(phone);
    }
    if (type) {
      fields.push('type = ?');
      values.push(type);
    }
    if (salary !== undefined && salary !== '') {
      const salaryValue = parsePositiveNumber(salary);
      if (salaryValue === null) {
        return res.status(400).json({ error: 'Salary must be a non-negative number' });
      }
      fields.push('salary = ?');
      values.push(salaryValue);
    }
    if (profileImage) {
      fields.push('profile_image = ?');
      values.push(profileImage);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    values.push(req.params.id);
    await query(`UPDATE workers SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Worker updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update worker' });
  }
});

app.delete('/workers/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM workers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Worker deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete worker' });
  }
});

app.get('/attendance', verifyToken, async (req, res) => {
  try {
    const attendance = await query(
      'SELECT a.id, a.worker_id, w.name AS worker_name, w.type AS worker_type, a.date, a.status FROM attendance a JOIN workers w ON a.worker_id = w.id ORDER BY a.date DESC, a.created_at DESC'
    );
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load attendance' });
  }
});

app.post('/attendance', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { worker_id, date, status } = req.body;
    if (!worker_id || !date || !status) {
      return res.status(400).json({ error: 'Worker, date and status are required' });
    }
    await query('INSERT INTO attendance (worker_id, date, status) VALUES (?, ?, ?)', [worker_id, date, status]);
    res.status(201).json({ message: 'Attendance recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to record attendance' });
  }
});

app.put('/attendance/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { worker_id, date, status } = req.body;
    const fields = [];
    const values = [];
    if (worker_id) {
      fields.push('worker_id = ?');
      values.push(worker_id);
    }
    if (date) {
      fields.push('date = ?');
      values.push(date);
    }
    if (status) {
      fields.push('status = ?');
      values.push(status);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    values.push(req.params.id);
    await query(`UPDATE attendance SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Attendance updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update attendance' });
  }
});

app.delete('/attendance/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM attendance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Attendance deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete attendance' });
  }
});

app.get('/expenses', verifyToken, async (req, res) => {
  try {
    const expenses = await query(
      'SELECT e.id, e.category, e.expense_date, e.amount, e.description, e.created_at, GROUP_CONCAT(p.filename) AS proofs FROM expenses e LEFT JOIN expense_proofs p ON e.id = p.expense_id GROUP BY e.id, e.category, e.expense_date, e.amount, e.description, e.created_at ORDER BY e.expense_date DESC, e.created_at DESC'
    );
    res.json(expenses.map((row) => ({
      ...row,
      proofs: row.proofs ? row.proofs.split(',') : [],
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load expenses' });
  }
});

app.post('/expenses', verifyToken, requireAdmin, upload.array('proofs', 5), async (req, res) => {
  try {
    const { category, expense_date, amount, description } = req.body;
    const amountValue = parsePositiveNumber(amount);
    if (!category || !expense_date || amountValue === null) {
      return res.status(400).json({ error: 'Category, expense date and amount are required and amount must be non-negative' });
    }
    const result = await query(
      'INSERT INTO expenses (category, expense_date, amount, description) VALUES (?, ?, ?, ?)',
      [category, expense_date, amountValue, description || '']
    );
    const expenseId = result.insertId;
    if (req.files && req.files.length) {
      // const inserts = req.files.map((file) => [expenseId, file.filename]);
      // await query('INSERT INTO expense_proofs (expense_id, filename) VALUES ? ', [inserts]);
      for (const file of req.files) {
        await query('INSERT INTO expense_proofs (expense_id, filename) VALUES (?, ?)',
          [expenseId, file.filename]);
      }
    }
    res.status(201).json({ message: 'Expense recorded' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create expense' });
  }
});

app.put('/expenses/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { category, expense_date, amount, description } = req.body;
    const fields = [];
    const values = [];
    if (category) {
      fields.push('category = ?');
      values.push(category);
    }
    if (expense_date) {
      fields.push('expense_date = ?');
      values.push(expense_date);
    }
    if (amount !== undefined) {
      const amountValue = parsePositiveNumber(amount);
      if (amountValue === null) {
        return res.status(400).json({ error: 'Expense amount must be a non-negative number' });
      }
      fields.push('amount = ?');
      values.push(amountValue);
    }
    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    values.push(req.params.id);
    await query(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Expense updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update expense' });
  }
});

app.delete('/expenses/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM expense_proofs WHERE expense_id = ?', [req.params.id]);
    await query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete expense' });
  }
});

app.get('/maintenance', verifyToken, async (req, res) => {
  try {
    const records = await query(
      'SELECT m.id, m.member_id, u.name AS member_name, u.flat_no, m.month_year, m.amount, m.status, m.paid_date, m.created_at FROM maintenance m JOIN users u ON m.member_id = u.id ORDER BY m.month_year DESC, m.created_at DESC'
    );
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to load maintenance records' });
  }
});

app.post('/maintenance', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { member_id, month_year, amount, status } = req.body;
    const amountValue = parsePositiveNumber(amount);
    if (!member_id || !month_year || amountValue === null) {
      return res.status(400).json({ error: 'Member, month and amount are required and amount must be non-negative' });
    }
    await query(
      'INSERT INTO maintenance (member_id, month_year, amount, status, paid_date) VALUES (?, ?, ?, ?, ?)',
      [member_id, month_year, amountValue, status || 'Unpaid', status === 'Paid' ? new Date() : null]
    );
    res.status(201).json({ message: 'Maintenance record created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create maintenance record' });
  }
});

app.put('/maintenance/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { member_id, month_year, amount, status } = req.body;
    const fields = [];
    const values = [];
    if (member_id) {
      fields.push('member_id = ?');
      values.push(member_id);
    }
    if (month_year) {
      fields.push('month_year = ?');
      values.push(month_year);
    }
    if (amount !== undefined) {
      const amountValue = parsePositiveNumber(amount);
      if (amountValue === null) {
        return res.status(400).json({ error: 'Maintenance amount must be a non-negative number' });
      }
      fields.push('amount = ?');
      values.push(amountValue);
    }
    if (status) {
      fields.push('status = ?');
      values.push(status);
      fields.push('paid_date = ?');
      values.push(status === 'Paid' ? new Date() : null);
    }
    if (!fields.length) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    values.push(req.params.id);
    await query(`UPDATE maintenance SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ message: 'Maintenance updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update maintenance' });
  }
});

app.delete('/maintenance/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM maintenance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Maintenance deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete maintenance' });
  }
});

app.post('/maintenance/generate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { month_year, amount } = req.body;
    const amountValue = parsePositiveNumber(amount);
    if (!month_year || amountValue === null) {
      return res.status(400).json({ error: 'Month and amount are required and amount must be non-negative' });
    }
    const members = await query('SELECT id FROM users WHERE role = ?', ['member']);
    for (const member of members) {
      await query(`INSERT INTO maintenance (member_id, month_year, amount, status, paid_date) VALUES (?, ?, ?, ?, ?)`,
        [member.id, month_year, amountValue, 'Unpaid', null]);
    }
    res.status(201).json({ message: 'Monthly maintenance generated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to generate maintenance records' });
  }
});

app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('Only PNG and JPG images are allowed')) {
    return res.status(400).json({ error: err.message });
  }
  if (err && err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
