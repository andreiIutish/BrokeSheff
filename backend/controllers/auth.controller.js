const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Local DB 
const USERS_FILE = path.join(__dirname, '..', 'users.json');
const HISTORY_FILE = path.join(__dirname, '..', 'history.json');


// load all users from the file 
function getUsers() {
  // If the file doesn't exist yet, create it with an empty array
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]');
  }

  const fileContent = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(fileContent);
}

//save the users array back to the file
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Load AI chat history from file.
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, '[]');
  }

  const fileContent = fs.readFileSync(HISTORY_FILE, 'utf8');
  return JSON.parse(fileContent);
}

// Save AI chat history back to file.
function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}


// REGISTER
// POST /api/auth/register
// Body: { email, password }
const register = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // email and password were sent
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 2. Password must be at least 6 characters
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // 3. Load existing users and check if this email is already taken
    const users = getUsers();
    const emailAlreadyExists = users.find((u) => u.email === email.toLowerCase());

    if (emailAlreadyExists) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    // 4. Hash the password 
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Build the new user object
    const newUser = {
      id: crypto.randomUUID(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    // 6. Add the new user to the list and save to file
    users.push(newUser);
    saveUsers(users);

    // 7. Send back the new user 
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: { id: newUser.id, email: newUser.email },
    });

  } catch (err) {
    next(err);
  }
};


// LOGIN 
// POST /api/auth/login
// Body: { email, password }
const login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // 1. Make sure email and password were sent
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // 2. Find the user by email
    const users = getUsers();
    const user = users.find((u) => u.email === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 3. Check if the password matches the hashed one in the file
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // 4. Create a JWT token that the app will use for future requests
    const token = jwt.sign(
      { id: user.id, email: user.email },  // data stored inside the token
      process.env.JWT_SECRET,               // secret key to sign it
      { expiresIn: '7d' }                   // token expires after 7 days
    );

    // 5. Send the token back to the client
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: { id: user.id, email: user.email },
    });

  } catch (err) {
    next(err);
  }
};


// GET ME
// GET /api/auth/me 
const getMe = async (req, res, next) => {
  try {
    // req.user is set by the verifyToken middleware before this runs
    const users = getUsers();
    const user = users.find((u) => u.id === req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });

  } catch (err) {
    next(err);
  }
};


// UPDATE PROFILE
// PUT /api/auth/profile
// Body: { email, currentPassword, newPassword }
const updateProfile = async (req, res, next) => {
  try {
    const email = req.body.email;
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;

    // Require current password for security before changing data.
    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    // At least one field must be changed.
    if (!email && !newPassword) {
      return res.status(400).json({ success: false, message: 'Provide email and/or new password' });
    }

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[userIndex];
    const passwordIsCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!passwordIsCorrect) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update email if provided.
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please provide a valid email' });
      }

      const emailTakenByAnotherUser = users.find(
        (u) => u.email === normalizedEmail && u.id !== user.id
      );

      if (emailTakenByAnotherUser) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }

      user.email = normalizedEmail;
    }

    // Update password if provided.
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    users[userIndex] = user;
    saveUsers(users);

    // Re-issue a token so the email inside token stays up to date.
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      token,
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });

  } catch (err) {
    next(err);
  }
};


// DELETE PROFILE
// DELETE /api/auth/profile
// Body: { currentPassword }
const deleteProfile = async (req, res, next) => {
  try {
    const currentPassword = req.body.currentPassword;

    if (!currentPassword) {
      return res.status(400).json({ success: false, message: 'Current password is required' });
    }

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[userIndex];
    const passwordIsCorrect = await bcrypt.compare(currentPassword, user.password);

    if (!passwordIsCorrect) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Remove user from users file.
    users.splice(userIndex, 1);
    saveUsers(users);

    // Remove this user's AI chats from history file.
    const history = getHistory();
    const filteredHistory = history.filter((chat) => chat.userId !== user.id);
    saveHistory(filteredHistory);

    return res.status(200).json({
      success: true,
      message: 'Profile deleted successfully',
    });

  } catch (err) {
    next(err);
  }
};


module.exports = { register, login, getMe, updateProfile, deleteProfile };
