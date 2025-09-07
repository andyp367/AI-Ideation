const promptInput = document.getElementById("prompt");
const generateBtn = document.getElementById("generate");
const outputDiv = document.getElementById("output");
const budgetSlider = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
const timeframeSlider = document.getElementById("timeframe-slider");
const timeframeDisplay = document.getElementById("timeframe-display");
const techGroup = document.getElementById("technologies");
const industryGroup = document.getElementById("industries");
const complexityGroup = document.getElementById("complexity");
const innovationSelect = document.getElementById("innovation");
const demoSelect = document.getElementById("demo");
const apiKeyInput = document.getElementById("api-key");

const DEFAULT_MODEL = "models/gemini-2.5-flash";

noUiSlider.create(budgetSlider, { start: [100, 1000], connect: true, range: { min: 0, max: 10000 }, step: 50, tooltips: false });
noUiSlider.create(timeframeSlider, { start: [6], connect: [true, false], range: { min: 1, max: 24 }, step: 1, tooltips: false });

budgetSlider.noUiSlider.on("update", () => {
  const v = budgetSlider.noUiSlider.get(true);
  budgetDisplay.textContent = `Range: $${Math.round(v[0])} – $${Math.round(v[1])}`;
});
timeframeSlider.noUiSlider.on("update", () => {
  const v = timeframeSlider.noUiSlider.get();
  timeframeDisplay.textContent = `${Math.round(v[0])} months`;
});

function getBudgetRange() { const v = budgetSlider.noUiSlider.get(true); return [Math.round(v[0]), Math.round(v[1])]; }
function getTimeframe() { return Math.round(timeframeSlider.noUiSlider.get()); }
function getSelected(group) { const cb = group?.querySelectorAll("input[type=checkbox]:checked") || []; return Array.from(cb).map(c => c.value); }
function getSelectedRadio(group) { const sel = group.querySelector("input[type=radio]:checked"); return sel ? sel.value : "N/A"; }

function setOutput(msg) { outputDiv.innerHTML = msg; }

function dashListFormat(text) {
  if (!text) return "N/A";
  return text.split(/\n|•|-|–/).map(l => l.trim()).filter(l => l).map(l => `- ${l}`).join("<br>");
}

function formatSection(title, content) {
  return `
  <div class="section-title">${title} <span class="expand-icon">&#9654;</span></div>
  <div class="section-content">${dashListFormat(content)}</div>`;
}

function formatOutput(ideas) {
  return ideas.map((idea, idx) => `<div class="idea-card">
    <h2>Project ${idx + 1}: ${idea.name || "Unnamed Project"}</h2>
    ${formatSection("General Description", idea.description)}
    ${formatSection("Required Technologies & Budget", idea.tech_budget)}
    ${formatSection("Timeframe Breakdown", idea.timeframe)}
    ${formatSection("Complexity & Skills", idea.complexity)}
    ${formatSection("Similar Products", idea.similar)}
    ${formatSection("Novel Elements", idea.novel)}
  </div>`).join("");
}

async function generateIdeas() {
  const prompt = promptInput.value.trim();
  const key = apiKeyInput.value.trim();
  if (!prompt) { setOutput("⚠️ Please enter a prompt"); return; }
  if (!key) { setOutput("⚠️ Please enter an API Key"); return; }

  const [budgetMin, budgetMax] = getBudgetRange();
  const timeframe = getTimeframe();
  const techs = getSelected(techGroup);
  const industries = getSelected(industryGroup);
  const complexity = getSelectedRadio(complexityGroup);
  const innovation = innovationSelect.value;
  const demo = demoSelect.value;

  setOutput("⏳ Generating ideas...");

  const enhancedPrompt = `User idea/constraints: ${prompt}
Budget range: $${budgetMin} – $${budgetMax}
Timeframe (months): ${timeframe}
Preferred technologies: ${techs.join(", ") || "N/A"}
Industry focus: ${industries.join(", ") || "N/A"}
Complexity level: ${complexity}
Innovation level: ${innovation}
Demo space: ${demo}
Generate up to 3 computer engineering project ideas. For each, provide:
- Name
- General Description
- Required Technologies & Budget Breakdown
- Timeframe Breakdown (research, dev, hardware, prototype)
- Complexity & Skills Needed
- Similar Products
- Novel Elements`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${DEFAULT_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ contents: [{ parts: [{ text: enhancedPrompt }] }], generationConfig: { temperature: 0.7 } })
    });

    const data = await res.json();
    if (data.error) { setOutput(`❌ API Error: ${data.error.message}`); return; }

    const text = data?.candidates?.[0]?.content?.map(p => p.text || "").join("").trim();
    if (!text) { setOutput("⚠️ No response from Gemini."); return; }

    const projects = text.split(/Project Idea\s*\d+/i).filter(s => s.trim()).slice(0, 3).map(p => {
      const lines = p.split("\n").filter(l => l.trim());
      const extract = (title) => { const idx = lines.findIndex(l => l.toLowerCase().includes(title.toLowerCase())); return idx >= 0 ? lines[idx + 1] || "N/A" : "N/A"; }
      return {
        name: extract("Name"),
        description: extract("General Description"),
        tech_budget: extract("Required Technologies") + "\n" + extract("Budget Breakdown"),
        timeframe: extract("Timeframe Breakdown"),
        complexity: extract("Complexity") + " | " + innovation,
        similar: extract("Similar Products"),
        novel: extract("Novel Elements")
      }
    });

    setOutput(formatOutput(projects));

    document.querySelectorAll(".section-title").forEach(title => {
      const icon = title.querySelector(".expand-icon");
      const content = title.nextElementSibling;
      title.addEventListener("click", () => {
        content.style.display = content.style.display === "block" ? "none" : "block";
        icon.classList.toggle("open");
      })
    });

  } catch (e) { setOutput("❌ Network or fetch error."); }
}

generateBtn.addEventListener("click", generateIdeas);
