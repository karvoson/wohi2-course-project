const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: path.join(__dirname,"..","..","public","uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const newName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`
    cb(null, newName)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimeType.startsWith("image")) {
      cb(null, true) 
      } else {
        cb(new Error ("Only images allowed"))
      }
    },
    limits: {fileSize: 5 * 1024 * 1024}
  
})

router.use(authenticate);
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

  router.get("/", async (req, res) => {
  const [filteredQuestions, total] = await Promise.all([
    prisma.questions.findMany({
        where,
        
  include: {
       keywords: true,
        user: true,
        likes: { where: { userId: req.user.userId }, take: 1 },
      _count: { select: { likes: true } },
       orderBy: { id: "asc" },
        skip,
        take: limit,
    }}),
    prisma.questions.count({ where }),
    
  ]);
  
  prisma.questions.findMany({
    include: {
        keywords: true,
        user: true,
        likes: { where: { userId: req.user.userId }, take: 1 },
        _count: { select: { likes: true } },
    },
});
  });

  // GET /posts/:postId
router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const question = await prisma.post.findUnique({
      where: { id: questionId },
      include: {
          keywords: true,
          user: true,
          likes: { where: { userId: req.user.userId }, take: 1 },
          _count: { select: { likes: true } },
      },
  });

  if (!question) {
      return res.status(404).json({message: "Post not found"});
  }
  res.json(formatQuestion(question));
});


 router.post("/",upload.single("image"),async  (req, res) => {
    const { title, date, content, keywords } = req.body;
  
    if (!title || !date || !content) {
      return res.status(400).json({
        message: "title, date, and content are required"
      });
    }
    
    const keywordsArray = Array.isArray(keywords) ? keywords : [];
    const imageUrl = req.file ? `/uploads/${req.file.filename}`:null;

    const newQuestion = await prisma.question.create({
      data: {
        title, date: new Date(date), content, imageUrl,
        userId: req.user.userId,
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
router.put("/:questionId",isOwner,upload.single("image"), async (req, res) => {
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
  const imageUrl = req.file ? `/uploads/${req.file.filename}`:null;

  const keywordsArray = Array.isArray(keywords) ? keywords : [];
  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      title, date: newDate(date), content, imageUrl, 
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
  
  res.json(formatQuestion(updatedQuestion));


  const question = questions.find((q) => q.id === questionId);

  const questions = await prisma.question.findMany({
    where,
    include: { keywords: true, user: true },
    orderBy: { id: "asc" }
});

function formatQuestion(question) {
  return {
    ...question,
    date: question.date.toISOString().split("T")[0],
    keywords: question.keywords.map((k) => k.name),
    userName: question.user?.name || null,
    likeCount: question._count?.likes ?? 0,
    liked: question.likes ? question.likes.length > 0 : false,
    user: undefined,
    likes: undefined,
    _count: undefined,
  };
}
  

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
  router.use(authenticate);
});


router.delete("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { keywords: true },
  });

  if (!question) {
    return res.status(404).json({ message: "Question not found" });
  }

  await prisma.question.delete({ where: { id: questionId } });

  res.json({
    data: filteredQuestions.map(formatQuestion),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
});

;
});


router.post("/:questionId/like", async (req, res) => {
  const questionId = Number(req.params.postId);

  const question = await prisma.post.findUnique({ where: { id: questionId } });
  if (!question) {
      return res.status(404).json({ message: "Post not found" });
  }

  const like = await prisma.like.upsert({
      where: { userId_questionId: { userId: req.user.userId, questionId } },
      update: {},
      create: { userId: req.user.userId, questionId },
  });

  const likeCount = await prisma.like.count({ where: { questionId } });

  res.status(201).json({
      id: like.id,
      questionId,
      liked: true,
      likeCount,
      createdAt: like.createdAt,
  });
});

// DELETE api/posts/:postId/like
router.delete("/:questionId/like", async (req, res) => {
const questionId = Number(req.params.questionId);

const question = await prisma.question.findUnique({ where: { id: questionId } });
if (!question) {
    return res.status(404).json({ message: "Post not found" });
}

await prisma.like.deleteMany({
    where: { userId: req.user.userId, questionId },
});

const likeCount = await prisma.like.count({ where: { questionId } });

res.json({ questionId, liked: false, likeCount });
});


module.exports = router;