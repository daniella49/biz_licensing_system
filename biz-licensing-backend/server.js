require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const rulesPath = path.join(__dirname, 'data', 'processed_rules.json');

let rawRules = [];
try {
  const rawData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
  rawRules = Array.isArray(rawData.rules_found) ? rawData.rules_found : [];
  if (!rawRules.length) console.warn("Warning: No rules found in processed_rules.json");
} catch (err) {
  console.error("Error parsing processed_rules.json:", err);
  process.exit(1);
}

// Express setup 
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// OpenAI setup 
let openai = null;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (OPENAI_API_KEY) {
  try {
    const { Configuration, OpenAIApi } = require("openai");
    openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));
    console.log("OpenAI initialized");
  } catch (err) {
    console.error("OpenAI init error:", err);
  }
}

// Matching engine 
function matchesCondition(ruleCond = {}, input = {}) {
  if (ruleCond.any_business) return true;
  if ((ruleCond.serves_meat || ruleCond.servesMeat) && !input.serves_meat) return false;
  if ((ruleCond.deliveries_required || ruleCond.deliveries) && !input.deliveries) return false;
  if (ruleCond.max_seats_less_or_equal != null && input.seats > ruleCond.max_seats_less_or_equal) return false;
  if (ruleCond.area_gt != null && input.area <= ruleCond.area_gt) return false;
  if (ruleCond.area_lt != null && input.area >= ruleCond.area_lt) return false;
  return true;
}

// Simplify legal language for fallback
function simplifyObligation(obligation) {
  return obligation
    .replace(/יש ל/gi, "צריך")
    .replace(/החובה /gi, "")
    .replace(/על פי התקנות/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// build report 
function buildReport(input, matchedRules) {
  const lines = [];
  const characteristics = [];
  if (input.serves_meat) characteristics.push("הגשת בשר");
  if (input.deliveries) characteristics.push("משלוחים");

  lines.push("דו\"ח דרישות רישוי לעסק");
  lines.push(
    `שטח: ${input.area || '-'} מ"ר, מספר מושבים: ${input.seats || '-'}${characteristics.length ? ', ' + characteristics.join(', ') : ''}`
  );
  lines.push("");

  // Separate categories
  const categories = {};
  matchedRules.forEach(r => {
    const cat = r.category || "כללי";
    if (!categories[cat]) categories[cat] = [];
    if (r.obligation) categories[cat].push(simplifyObligation(r.obligation));
  });

  for (const [cat, rules] of Object.entries(categories)) {
    lines.push(`${cat}:`);
    rules.forEach((ruleText, idx) => {
      lines.push(`${idx + 1}. ${ruleText}`);
    });
    lines.push(""); 
  }

  return lines.join("\n");
}

// /api/match
app.post('/api/match', (req, res) => {
  try {
    const input = {
      area: Number(req.body.area) || 0,
      seats: Number(req.body.seats) || 0,
      serves_meat: !!req.body.serves_meat,
      deliveries: !!req.body.deliveries,
    };

    const matched = rawRules
      .filter(rule => matchesCondition(rule.conditions, input))
      .sort((a, b) => (a.priority || 99) - (b.priority || 99));

    res.json({ ok: true, input, matched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// /api/generate-report 
app.post('/api/generate-report', async (req, res) => {
  try {
    const input = {
      area: Number(req.body.area) || 0,
      seats: Number(req.body.seats) || 0,
      serves_meat: !!req.body.serves_meat,
      deliveries: !!req.body.deliveries,
    };

    const matchedRules = rawRules.filter(rule => matchesCondition(rule.conditions, input));

    // OpenAI 
    if (openai) {
      try {
        const system = {
          role: "system",
          content: "You are a regulatory assistant for Israeli businesses. Answer in Hebrew, be concise and actionable."
        };

        const user = {
          role: "user",
          content: `Business info:\n${JSON.stringify(input, null, 2)}\n\nMatched rules:\n${JSON.stringify(matchedRules, null, 2)}\n\nOutput a concise actionable Hebrew report in clear language.`
        };

        const completion = await openai.createChatCompletion({
          model: "gpt-4o-mini",
          messages: [system, user],
          max_tokens: 900,
          temperature: 0.2
        });

        const aiText = completion.data.choices[0].message.content;
        return res.json({ ok: true, used: "openai", report: aiText });
      } catch (err) {
        console.error("OpenAI error:", err.message);
      }
    }

    // Fallback
    const report = buildReport(input, matchedRules);
    res.json({ ok: true, used: "fallback", report });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Default route
app.get('/', (req, res) => res.send("Business Licensing API"));

// Start server 
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
