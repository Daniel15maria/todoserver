require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(helmet());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('Error connecting to MongoDB', err);
});

// Define the Todo schema and model
const todoSchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Todo = mongoose.model('Todo', todoSchema);

// Async handler
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
app.get('/api/todos', asyncHandler(async (req, res) => {
    const todos = await Todo.find();
    res.json(todos);
}));

app.post('/api/todos', [
    body('Name').notEmpty().withMessage('Name is required'),
    body('Description').notEmpty().withMessage('Description is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const todo = new Todo({
        Name: req.body.Name,
        Description: req.body.Description,
    });
    const newTodo = await todo.save();
    res.status(201).json(newTodo);
}));

app.put('/api/todos/:id', asyncHandler(async (req, res) => {
    const { Name, Description } = req.body;
    const updatedTodo = await Todo.findByIdAndUpdate(
        req.params.id,
        { Name, Description },
        { new: true, runValidators: true }
    );
    if (!updatedTodo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    res.json(updatedTodo);
}));

app.delete('/api/todos/:id', asyncHandler(async (req, res) => {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo) {
        return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted' });
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
