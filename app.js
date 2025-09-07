// ==== Element handles ====
const apiKeyInput    = document.getElementById("api-key");
const promptInput    = document.getElementById("prompt");
const generateBtn    = document.getElementById("generate");
const outputDiv      = document.getElementById("output");
const budgetSlider   = document.getElementById("budget-slider");
const budgetDisplay  = document.getElementById("budget-display");
const timeframeSlider= document.getElementById("timeframe-slider");
const timeframeDisplay = document.getElementById("timeframe-display");
const techGroup      = document.getElementById("technologies");
const industryGroup  = document.getElementById("industries");
const complexityGroup= document.getElementById("complexity");
const innovationSelect = document.getElementById("innovation");
const demoSelect     = document.getElementById("demo");
const extraButtons   = document.getElementById("extra-buttons");
const expandBtn      = document.getElementById("expand");
const similarBtn     = document.getElementById("similar");
const summarizeBtn   = document.getElementById("summarize");

const DEFAULT_MODEL = "models/gemini-2.5-flash";

// ==== Budget slider ====
noUiSlider.create(budgetSlider, {
  start: [100, 1000],
  connect: true,
  range: { min: 0, max: 10000 },
  step: 50,
  tooltips: true,
  format: { to: v => `$${Math.round(v)}`, from: v => Number(v.replace("$","")) }
});
budgetSlider.noUiSlider.on("update", () => {
  const values = budgetSlider.noUiSlider.get(true);
  budgetDisplay.textContent = `Range: $${Math.round(values[0])} – $${Math.round(values[1])}`;
});

// ==== Timeframe slider ====
noUiSlider.create(timeframeSlider, {
  start: [6, 12],
  connect: true,
  range: { min: 1, max: 24 },
  step: 1,
  tooltips: true,
  format: { to: v => `${Math.round(v)} mo`, from: v => Number(v.replace(" mo","")) }
});
timeframeSlider.noUiSlider.on("update", () => {
  const values = timeframeSlider.noUiSlider.get(true);
  timeframeDisplay.textContent = `${Math.round(values[0])} – ${Math.round(values[1])} months`;
});

// ==== Helpers ====
function setOutput(msg, asHTML = false) {
  outputDiv.innerHTML = asHTML ? msg : `<p>${msg}</p>`;
}
function ensureResourceName(name) {
  return name?.startsWith("models/") ? name : `models/${name}`;
}
function getSelected(group) {
  if (!group) return [];
  if (group.tagName === "DIV" && group.querySelectorAll("input[type=checkbox]")) {
    return Array.from(group.querySelectorAll("input[type=checkbox]:checked")).map(cb => cb.value);
  }
  if (group.tagName === "DIV" && group.querySelectorAll("input[type=radio]")) {
    const sel = group.querySelector("input[type=radio]:checked");
    return sel ? [sel.value] : [];
  }
  return [];
}
function formatOutput(text) {
  let cleaned = text.replace(/\|/g, " ").replace(/---+/g, "")
    .replace(/<\/?table.*?>/gi,"").replace(/<\/?tr.*?>/gi,"").replace(/<\/?td.*?>/gi,"")
    .replace(/\*\*/g,"").replace(/\*/g,"").replace(/###/g,"").replace(/##/g,"").trim();
  const ideas = cleaned.split(/Project Idea\s*\d+/i).filter(s => s.trim());
  return ideas.map((idea, idx) => {
    let formatted = idea.replace(/(General Description|Required Technologies|Budget Breakdown|Timeframe Breakdown|Complexity|Innovation|Demo Considerations|Similar Products|Novel Elements)/gi,
      m => `<h3 class="section-title">${m}</h3>`);
    formatted = formatted.replace(/(?:^|\n)[-•]\s*(.+)/g,"<li>$1</li>");
    if (formatted.includes("<li>")) formatted = `<ul>${formatted}</ul>`;
    formatted = formatted.replace(/\n{2,}/g,"</p><p>").replace(/\n/g,"<br>");
    return `<div class="idea-card fade-in"><h2>Project Idea ${idx+1}</h2><p>${formatted}</p></div>`;
  }).join("");
}

// ==== Generate function ====
async function generateIdeas(mode="normal") {
  const prompt = promptInput?.value?.trim();
  const API_KEY = apiKeyInput?.value?.trim();
  if (!prompt) { setOutput("⚠️ Please enter a project idea."); return; }
  if (!API_KEY) { setOutput("⚠️ Please enter your API Key."); return; }

  const [budgetMin, budgetMax] = budgetSlider.noUiSlider.get(true).map(v => Math.round(v));
  const [timeMin, timeMax] = timeframeSlider.noUiSlider.get(true).map(v => Math.round(v));
  const selectedTechs = getSelected(techGroup);
  const selectedIndustries = getSelected(industryGroup);
  const selectedComplexity = getSelected(complexityGroup)[0] || "Medium";
  const innovation = innovationSelect.value || "College Student Level";
  const demo = demoSelect.value || "Small Desk";

  let enhancedPrompt = `
User idea/constraints: ${prompt}
Budget range: $${budgetMin} – $${budgetMax}
Timeframe: ${timeMin} – ${timeMax} months (Research, Development, Hardware setup, Final prototype)
Preferred technologies: ${selectedTechs.join(", ") || "N/A"}
Industry focus: ${selectedIndustries.join(", ") || "N/A"}
Complexity: ${selectedComplexity}
Innovation Level: ${innovation}
Demo Considerations: ${demo}
`;

  if (mode === "normal") {
    enhancedPrompt += `
Generate 3–5 professional computer engineering project ideas. For each, include:
- General Description
- Required Technologies
- Budget Breakdown
- Timeframe Breakdown
- Complexity and possible challenges
- Innovation level
- Demo Considerations
- Similar Products
- Novel Elements`;
  } else if (mode === "expand") {
    enhancedPrompt += `Expand the previous ideas with deeper technical details.`;
  } else if (mode === "similar") {
    enhancedPrompt += `Generate 3–5 related variations of the previous ideas.`;
  } else if (mode === "summarize") {
    enhancedPrompt += `Summarize the previous ideas into concise bullet points.`;
  }

  setOutput("⏳ Generating ideas...");
  extraButtons.classList.remove("hidden");

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${ensureResourceName(DEFAULT_MODEL)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await res.json();
    if (data.error) { setOutput(`❌ API Error: ${data.error.message}`); return; }

    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if (text) { setOutput(formatOutput(text), true); }
    else { setOutput("⚠️ No response from Gemini."); }
  } catch {
    setOutput("❌ Network or fetch error.");
  }
}

// ==== Button events ====
generateBtn?.addEventListener("click", () => generateIdeas("normal"));
expandBtn?.addEventListener("click", () => generateIdeas("expand"));
similarBtn?.addEventListener("click", () => generateIdeas("similar"));
summarizeBtn?.addEventListener("click", () => generateIdeas("summarize"));
