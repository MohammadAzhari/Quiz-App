var express = require("express");
const asyncHandler = require("express-async-handler");
var router = express.Router();
const Questions = require("../models/questions");
const Test = require("../models/test");
const multer = require("multer");
const path = require("path");
const { notEqual } = require("assert");
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "../public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });
let flashMessage = [];

router.get(
  "/test",
  asyncHandler(async (req, res, next) => {
    const test = await Test.findOne({ testName: req.query.name });
    if (
      (test.secret.is &&
        req.query.password &&
        req.query.password == test.secret.password) ||
      !test.secret.is
    ) {
      const questions = await Questions.find({ testName: req.query.name });
      res.render("index", { arr: questions, testName: req.query.name });
    } else {
      flashMessage.push("wrong password");
      res.redirect("alltests");
    }
  })
);

router.get("/", (req, res, next) => {
  res.render("home");
});

router.get("/alltests", async (req, res, next) => {
  let msg = flashMessage;
  flashMessage = [];
  const alltests = await Test.find();
  puplishedTests = [];
  if (alltests.length > 0) {
    await alltests.forEach((test) => {
      if (test.number > 0) {
        puplishedTests.push(test);
      }
    });
  }
  res.render("alltests", { puplishedTests, msg });
});

function newTest(req, res) {
  let it = {
    testName: req.query.name,
    number: 0,
  };
  Test.create(it).then((r) => {
    res.render("createtest", { condition: true, id: r._id });
  });
}

router.get("/createtest", async (req, res, next) => {
  let msg = flashMessage;
  flashMessage = [];
  if (!req.query.name) res.render("createtest", { condition: false, msg });
  else {
    let test = await Test.findOne({ testName: req.query.name });
    if (!test) {
      if (req.query.name.length !== 24) {
        newTest(req, res);
      } else {
        let oldTest = await Test.findById(req.query.name);
        if (!oldTest) {
          newTest(req, res);
        } else {
          res.redirect(`edittest?id=${req.query.name}`);
        }
      }
    } else {
      flashMessage.push("this test is already exist , please enter its ID");
      res.redirect("createtest");
    }
  }
});

router.get("/edittest", async (req, res, next) => {
  let test = await Test.findById(req.query.id);
  let list = await Questions.find({ testName: test.testName });
  res.render("questions", {
    testName: test.testName,
    list,
    id: req.query.id,
    con: !test.secret.is,
  });
});

router.post(
  "/adminadd",
  asyncHandler(async (req, res, next) => {
    const { testName, title, img, isImg, optionA, optionB, optionC, correct } =
      req.body;
    let iamgeCheker = false;
    if (isImg == "on") iamgeCheker = true;
    const def = () => {
      let arr = [];
      let ans = [
        { content: correct, isTrue: true },
        { content: optionA, isTrue: false },
        { content: optionB, isTrue: false },
        { content: optionC, isTrue: false },
      ];
      for (let i = 0; i < 4; null) {
        let random = parseInt((Math.random() * 4).toFixed(), 10);
        if (
          (!arr.includes(ans[random]) && ans[random]) ||
          (i === 0 && ans[random])
        ) {
          arr.push(ans[random]);
          i++;
        }
      }
      return arr;
    };
    const answers = await def();
    const question = {
      testName,
      title,
      img,
      isImg: iamgeCheker,
      answers,
    };
    Questions.create(question)
      .then(async () => {
        let test = await Test.findOne({ testName });
        test.number += 1;
        await Test.updateOne(
          { testName: testName },
          { $set: test },
          { new: true }
        );
        res.redirect(`edittest?id=${test._id}`);
      })
      .catch((err) => {
        console.log(err);
      });
  })
);

router.post(
  "/admindelete",
  asyncHandler(async (req, res, next) => {
    const { id, testName } = req.body;
    Questions.deleteOne({ _id: id })
      .then(async () => {
        let test = await Test.findOne({ testName });
        test.number -= 1;
        await Test.updateOne(
          { testName: testName },
          { $set: test },
          { new: true }
        );
        res.redirect(`edittest?id=${test._id}`);
      })
      .catch((err) => {
        console.log(err);
      });
  })
);

router.post(
  "/post",
  asyncHandler(async (req, res, next) => {
    const calc = async (req) => {
      let score = 0;
      for (let q in req.body) {
        if (q.length === 24) {
          let question = await Questions.findById(q);
          await question.answers.forEach(async (ans) => {
            if (ans.content == req.body[q]) {
              ans.ansd += 1;
              if (ans.isTrue) {
                score++;
              }
              await Questions.findByIdAndUpdate(q, { $set: question });
            }
          });
        }
      }
      return score;
    };
    let test = await Test.findOne({ testName: req.body.testName });
    const user = {
      name: req.body.name,
      score: await calc(req),
    };
    await test.users.push(user);
    await Test.findOneAndUpdate(
      { testName: req.body.testName },
      { $set: test },
      { new: true }
    ).then((r) => {
      res.redirect(`leaderboard/${req.body.testName}/${req.body.name}`);
    });
  })
);

function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j + 1].score > arr[j].score) {
        [arr[j + 1], arr[j]] = [arr[j], arr[j + 1]];
      }
    }
  }
  return arr;
}

router.get(
  "/leaderboard/:testname/:name",
  asyncHandler(async (req, res, next) => {
    const test = await Test.findOne({ testName: req.params.testname });
    const sorted = await bubbleSort(test.users);
    if (test.leaderboard) {
      res.render("leaderboard", {
        users: sorted,
        testName: test.testName,
        number: test.number,
        condition: true,
      });
    } else {
      const index = sorted.findIndex((obj) => {
        return obj.name === req.params.name;
      });
      let per = (
        (100 * (sorted.length - 1 - index)) /
        (sorted.length - 1)
      ).toFixed(2);
      res.render("leaderboard", {
        testName: test.testName,
        number: test.number,
        score: sorted[index].score,
        condition: false,
        per,
      });
    }
  })
);

router.post("/settings", (req, res, next) => {
  Test.findByIdAndUpdate(req.body.id, {
    secret: { is: true, password: req.body.password },
  }).then((r) => {
    console.log(r);
    res.redirect(`edittest?id=${req.body.id}`);
  });
});

router.post("/setleader", async (req, res, next) => {
  if (req.body.stat == "personal")
    await Test.findByIdAndUpdate(req.body.id, { leaderboard: false });
  else if (req.body.stat == "leaderboard")
    await Test.findByIdAndUpdate(req.body.id, { leaderboard: true });
  res.redirect(`edittest?id=${req.body.id}`);
});

router.post("/puplic", (req, res, next) => {
  Test.findByIdAndUpdate(req.body.id, {
    secret: { is: false, password: "" },
  }).then((r) => {
    console.log(r);
    res.redirect(`edittest?id=${req.body.id}`);
  });
});

router.get("/stat/:id", async (req, res, next) => {
  let test = await Test.findById(req.params.id);
  let arr = await Questions.find({ testName: test.testName });
  res.render("stat", {
    test,
    arr,
  });
});

// here my own function to test the code
router.get("/log", async (req, res) => {
  let test = await Test.find();
  let questions = await Questions.find();
  console.log(test);
  console.log(questions);
  await test.forEach(async (r) => {
    await r.users.forEach((rr) => {
      console.log(rr);
    });
  });
  await questions.forEach(async (r) => {
    await r.answers.forEach((rr) => {
      console.log(rr);
    });
  });
});

module.exports = router;
