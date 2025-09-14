const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Load processed rules JSON
const rulesPath = path.join(__dirname, "../data/processed_rules.json");
let rulesData = { rules_found: [] };
if (fs.existsSync(rulesPath)) {
  rulesData = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
}

router.post("/generate", (req, res) => {
  const { area, seats, serves_meat, deliveries } = req.body;

  // Filter rules based on selected characteristics
  const filteredRules = rulesData.rules_found.filter(rule => {
    if (rule.conditions.serves_meat && !serves_meat) return false;
    if (rule.conditions.deliveries && !deliveries) return false;
    return true;
  });

  // Build report
  const report = {
    header: `דו"ח דרישות רישוי לעסק\nשטח: ${area} מ"ר, מספר מושבים: ${seats}`,
    categories: {}
  };

  filteredRules.forEach(rule => {
    if (!report.categories[rule.category]) report.categories[rule.category] = [];
    report.categories[rule.category].push(rule.obligation);
  });

  res.json(report);
});

module.exports = router;
