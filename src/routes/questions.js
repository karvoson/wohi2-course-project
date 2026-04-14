const express = require("express");
const router = express.Router();

const questions = require("../data/questions");

// GET /posts 
// List all posts
router.get("/", (req, res) => {
    const { keyword } = req.query;
  
    if (!keyword) {
      return res.json(questions);
    }
  
    const filteredQuestions = questions.filter(questions =>
      questions.keywords.includes(keyword.toLowerCase())
    );
  
    res.json(filteredQuestions);
  });  

  // GET /posts/:postId
router.get("/:questionId", (req, res) => {
    const questionId = Number(req.params.questionId);
  
    const questions = questions.find((q) => q.id === questionId);
  
    if (!questions) {
      return res.status(404).json({ message: "Post not found" });
    }
  
    res.json(questions);
  });  

 router.post("/", (req, res) => {
    const { title, date, content, keywords } = req.body;
  
    if (!title || !date || !content) {
      return res.status(400).json({
        message: "title, date, and content are required"
      });
    }
    const maxId = Math.max(...questions.map(q => q.id), 0);
  
    const newQuestion = {
      id: questions.length ? maxId + 1 : 1,
      title, date, content,
      keywords: Array.isArray(keywords) ? keywords : []
    };
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
  });
  
  // PUT /posts/:postId
// Edit a post
router.put("/:questionId", (req, res) => {
  const questionId = Number(req.params.questionId);
  const { title, date, content, keywords } = req.body;

  const question = questions.find((q) => q.id === questionId);

  if (!question) {
    return res.status(404).json({ message: "Post not found" });
  }

  if (!title || !date || !content) {
    return res.json({
      message: "title, date, and content are required"
    });
  }

  question.title = title;
  question.date = date;
  question.content = content;
  question.keywords = Array.isArray(keywords) ? keywords : [];

  res.json(question);
});


module.exports = router;