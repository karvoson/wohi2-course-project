const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const authenticate = require("../middleware/auth");
const isOwner = require("../middleware/isOwner");
const multer = require("multer");
const path = require("path");
const {NotFoundError} = require("../lib/errors");
const { ValidationError } = require("../lib/errors");
const {z} = require("zod");

const QuestionInput = z.object({
  title: z.string().min(1),
  date: z.string().date(),
  content: z.string().min(1),
  keywords: z.union([z.string(),z.array(z.string())]).optional()
})

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
    if (file.mimetype.startsWith("image")) {
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

function parseKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords;
  if (typeof keywords === "string") {
    return keywords.split(",").map((k) => k.trim()).filter(Boolean);
  }
  return [];
}

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
  

router.get("/", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 5));
  const skip = (page - 1) * limit;

  const { keyword } = req.query;
  const where = keyword ? { keywords: { some: { name: keyword}}}: {};

  const [filteredQuestions, total] = await Promise.all([
    prisma.question.findMany({
      where,
       include: {
          keywords: true,
          user: true,
          attempts: true,
       },  
       orderBy: { id: "asc" },
        skip,
        take: limit,
    }),
    prisma.questions.count({ where }),
  ]);
  res.json({
    data: filteredQuestions.map((q) => formatQuestion(q, req.user.userId)),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});


  // GET /posts/:postId
router.get("/:questionId", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
          keywords: true,
          user: true,
          attempts: true,
          likes: { where: { userId: req.user.userId }, take: 1 },
          _count: { select: { likes: true } },
      },
  });

  if (!question) {
    throw new NotFoundError("Question not found");
  }
  res.json(formatQuestion(question, req.user.userId));
});


 router.post("/",upload.single("image"),async  (req, res) => {

    const { title, date, content, keywords } = QuestionInput.parse(req.body);
    const imageUrl = req.file ? `/uploads/${req.file.filename}`:null;

    if (!question || !answer) {
      throw new ValidationError("title, date and content required");
    }

    const keywordsArray = parseKeywords(keywords);

    const newQuestion = await prisma.question.create({
      data: {
        title: question,
        date: new Date(date), 
        content: answer,
        imageUrl,
        userId: req.user.userId,
        keywords: {
          connectOrCreate: keywordsArray.map((kw) => ({
            where: { name: kw }, 
            create: { name: kw},
          })), 
        },
      },
      include:{ 
        keywords: true,
        user: true,
        attempts: true,
        likes: {where: {userId: req.user.userId}, take: 1},
        _count: { select: {likes: true}}
    },
    });
    res.status(201).json(formatQuestion(newQuestion, req.user.userId));

  });
  
  // PUT /posts/:postId
// Edit a post
router.put("/:questionId",isOwner,upload.single("image"), async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { title, date, content, keywords } = req.body;

  const existingQuestion = await prisma.question.findUnique({where: {id: questionId}});

  if (!existingQuestion) {
    throw new NotFoundError("Question not found");
  }
  if (!title || !date || !content) {
    throw new ValidationError("title, date and content are mandatory");
  }
  const data = {
    title,
    date: new Date(date),
    content,
  };
  if (req.file) {
    data.imageUrl = `/uploads/${req.file.filename}`;
  }
  
  const keywordsArray = parseKeywords(keywords);
  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...data,
      keywords: {
        set: [],
        connectOrCreate: keywordsArray.map((kw) => ({
          where: {name: kw},
          create: {name: kw},
        })),
     },
    },

    include: { keywords: true}, attempts: true,
  });
  res.json(formatQuestion(updatedQuestion, req.user.userId));
});


router.delete("/:questionId", isOwner, async (req, res) => {
  const questionId = Number(req.params.questionId);

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { keywords: true, attempts: true },
  });

  if (!question) {
    throw new NotFoundError("Question not found");
  }

  await prisma.question.delete({ where: { id: questionId } });

  res.json({
    message: "Question deteted succesfully",
    question: formatQuestion(question, req.user.userId),
});
});

router.post("/:questionId/like", async (req, res) => {
  const questionId = Number(req.params.questionId);
  const { answer} = req.body;
  
  if (!answer) {
    throw new NotFoundError("Answer is required");
  }

  const question = await prisma.question.findUnique({ 
    where: { id: questionId } });
  if (!question) {
    throw new NotFoundError("Question not found");
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
  throw new NotFoundError("Question not found");
}

await prisma.like.deleteMany({
    where: { userId: req.user.userId, questionId },
});

const likeCount = await prisma.like.count({ where: { questionId } });

res.json({ questionId, liked: false, likeCount });
});


module.exports = router;