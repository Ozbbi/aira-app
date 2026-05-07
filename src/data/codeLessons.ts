// Hand-written coding lessons for the "Learn how to code" track.
// 3 languages × 2 levels = 6 lessons. Same SeedLesson shape as the
// AI-fluency curriculum so they flow through the existing LessonScreen
// without any rendering changes.
//
// Voice: same B1-B2 English we use for AI lessons. Examples are tiny
// and runnable. No setup talk — assume the user can paste into a
// browser console (HTML), an online Python REPL, or replit.com (Java).

import type { SeedLesson } from './seedLessons';

export type CodeLanguage = 'python' | 'java' | 'html';
export type CodeLevel = 'beginner' | 'intermediate';

export interface CodeLesson extends SeedLesson {
  language: CodeLanguage;
  level: CodeLevel;
}

export const CODE_LESSONS: CodeLesson[] = [
  // ===========================================================
  //  PYTHON — beginner
  // ===========================================================
  {
    id: 'code_python_beginner_1',
    trackId: 'create',
    language: 'python',
    level: 'beginner',
    title: 'Python — your first line of real code',
    character: 'Maya',
    airaIntro:
      "We start where every Python coder ever started: print. One word, one line, you're a programmer.",
    learnFirst:
      "`print()` shows text on the screen. Anything inside the parentheses with quotes around it gets shown. That's it for now.",
    realWorldScenario:
      "Maya is following an online tutorial. The very first line is `print(\"Hello, world!\")`. She runs it. Words appear. She is officially writing Python.",
    scenes: [
      {
        heading: 'The simplest possible program',
        vague: 'Just type code and hope.',
        specific: 'Write: `print("Hello!")` — exactly. Quotes around the words. Parentheses around the quotes.',
        note: 'Python is picky about brackets and quotes. Match them and it works.',
      },
      {
        heading: 'Variables — give a name to a value',
        vague: '`print("Hello, friend.")` over and over.',
        specific: '`name = "Maya"` then `print("Hello, " + name)`. Now the name is reusable.',
        note: 'Variables are nicknames for values. Reusing them keeps your code clean.',
      },
      {
        heading: 'Strings vs. numbers',
        vague: '`age = "12"` (a string). Trying to add 1 fails.',
        specific: '`age = 12` (a number). Now `age + 1` works and gives 13.',
        note: 'Quotes mean "treat this as text." No quotes means "treat this as a number."',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which line correctly prints the word **Hello** in Python?',
        options: [
          'print Hello',
          'print("Hello")',
          'PRINT("Hello")',
          'echo "Hello"',
        ],
        correctAnswer: 1,
        explanation: 'Lowercase `print`, parentheses, then the text in quotes. Anything else is a different language or a typo.',
        airaFeedback: {
          correct: 'Yes — lowercase print, parens, quotes. The Python recipe.',
          incorrect: 'Look for the line with lowercase `print`, parentheses, and quotes around the text.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'In Python, `age = 12` and `age = "12"` mean the same thing.',
        correctAnswer: false,
        explanation: 'Quotes mean text. No quotes means a number. `"12" + 1` errors; `12 + 1` is `13`.',
        airaFeedback: {
          correct: 'Right. Quotes change the type completely.',
          incorrect: 'They look similar but are different types. Quotes = string (text). No quotes = integer (number).',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Fill in: a variable is a ____ for a value.',
        correctAnswer: 'name',
        explanation: 'A variable is a name (or label, or nickname) attached to a value. The value lives in memory; the name is how you reach it.',
        airaFeedback: {
          correct: 'Yes. Just a name pointing at a value.',
          incorrect: 'Hint: a 4-letter word for a label or identifier you give something.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'You have `name = "Maya"`. Which prints `Hello, Maya`?',
        options: [
          'print(Hello, Maya)',
          'print("Hello, " + name)',
          'print("Hello, name")',
          'print(Hello + name)',
        ],
        correctAnswer: 1,
        explanation: 'Concatenate (join) the literal `"Hello, "` with the variable `name` using `+`. Quotes only around the literal part.',
        airaFeedback: {
          correct: 'Yes. Quotes go around the literal text only — never the variable.',
          incorrect: 'Hint: only the literal text needs quotes. The variable `name` doesn\'t.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write 2 lines of Python: assign your name to a variable, then print "Hi, [your name]".',
        correctAnswer:
          'name = "Maya"\nprint("Hi, " + name)',
        explanation:
          'Anything that creates a variable on line 1 and prints with concatenation on line 2 is correct. Spaces around the comma are optional.',
        airaFeedback: {
          correct: 'You wrote real Python. Run it. Watch your name appear.',
          incorrect: 'Aim for: line 1 makes a variable, line 2 prints with `+` joining the literal and the variable.',
        },
      },
    ],
    airaOutro:
      "That's the foundation. `print`, variables, types. Every Python program builds on these three.",
    takeaway: 'Print, name, type.',
  },

  // ===========================================================
  //  PYTHON — intermediate
  // ===========================================================
  {
    id: 'code_python_intermediate_1',
    trackId: 'create',
    language: 'python',
    level: 'intermediate',
    title: 'Python — functions: bottle up logic so you can reuse it',
    character: 'Lin',
    airaIntro:
      "Once you've copy-pasted the same code three times, it's time to make it a function. Today: how, why, and the one trap most beginners hit.",
    learnFirst:
      'A function is a named block of code you can run again and again. You define it with `def`, name it, give it inputs (parameters), and the body does the work. Inputs are caller-supplied; the body uses them.',
    realWorldScenario:
      'Lin keeps writing the same 3-line "print a greeting for X" code. Six greetings, eighteen lines. She wraps it in a function. Six greetings, six lines.',
    scenes: [
      {
        heading: 'Defining vs. calling',
        vague: 'Define it once but never call it: `def greet(name): print("Hi, " + name)`',
        specific: 'Add `greet("Lin")` BELOW the definition. That\'s the call. The call is what runs.',
        note: '`def` builds the function. `greet("Lin")` runs it. Both are needed.',
      },
      {
        heading: 'Return — sending a value back',
        vague: '`def add(a, b): print(a + b)` — only prints, can\'t reuse the result.',
        specific: '`def add(a, b): return a + b`, then `total = add(2, 3)` — now `total` is `5` and you can use it elsewhere.',
        note: '`print` shows. `return` hands a value back to the caller.',
      },
      {
        heading: 'The classic trap',
        vague: '`def add(a, b): a + b` — no return, function gives back `None`.',
        specific: 'Always `return` if you want a value. Forgetting `return` is the most common Python beginner bug.',
        note: 'No `return` = no value. The function still ran, but you got nothing back.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which keyword DEFINES a function in Python?',
        options: ['function', 'def', 'fn', 'lambda'],
        correctAnswer: 1,
        explanation: '`def` is the Python keyword for defining a function. (`lambda` makes anonymous one-liners but isn\'t the standard way.)',
        airaFeedback: {
          correct: 'Yes. Three letters. `def`.',
          incorrect: 'Python uses 3 letters: d-e-f. Other languages use `function` or `fn`, but Python\'s is `def`.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'A function with no `return` statement gives back `None`.',
        correctAnswer: true,
        explanation: 'In Python, every function returns something — if you don\'t say what, it\'s `None`.',
        airaFeedback: {
          correct: 'Right. Forgetting `return` is the #1 beginner Python bug.',
          incorrect: 'It does — that\'s why "I called the function but got nothing" is the most common Python beginner bug.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Fill in the keyword: `def add(a, b): ____ a + b`',
        correctAnswer: 'return',
        explanation: '`return` hands the value back to whoever called the function.',
        airaFeedback: {
          correct: 'Yes. Without it the caller gets nothing.',
          incorrect: 'Hint: 6 letters. The keyword that hands a value back.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Lin writes: `def greet(name): return "Hi, " + name`. Which line CALLS this function for "Lin"?',
        options: [
          'greet name "Lin"',
          'greet("Lin")',
          'def greet("Lin")',
          'call greet("Lin")',
        ],
        correctAnswer: 1,
        explanation: 'Calling a function = name + parentheses with the arguments inside. That\'s it.',
        airaFeedback: {
          correct: 'Yes. Function name + parens with the value.',
          incorrect: 'Calling = `name(args)`. No `def`, no `call` keyword. Just name and parens.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write a Python function `square` that takes a number and returns its square. Show one call.',
        correctAnswer:
          'def square(n):\n    return n * n\n\nresult = square(5)',
        explanation:
          'Anything with `def`, a parameter, `return`, and one call to the function is correct. Indentation matters in Python.',
        airaFeedback: {
          correct: 'Clean. Define, return, call. Three muscles.',
          incorrect: 'Aim for: `def square(n):` on line 1, `return n * n` indented, then a separate line that calls `square(...)`.',
        },
      },
    ],
    airaOutro: "Functions are how you stop repeating yourself. Every real Python program is a tower of small functions.",
    takeaway: 'Define. Return. Call.',
  },

  // ===========================================================
  //  JAVA — beginner
  // ===========================================================
  {
    id: 'code_java_beginner_1',
    trackId: 'create',
    language: 'java',
    level: 'beginner',
    title: 'Java — the famous Hello World, line by line',
    character: 'Sam',
    airaIntro:
      "Java looks scarier than Python at first. More words. More braces. Today we read the famous Hello World line by line so it stops looking like a wall.",
    learnFirst:
      'Java needs every program to live inside a class. The entry point is `public static void main(String[] args)`. Inside that, `System.out.println("Hello!");` prints text. The semicolons are required.',
    realWorldScenario:
      'Sam joins a coding club. The first task is a Hello World in Java. The instructor pastes 5 lines of code. Sam panics. After this lesson, none of those 5 lines look strange anymore.',
    scenes: [
      {
        heading: 'The class wrapper',
        vague: 'Just write code at the top, like Python.',
        specific: 'Java needs: `public class Hello { ... your code here ... }`. Everything lives inside a class.',
        note: 'A class is a container. Java refuses to run code that isn\'t inside one.',
      },
      {
        heading: 'main is the entry point',
        vague: 'Java picks any function to start.',
        specific: 'Java looks for exactly `public static void main(String[] args)`. That\'s the line that runs first.',
        note: 'Misspell main and the program won\'t start. The signature is fixed.',
      },
      {
        heading: 'Printing — and the semicolon',
        vague: '`System.out.println("Hello!")` — missing semicolon, won\'t compile.',
        specific: '`System.out.println("Hello!");` — semicolon at the end of the statement.',
        note: 'Semicolons end statements in Java. Forget one and the compiler refuses.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which line prints "Hello!" in Java?',
        options: [
          'print("Hello!")',
          'console.log("Hello!");',
          'System.out.println("Hello!");',
          'echo "Hello!"',
        ],
        correctAnswer: 2,
        explanation: '`System.out.println(...)` is the Java printer. The other options are Python (`print`), JavaScript (`console.log`), and Bash (`echo`).',
        airaFeedback: {
          correct: 'Yes. `System.out.println` is the Java printer.',
          incorrect: 'Java\'s printer is wordier than Python\'s. Look for `System.out.println(...)` with a semicolon.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Every line in Java must end with a semicolon.',
        correctAnswer: false,
        explanation: 'Every STATEMENT ends with `;`. Class and method headers don\'t — they end with `{`. Comments don\'t either.',
        airaFeedback: {
          correct: 'Right. Statements yes, headers no.',
          incorrect: 'Slightly off — every statement does, but headers like `public class X {` don\'t (they end with `{`).',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Java looks for the method named ____ as the entry point.',
        correctAnswer: 'main',
        explanation: '`main` is the fixed name. Java starts running from there.',
        airaFeedback: {
          correct: 'Yes. Always `main`.',
          incorrect: 'Hint: 4 letters. Same word as "primary" or "entry point."',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Where must your code live in Java?',
        options: [
          'Anywhere in the file.',
          'Inside a class.',
          'Inside a function called `start`.',
          'Java has no rules about this.',
        ],
        correctAnswer: 1,
        explanation: 'Java requires every line of code to be inside a class. That\'s the rule that makes Java verbose vs. Python.',
        airaFeedback: {
          correct: 'Yes. Class first. Then method. Then code.',
          incorrect: 'Java is strict — code must live inside a class. That\'s why every Java file starts with `public class ... {`.',
        },
      },
      {
        id: 'q5',
        type: 'ordering',
        question: 'Order the parts of a minimal Java program top to bottom:',
        options: [
          'public class Hello {',
          '    public static void main(String[] args) {',
          '        System.out.println("Hello!");',
          '    }',
          '}',
        ],
        correctAnswer: [
          'public class Hello {',
          '    public static void main(String[] args) {',
          '        System.out.println("Hello!");',
          '    }',
          '}',
        ],
        explanation: 'Class header → main method header → the print → close main → close class. Outside-in.',
        airaFeedback: {
          correct: 'Yes. Class wraps main wraps the code. Outside-in.',
          incorrect: 'Outside-in: class first, then main inside it, then the print inside main, then close braces in reverse.',
        },
      },
    ],
    airaOutro: "Now Hello World in Java is just words you understand. The five lines aren’t scary anymore.",
    takeaway: 'Class. Main. Statement. Semicolon.',
  },

  // ===========================================================
  //  JAVA — intermediate
  // ===========================================================
  {
    id: 'code_java_intermediate_1',
    trackId: 'create',
    language: 'java',
    level: 'intermediate',
    title: 'Java — classes are nouns, methods are verbs',
    character: 'Jordan',
    airaIntro:
      "If you only remember one thing about object-oriented design today: classes are nouns, methods are verbs. The whole language clicks once you see this.",
    learnFirst:
      'A class is a blueprint for a thing — a Dog, a Car, a User. Its fields are the thing\'s properties. Its methods are what the thing can do. To use it, you create an instance with `new` and then call methods on it.',
    realWorldScenario:
      'Jordan models a coffee shop\'s point-of-sale. Drink, Customer, Order — three nouns. Drink.brew(), Customer.pay(), Order.print() — three verbs. The whole system falls out cleanly.',
    scenes: [
      {
        heading: 'Fields = the noun\'s properties',
        vague: 'Stuff some variables in a class.',
        specific: 'A `Dog` class has `String name; int age;`. Those are facts about a dog.',
        note: 'Pick fields that describe the thing. Skip anything that doesn\'t.',
      },
      {
        heading: 'Methods = the noun\'s verbs',
        vague: 'A `Dog` with no actions is just data.',
        specific: '`void bark()` and `void wagTail()` are things a dog does. Now the class is alive.',
        note: 'Verbs make a class useful. Without methods, it\'s just a struct.',
      },
      {
        heading: 'Using the class',
        vague: 'Try to call `bark()` directly on the class.',
        specific: '`Dog rex = new Dog(); rex.bark();` — make an instance first, then call its methods.',
        note: '`new` builds an instance. The instance owns the methods you can call.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'In Java\'s object-oriented model, what\'s a CLASS?',
        options: [
          'A function.',
          'A blueprint for a thing (a noun).',
          'A loop that runs many times.',
          'A type of error.',
        ],
        correctAnswer: 1,
        explanation: 'A class is the blueprint. Instances are real things made from the blueprint.',
        airaFeedback: {
          correct: 'Yes. Class = blueprint. Instance = the thing.',
          incorrect: 'Class is the blueprint — like an architectural plan. Instances are the real buildings made from it.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'You can call a method directly on a class without creating an instance.',
        correctAnswer: false,
        explanation: 'Generally no — you need `new` to make an instance, then call methods on it. Exception: `static` methods, but that\'s a later topic.',
        airaFeedback: {
          correct: 'Right (for instance methods). You build first, then call.',
          incorrect: 'For instance methods you have to make an instance with `new` first. Static methods are an exception, but that\'s for a later lesson.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Methods are the ____ a class can do.',
        correctAnswer: 'verbs',
        explanation: 'Methods are verbs. Fields are nouns / properties. Classes are the noun itself.',
        airaFeedback: {
          correct: 'Yes. Verbs.',
          incorrect: 'Hint: actions, things you do. Singular: verb.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which line creates a new Dog and makes it bark?',
        options: [
          'Dog.bark();',
          'new Dog().bark();',
          'bark(Dog);',
          'Dog rex = bark();',
        ],
        correctAnswer: 1,
        explanation: '`new Dog()` creates an instance. `.bark()` calls the method on it. You can chain them on one line.',
        airaFeedback: {
          correct: 'Yes. `new` makes the dog, dot calls the verb.',
          incorrect: '`new Dog()` builds it. The dot then calls the method on the new instance. That\'s the move.',
        },
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'You\'re modelling a coffee shop. Which is the BEST split into class/method?',
        options: [
          'A class called `BrewCoffee`.',
          'A class called `Drink` with a method `brew()`.',
          'A class called `Coffee` with a class inside it called `Brew`.',
          'A method called `Drink` with parameters.',
        ],
        correctAnswer: 1,
        explanation: 'Drink is a noun (a thing) — it deserves a class. Brew is a verb (an action it does) — it\'s a method on the class.',
        airaFeedback: {
          correct: 'Yes. Noun → class. Verb → method.',
          incorrect: 'Apply the rule: noun → class (Drink), verb → method (brew). The cleanest split is Drink with a brew() method.',
        },
      },
    ],
    airaOutro: "Once you split your problem into nouns and verbs, OOP stops feeling like ceremony. Drink. Brew. Customer. Pay. The system writes itself.",
    takeaway: 'Nouns are classes. Verbs are methods.',
  },

  // ===========================================================
  //  HTML — beginner
  // ===========================================================
  {
    id: 'code_html_beginner_1',
    trackId: 'create',
    language: 'html',
    level: 'beginner',
    title: 'HTML — what tags really are',
    character: 'Maya',
    airaIntro:
      "HTML looks scary because of the angle brackets. It is not. Tags are just labels saying 'this part is a heading' or 'this part is a paragraph'.",
    learnFirst:
      'HTML uses tags to label parts of a page. Tags come in pairs: an opening `<p>` and a closing `</p>` with content in between. The tag name tells the browser what to render.',
    realWorldScenario:
      'Maya wants to make her first webpage about her dog. One title, one paragraph, one image. Three tags. That\'s the whole page.',
    scenes: [
      {
        heading: 'Headings',
        vague: '<bigtext>About my dog</bigtext> — `bigtext` is not a real tag.',
        specific: '`<h1>About my dog</h1>` — `h1` is a real heading tag. There\'s `<h1>` through `<h6>`.',
        note: 'h1 is the biggest. h6 is the smallest. Use real tag names.',
      },
      {
        heading: 'Paragraphs',
        vague: 'Just write text without tags.',
        specific: '`<p>He is the best dog ever.</p>` — wraps a paragraph. Browsers add space around it automatically.',
        note: 'Wrap each paragraph in `<p>`. Browsers know what to do with it.',
      },
      {
        heading: 'Self-closing tags',
        vague: '`<img>` followed by `</img>` — wrong, images don\'t close.',
        specific: '`<img src="dog.jpg" alt="My dog">` — image tags self-close. No content between them.',
        note: 'Some tags hold content (need closing). Some don\'t (self-closing). `img`, `br`, `hr`, `input` are self-closing.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which tag is the LARGEST heading?',
        options: ['<h6>', '<heading>', '<h1>', '<big>'],
        correctAnswer: 2,
        explanation: 'Headings go from `<h1>` (biggest, most important) down to `<h6>` (smallest). `<heading>` and `<big>` are not real HTML tags.',
        airaFeedback: {
          correct: 'Yes. h1 = biggest. h6 = smallest.',
          incorrect: 'HTML headings are h1 through h6. h1 is the biggest, h6 the smallest.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Every HTML tag must have a closing tag like `</p>`.',
        correctAnswer: false,
        explanation: 'Most do, but self-closing tags like `<img>`, `<br>`, `<hr>`, and `<input>` don\'t — they have no content to wrap.',
        airaFeedback: {
          correct: 'Right. Self-closing tags exist.',
          incorrect: 'Most do, but some — `<img>`, `<br>`, `<hr>`, `<input>` — are self-closing. They wrap no content.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'Wrap a paragraph in the ____ tag.',
        correctAnswer: 'p',
        explanation: '`<p>` is for paragraphs. One letter — short for paragraph.',
        airaFeedback: {
          correct: 'Yes. p for paragraph.',
          incorrect: 'Hint: it\'s a single letter. Short for paragraph.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which is a valid `<img>` tag?',
        options: [
          '<img>dog.jpg</img>',
          '<img src="dog.jpg" alt="My dog">',
          '<image>dog.jpg</image>',
          '<picture src="dog.jpg" />',
        ],
        correctAnswer: 1,
        explanation: '`<img>` self-closes and uses `src` for the image path. `alt` is the description for accessibility / when the image fails to load.',
        airaFeedback: {
          correct: 'Yes. `<img src="..." alt="...">`. Self-closing.',
          incorrect: 'Image tags self-close. The path goes in `src`. The description in `alt`. No closing `</img>`.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write 3 lines of HTML: a heading "My Dog", a paragraph saying he is great, and an image (any src).',
        correctAnswer:
          '<h1>My Dog</h1>\n<p>He is the best dog ever.</p>\n<img src="dog.jpg" alt="My dog">',
        explanation: 'Anything with a heading tag, a paragraph tag, and a self-closing img tag with src is correct. The order doesn\'t strictly matter.',
        airaFeedback: {
          correct: 'You wrote a real HTML page. Save it as `index.html` and open it in a browser.',
          incorrect: 'Aim for: one heading tag (h1), one paragraph tag (p with closing), one self-closing img tag with a src attribute.',
        },
      },
    ],
    airaOutro: "Tags are labels. h1 is a heading label. p is a paragraph label. img is an image label. That’s HTML.",
    takeaway: 'Tags are labels.',
  },

  // ===========================================================
  //  HTML — intermediate
  // ===========================================================
  {
    id: 'code_html_intermediate_1',
    trackId: 'create',
    language: 'html',
    level: 'intermediate',
    title: 'HTML — semantic tags + a real form',
    character: 'Deniz',
    airaIntro:
      "There's a difference between HTML that works and HTML that's good. Today: semantic tags + how to make a real form people can fill in.",
    learnFirst:
      'Semantic tags describe what content IS, not just how it looks. Use `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>` instead of `<div>` for everything. Forms use `<form>`, `<label>`, `<input>`, and `<button>`.',
    realWorldScenario:
      'Deniz is building a sign-up page. Email field, password field, submit button. The form has to actually be ACCESSIBLE — screen readers must understand it.',
    scenes: [
      {
        heading: 'Divs vs. semantic tags',
        vague: '`<div class="header"><div class="nav">...</div></div>` — works visually, but tells the browser nothing.',
        specific: '`<header><nav>...</nav></header>` — same layout, tells browsers and assistive tech what each part IS.',
        note: 'Same look. Better meaning. Better SEO. Better accessibility. Same effort.',
      },
      {
        heading: 'Form basics',
        vague: 'Just put inputs on the page.',
        specific: 'Wrap them in `<form>`. Each input gets a `<label>`. The submit is a `<button type="submit">`.',
        note: 'A form without `<form>` won\'t submit. A label without `<label for="...">` confuses screen readers.',
      },
      {
        heading: 'Connecting label to input',
        vague: '`<label>Email</label> <input>` — label and input float free.',
        specific: '`<label for="email">Email</label> <input id="email" type="email">` — `for` connects to `id`.',
        note: 'Now clicking the label focuses the input. And screen readers announce them together.',
      },
    ],
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which tag is the SEMANTIC equivalent of `<div class="navigation">`?',
        options: ['<menu>', '<nav>', '<navigation>', '<links>'],
        correctAnswer: 1,
        explanation: '`<nav>` is the dedicated semantic tag for navigation links.',
        airaFeedback: {
          correct: 'Yes. `<nav>`. Three letters, real meaning.',
          incorrect: 'HTML5 has a dedicated tag. 3 letters. Short for navigation.',
        },
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'A label tag without `for="..."` is just decorative — clicking it does nothing for accessibility.',
        correctAnswer: true,
        explanation: 'The `for` attribute connects the label to an input via the input\'s `id`. Without it, the connection is broken — clicking the label won\'t focus the input, and screen readers can\'t pair them.',
        airaFeedback: {
          correct: 'Right. `for` is the connection. Without it, the label is just text.',
          incorrect: 'It really is — the `for="..."` attribute is what makes the label useful for clicking and for screen readers.',
        },
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'In a form, the label\'s `for` attribute matches the input\'s ____ attribute.',
        correctAnswer: 'id',
        explanation: 'Label `for="email"` ↔ input `id="email"`. They must match exactly.',
        airaFeedback: {
          correct: 'Yes. `for` ↔ `id`. The bridge between them.',
          incorrect: 'Hint: 2 letters. The unique identifier on the input.',
        },
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'Which input type gives users a touch-friendly email keyboard on mobile?',
        options: [
          '<input type="text">',
          '<input type="email">',
          '<input type="string">',
          '<input type="@">',
        ],
        correctAnswer: 1,
        explanation: '`type="email"` triggers the email keyboard with `@` and `.com`. It also adds basic email validation for free.',
        airaFeedback: {
          correct: 'Yes. `type="email"` is the right one — keyboard + validation, free.',
          incorrect: 'There\'s a specific type for emails. It triggers the email keyboard on mobile and validates the format.',
        },
      },
      {
        id: 'q5',
        type: 'prompt_write',
        question: 'Write a minimal HTML5 form with one labelled email input and a submit button.',
        correctAnswer:
          '<form>\n  <label for="email">Email</label>\n  <input id="email" type="email">\n  <button type="submit">Sign up</button>\n</form>',
        explanation:
          'Anything wrapped in `<form>`, with a `<label for="...">` connected to an `<input id="..." type="email">`, and a `<button type="submit">` is correct.',
        airaFeedback: {
          correct: 'Real, accessible HTML. Ship it.',
          incorrect: 'Aim for: `<form>` wrapping a `<label for="x">`, an `<input id="x" type="email">`, and a `<button type="submit">`.',
        },
      },
    ],
    airaOutro: "Semantic HTML is HTML that means something. Browsers, search engines, and screen readers all reward you for it. Same effort as div soup.",
    takeaway: 'Meaning is free. Use it.',
  },
];
