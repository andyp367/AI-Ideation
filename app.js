// ==== Element handles ====
const promptInput   = document.getElementById("prompt");
const generateBtn   = document.getElementById("generate");
const outputDiv     = document.getElementById("output");
const budgetSlider  = document.getElementById("budget-slider");
const budgetDisplay = document.getElementById("budget-display");
const timeframeSlider = document.getElementById("timeframe-slider");
const timeframeDisplay = document.getElementById("timeframe-display");
const techGroup     = document.getElementById("technologies");
const industryGroup = document.getElementById("industries");
const complexityGroup = document.getElementById("complexity");
const innovationSelect = document.getElementById("innovation");
const demoSelect = document.getElementById("demo");
const extraButtons  = document.getElementById("extra-buttons");
const expandBtn     = document.getElementById("expand");
const similarBtn    = document.getElementById("similar");
const summarizeBtn  = document.getElementById("summarize");

// ==== Slider setup ====
noUiSlider.create(budgetSlider, {
  start: [100, 1000],
  connect: true,
  range: { min: 0, max: 10000 },
  step: 50
});
budgetSlider.noUiSlider.on("update", () => {
  const values = budgetSlider.noUiSlider.get(true);
  budgetDisplay.textContent = `Range: $${Math.round(values[0])} – $${Math.round(values[1])}`;
});

noUiSlider.create(timeframeSlider, {
  start: [1, 12],
  connect: true,
  range: { min: 1, max: 24 },
  step: 1
});
timeframeSlider.noUiSlider.on("update", () => {
  const values = timeframeSlider.noUiSlider.get(true);
  timeframeDisplay.textContent = `${Math.round(values[0])} – ${Math.round(values[1])} months`;
});

// ==== Helpers ====
function getSelected(group) {
  const checkboxes = group?.querySelectorAll("input[type=checkbox]:checked") || [];
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedRadio(group) {
  const radio = group.querySelector("input[type=radio]:checked");
  return radio ? radio.value : null;
}

function formatOutput(text) {
  let cleaned = text.replace(/\|/g," ")
                    .replace(/---+/g,"")
                    .replace(/<\/?table.*?>/gi,"")
                    .replace(/<\/?tr.*?>/gi,"")
                    .replace(/<\/?td.*?>/gi,"")
                    .replace(/\*\*/g,"")
                    .replace(/\*/g,"")
                    .replace(/###/g,"")
                    .replace(/##/g,"")
                    .trim();

  let ideas = cleaned.split(/Project Idea\s*\d+/i).filter(s => s.trim()).slice(0,3);

  return ideas.map((idea, idx) => {
    let formatted = idea.replace(/(General Description|Required Technologies|Budget Breakdown|Timeframe|Similar Products|Novel Elements|Complexity|Demo Considerations)/gi,
      m => `<h3 class="section-title">${m}</h3>`
    );

    formatted = formatted.replace(/(?:^|\n)[-•]\s*(.+)/g,"<li>$1</li>");
    if(formatted.includes("<li>")) formatted = `<ul>${formatted}</ul>`;
    formatted = formatted.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");

    return `
      <div class="idea-card fade-in">
        <div class="idea-header">Project Idea ${idx+1}</div>
        <div class="idea-content">${formatted}</div>
      </div>
    `;
  }).join("");
}

// ==== Collapsible logic ====
function setupCollapsible() {
  const headers = document.querySelectorAll(".idea-header");
  headers.forEach(header => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      content.style.display = content.style.display === "block" ? "none" : "block";
    });
  });
}

// ==== Generate ====
async function generateIdeas(mode="normal") {
  const prompt = promptInput.value.trim();
  if(!prompt) {
    outputDiv.innerHTML = "<p>⚠️ Please enter a prompt before generating ideas.</p>";
    return;
  }

  const [budgetMin, budgetMax] = budgetSlider.noUiSlider.get(true).map(v=>Math.round(v));
  const [timeMin, timeMax] = timeframeSlider.noUiSlider.get(true).map(v=>Math.round(v));
  const selectedTechs = getSelected(techGroup);
  const selectedIndustries = getSelected(industryGroup);
  const complexity = getSelectedRadio(complexityGroup);
  const innovation = innovationSelect.value;
  const demo = demoSelect.value;

  let enhancedPrompt = `
User idea/constraints: ${prompt}
Budget range: $${budgetMin} – $${budgetMax}
Timeframe: ${timeMin}-${timeMax} months (Include research, development, hardware setup, final prototype)
Preferred technologies: ${selectedTechs.join(", ") || "N/A"}
Industry focus: ${selectedIndustries.join(", ") || "N/A"}
Project Complexity: ${complexity || "N/A"}
Innovation Level: ${innovation}
Demo Considerations: ${demo}
`;

  if(mode==="normal") {
    enhancedPrompt += `
Generate up to 3 computer engineering project ideas with:
- General Description
- Required Technologies
- Budget Breakdown
- Timeframe Breakdown
- Complexity Challenges
- Demo Considerations
- Similar Products
- Novel Elements`;
  }

  outputDiv.innerHTML = "<p>⏳ Generating ideas...</p>";
  extraButtons.classList.remove("hidden");

  try {
    const API_KEY = document.getElementById("api-key").value.trim();
    if(!API_KEY) {
      outputDiv.innerHTML = "<p>⚠️ Please enter your API Key to generate results.</p>";
      return;
    }

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`, {
      method:"POST",
      headers: { "Content-Type":"application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        contents:[{parts:[{text:enhancedPrompt}]}],
        generationConfig: { temperature:0.7 }
      })
    });

    const data = await res.json();
    if(data.error) {
      outputDiv.innerHTML = `<p>❌ API Error: ${data.error.message}</p>`;
      return;
    }

    const text = data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("").trim();
    if(text) {
      outputDiv.innerHTML = formatOutput(text);
      setupCollapsible();
    } else {
      outputDiv.innerHTML = "<p>⚠️ No response from Gemini.</p>";
    }
  } catch {
    outputDiv.innerHTML = "<p>❌ Network or fetch error.</p>";
  }
}

// ==== Button events ====
generateBtn.addEventListener("click", ()=>generateIdeas("normal"));
expandBtn.addEventListener("click", ()=>generateIdeas("expand"));
similarBtn.addEventListener("click", ()=>generateIdeas("similar"));
summarizeBtn.addEventListener("click", ()=>generateIdeas("summarize"));
