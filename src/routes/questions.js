const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");

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
router.get("/:questionId", async (req, res) => {
    const questionId = Number(req.params.questionId);
  
    const questions = await prisma.question.findUnique({
      where: { id: questionId},
      include: { keywords: true},
    });
     

    if (!questions) {
      return res.status(404).json({ 
        message: "Post not found" });
    }
  
    res.json(questions);
  });  

 router.post("/",async  (req, res) => {
    const { title, date, content, keywords } = req.body;
  
    if (!title || !date || !content) {
      return res.status(400).json({
        message: "title, date, and content are required"
      });
    }
    
    const keywordsArray = Array.isArray(keywords) ? keywords : [];

    const newQuestion = await prisma.question.create({
      data: {
        title, date: new Date(date), content,
        keywords: {
          connectOrCreate: keywordsArray.map((kw) => ({
            where: { name: kw }, create: { name: kw},
          })), },
      },
      include: { keywords: true},
    });
    res.status(201).json(formatQuestion(newQuestion));

  });
  
  // PUT /posts/:postId
// Edit a post
router.put("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { title, date, content, keywords } = req.body;
  const existingQuestion = await prisma.question.findUnique({where : { id: questionId }
  });

  if (!existingQuestion) {
    return res.status(404).json({ message: "Question not found "});
  }
  if (!title || !date || !content) {
    return res.status(400).json({message: "title, sate and content are mandatory"
  });
  }
  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      title, date: newDate(date), content, 
      keywords: {
        set: [],
        connectOrCreate: keywordsArray.map((kw) => ({
          where: {name: kw},
          create: {name: kw},
        })),
     },
    },

    include: { keywords: true},
  });

  const question = questions.find((q) => q.id === questionId);

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
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

router.delete("/:questionId", async (req, res) => {
  const questionId = Number(req.params.postId);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { keywords: true },
  });

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  await prisma.question.delete({ where: { id: questionId } });

  res.json({
    message: "Question deleted successfully",
    question: formatPost(question),
  });
});


module.exports = router;