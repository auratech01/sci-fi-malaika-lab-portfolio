# AURA ko asli AI se chalane ka setup (Cloudflare, bilkul shuru se)

**Pehle ye samjho:** ye setup *zaroori nahi* hai. Iske bina bhi AURA chalti hai (built-in jawab). Ye sirf tab karo jab tum chahti ho ke AURA un sawalon ka bhi jawab de jo built-in nahi samajhta.

**Cloudflare kya hai?** Ek free service jahan ek chhota sa program (Worker) chalta hai. Ye program tumhari website aur Google Gemini ke beech mein khada hota hai. **Tumhari API key sirf is program ke andar rehti hai**, GitHub par nahi. Is liye koi website ya repo khol kar key nahi dekh sakta.

Card ki zaroorat nahi, free plan kaafi hai.

---

## Step 1: Gemini API key banao (2 min)
1. https://aistudio.google.com/apikey kholo, apne Google account se login karo.
2. **Create API key** dabao. Ek lambi key (aksar `AIza...` se shuru hoti hai) milegi.
3. Copy karke Notepad mein rakh lo. **Ise kisi ko mat dikhao, GitHub par mat daalo, kisi file mein mat likho.**

## Step 2: Cloudflare account banao (2 min)
1. https://dash.cloudflare.com/sign-up kholo, email aur password do, email verify karo.
2. Agar wo pooche ke kya banana hai / domain add karo, to skip karo. Hamein domain nahi chahiye.

## Step 3: Worker banao (3 min)
1. Left menu mein **Workers & Pages** par click karo (nayi design mein ye **Compute (Workers)** ke andar bhi ho sakta hai).
2. **Create** (ya **Create application**) dabao, phir **Create Worker** / **Hello World** chuno.
3. Naam likho, jaise `aura-chat`. **Deploy** dabao.
4. Deploy hone ke baad **Edit code** dabao. Ek code editor khulega.
5. Editor mein jo bhi pehle se likha hai, **sab select karke delete** kar do (Ctrl+A, Delete).
6. Is project ki **`chatbot-worker.js`** file kholo, **poori file copy** karo aur editor mein **paste** kar do.
7. Upar **Deploy** dabao.

## Step 4: Key ko secret ki tarah daalo (1 min) — sabse zaroori step
1. Apne Worker ke page par **Settings** tab kholo, phir **Variables and Secrets**.
2. **Add** dabao.
3. **Type: Secret** chuno (Text nahi!).
4. **Variable name:** `GEMINI_API_KEY` (bilkul aise, bade letters mein)
5. **Value:** Step 1 wali key paste karo.
6. **Deploy** / **Save** dabao.

## Step 5: Worker ka URL copy karo
Worker ke overview page par ek link hota hai, jaise `https://aura-chat.tumhara-naam.workers.dev`. Ye copy kar lo. (Ye URL chhupana zaroori nahi, key chhupi hai.)

## Step 6: Website ko URL batao
1. `data.js` kholo, ye line dhoondo:
   ```js
   chat: { endpoint: '', mode: 'hybrid' },
   ```
2. Apna URL daalo:
   ```js
   chat: { endpoint: 'https://aura-chat.tumhara-naam.workers.dev', mode: 'hybrid' },
   ```
3. File save karo aur GitHub par push/upload karo (jaise tum portfolio update karti ho).

## Step 7 (recommended): Limits ko pakka karo
Bina iske limits tab bhi chalti hain, lekin Cloudflare kabhi kabhi Worker ko restart karta hai aur counter zero ho jata hai.
1. Cloudflare menu mein **Storage & databases** -> **KV** -> **Create** -> naam `aura-limits`.
2. Apne Worker ki **Settings** -> **Bindings** -> **Add** -> **KV namespace**.
3. **Variable name:** `CHAT_KV`, namespace: `aura-limits`. **Deploy**.

---

## Check kaise karun ke chal raha hai?
- Worker ka URL browser mein kholo. Likha aaye `{"error":"forbidden"}` to **sab theek hai**: Worker zinda hai aur sirf tumhari website ke liye khula hai.
- Apni live website kholo, AURA par click karo. Upar likha hona chahiye **"Fact-checked AI, only from this portfolio"**.
- Koi aisa sawal poochho jo built-in ko pakka na ho, jaise "what is her teamwork style like?". Jawab ke neeche **"AI answer · checked against the portfolio facts"** aana chahiye.

## Agar kuch na chale
| Dikhta hai | Matlab | Kya karo |
|---|---|---|
| Worker URL par `{"error":"forbidden"}` | Normal hai | Kuch nahi |
| Chat mein AI label kabhi nahi aata | URL `data.js` mein nahi / push nahi hua | Step 6 dobara dekho, browser mein Ctrl+F5 |
| Worker URL (POST) par `not configured` | Secret nahi mila | Step 4: naam bilkul `GEMINI_API_KEY`, type **Secret** |
| Worker `forbidden` deta hai apni site se bhi | Tumhari site ka address alag hai | `chatbot-worker.js` mein `ALLOWED_ORIGINS` mein apna sahi address likho (jaise `https://tumhara-naam.github.io`), phir dobara paste + Deploy |
| Hamesha built-in jawab aate hain | Worker error de raha hai (502) | Key sahi hai? `MODEL` ka naam Google ne badal diya ho to Google AI Studio mein naya naam dekho aur `MODEL` mein likho |
| "I'm getting a lot of questions..." | Daily/minute limit lag gayi | Intezar karo, ya `LIMITS` mein number badhao |

AI na chale tab bhi chat **kabhi band nahi hoti**: AURA khud built-in jawab par wapas aa jati hai.

## Baad mein `data.js` badlo to
AI ko purane facts yaad rehte hain. Dobara ye karo:
1. Computer par Node.js ho to: `node tools/make-worker.js` chalao. Ye nayi `chatbot-worker.js` banata hai. (Node nahi hai to mujhe `data.js` bhej do, main nayi file bana dungi.)
2. Cloudflare mein Worker -> **Edit code** -> purana sab delete -> nayi file paste -> **Deploy**. Secret dobara daalne ki zaroorat nahi.

## Zaroori baatein
- **Key kabhi bhi GitHub par chali jaye** (kisi file mein paste ho gayi) to foran aistudio.google.com/apikey se use delete karo aur nayi banao, phir Step 4 mein nayi daalo.
- Free Gemini plan mein Google tumhare visitors ke sawal apni service behtar karne ke liye istemal kar sakta hai. Details Google ki terms mein hain; agar tum nahi chahti to paid plan dekhna.
- Sawal ki limit ab **500 characters** hai. Isay badalna ho to `chatbot-worker.js` mein `maxChars`.
