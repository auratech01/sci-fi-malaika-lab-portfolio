// Regression test for brain.js. Run from the project folder:  node tests/brain_test.js
const vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, 'data.js'), 'utf8'), c);
const D = c.window.PORTFOLIO, Brain = require(path.join(root, 'brain.js'));
const tests = [
 ['hi','greet'],['hello there','greet'],['salam','greet'],['thanks a lot','thanks'],['bye','bye'],['who are you?','aura'],['are you a bot','aura'],['what can you do','help'],['what should i ask','help'],
 ['who is malaika','about'],['tell me about her','about'],['malaika kon hai','about'],['introduce her','about'],['tell me something about her','about'],['what does malaika do','about'],
 ['what are her skills','skills'],['tech stack?','skills'],['which programming languages does she know','skills'],['what languages does malaika code in','skills'],
 ['does she know python','tech:Python'],['is she good at c++','tech:C++'],['does she use javascript','tech:JavaScript'],['any SQL experience?','tech:SQL'],['does she know figma','tech:Figma'],['can she use git','tech:Git'],['does she use vs code','tech:VS Code'],['does she use gemini','tech:Google Gemini API'],
 ['does she know react','tech:unknown'],['has she worked with flutter','tech:unknown'],['does she know java','tech:unknown'],['can she do tensorflow','tech:unknown'],
 ['which project uses canvas','tech:'],['which project uses python','tech:'],
 ['what ai work has she done','ai'],['does she know machine learning','ai'],['what about neural networks','ai'],['ml?','ai'],['is she good at ai','ai'],['does she know artificial intelligence','ai'],
 ['has she made any games','gamedev'],['game development','gamedev'],
 ['what projects has she built','projects'],['show me her work','projects'],['projects','projects'],['how many projects has she done','projects'],
 ['what is her best project','best'],['main project','best'],['most impressive thing she built','best'],
 ['tell me about project sentinel','project:0'],['what is sentinel','project:0'],['security tool?','project:0'],['what is project sentinel about','project:0'],['the hardest part of sentinel','project:0'],
 ['tell me about jade lantern','project:1'],['restaurant website','project:1'],['has she built a restaurant website','project:1'],['birthday experience','project:2'],['the 22 level game','project:2'],['tell me about the birthday game','project:2'],
 ['how does sentinel work','project:0'],['sentinel tech stack','project:0'],['jade lantern live demo','project:1'],['links for birthday experience','project:2'],
 ['what is her cgpa','education'],['which university','education'],['what does she study','education'],['degree?','education'],['education','education'],['semester','education'],['does she have a degree','education'],['what is her gpa','education'],
 ['does she have certificates','certs'],['cisco ccna?','certs'],['does she have any certification','certs'],['what tools does she use','tools'],
 ['where is her resume','resume'],['cv','resume'],['download resume','resume'],['can i download her cv','resume'],
 ['how can i contact her','contact'],['email address','contact'],['her linkedin','contact'],['github link','contact'],['rabta kaise karon','contact'],['what is her email','contact'],["what's her github username",'contact'],['where can i find her code','contact'],['how do i get in touch','contact'],
 ['is she available for internship','availability'],['can i hire her','availability'],['open to work?','availability'],['is she looking for a job','availability'],['naukri','availability'],['freelance?','availability'],['can she work remotely','availability'],['is she hiring','availability'],
 ['i need a website for my business','client'],['can she build an app for me','client'],['how much does she charge','client'],['pricing','client'],
 ['what is her work experience','experience'],['how many years of experience','experience'],['is she a fresher','experience'],
 ['why should we hire her','strengths'],['what makes her stand out','strengths'],
 ['where is she based','location'],['which city','location'],['is she in lahore','location'],
 ['what is her philosophy','philosophy'],['what does she believe in','philosophy'],['salary expectation','salary'],['how much salary','salary'],
 ['how old is she','personal'],['is she married','personal'],['what is the weather','offtopic'],['tell me a joke','offtopic'],['capital of france','offtopic'],
 ['skils','skills'],['projcts','projects'],['educaton','education'],['internhsip','availability'],['sentnel','project:0'],['cgpaa','education'],['contcat','contact'],
 ['asdfgh','unsure'],['blah blah','unsure'],['?','empty'],
 // Roman Urdu
 ['ap ka kya naam h','aura'],['aap kaise ho','smalltalk'],['malaika ki skills kya hain','skills'],['unka cgpa kitna hai','education'],['kya wo internship ke liye available hain','availability'],['projects batao','projects'],['rabta kaise karun','contact'],['assalam o alaikum','greet'],['shukria','thanks'],['mujhe kuch samajh nahi aya','unsure'],['how are you','smalltalk'],
 // opinion / unknown questions must NOT be answered with a confident wrong topic (they go to the AI, or say "not sure")
 ['what do you think about her design taste?','unsure'],['does she like pineapple pizza?','unsure'],['what is her teamwork style like?','unsure'],['is she a good team player','unsure'],
];
let ok = 0; const bad = []; const b = Brain.make(D, {});
for (const [q, exp] of tests) { const r = b.answer(q); if (r.id.startsWith(exp) || (exp === 'tech:' && r.id.startsWith('tech:'))) ok++; else bad.push([q, exp, r.id, r.conf]); }
console.log(`${ok}/${tests.length} correct (${Math.round(100 * ok / tests.length)}%)`);
bad.forEach(x => console.log('  WRONG:', JSON.stringify(x[0]), 'expected', x[1], 'got', x[2], 'score', x[3]));
const b2 = Brain.make(D, {}); b2.answer('tell me about sentinel');
const f1 = b2.answer('and its tech stack?'), f2 = b2.answer('links?'); b2.answer('jade lantern'); const f3 = b2.answer('how does it work');
console.log('follow-ups:', [f1.id, f2.id, f3.id].join(', '), (f1.id === 'project:0:follow' && f2.id === 'project:0:follow' && f3.id === 'project:1:follow') ? 'OK' : 'PROBLEM');
const ur = b.answer('ap ka kya naam h').text, un = b.answer('mujhe kuch samajh nahi aya').text;
const langOk = /Mera naam/.test(ur) && /Mujhe ye sawal/.test(un) && Brain.lang('ap ka kya naam h') === 'roman' && Brain.lang('what is her cgpa') === 'en' && Brain.lang('آپ کا نام') === 'ur';
console.log('answers come back in the visitor\'s language:', langOk ? 'OK' : 'PROBLEM');
process.exit(bad.length || !langOk ? 1 : 0);
