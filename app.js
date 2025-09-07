const apiKeyInput = document.getElementById("api-key");
const promptInput = document.getElementById("prompt");
const budgetMinInput = document.getElementById("budget-min");
const budgetMaxInput = document.getElementById("budget-max");
const budgetMinDisplay = document.getElementById("budget-min-display");
const budgetMaxDisplay = document.getElementById("budget-max-display");
const techGroup = document.getElementById("technologies");
const industryGroup = document.getElementById("industries");
const timeframeMinInput = document.getElementById("timeframe-min");
const timeframeMaxInput = document.getElementById("timeframe-max");
const complexityGroup = document.getElementById("complexity");
const innovationSelect = document.getElementById("innovation");
const demoSelect = document.getElementById("demo-space");
const resultsDiv = document.getElementById("results");

// Save/reload API key from localStorage
apiKeyInput.value = localStorage.getItem("openai_api_key") || "";
apiKeyInput.addEventListener("change", () => {
  localStorage.setItem("openai_api_key", apiKeyInput.value.trim());
});

// Update budget slider displays
budgetMinDisplay.textContent = budgetMinInput.value;
budgetMaxDisplay.textContent = budgetMaxInput.value;

budgetMinInput.addEventListener("input", () => {
  budgetMinDisplay.textContent = budgetMinInput.value;
});
budgetMaxInput.addEventListener("input", () => {
  budgetMaxDisplay.textContent = budgetMaxInput.value;
});

function getSelectedCheckboxes(group) {
  return Array.from(group.querySelectorAll("input[type=checkbox]:checked")).map(el => el.value);
}

function getSelectedRadio(group) {
  const selected = group.querySelector("input[type=radio]:checked");
  return selected ? selected.value : "N/A";
}

async function generateIdeas(mode = "normal") {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    alert("Please enter your OpenAI API Key.");
    return;
  }

  const prompt = promptInput.value.trim();
  const budgetMin = budgetMinInput.value || "N/A";
  const budgetMax = budgetMaxInput.value || "N/A";
  const selectedTechs = getSelectedCheckboxes(techGroup);
  const selectedIndustries = getSelectedCheckboxes(industryGroup);
  const timeframeMin = timeframeMinInput.value || "N/A";
  const timeframeMax = timeframeMaxInput.value || "N/A";
  const selectedComplexity = getSelectedRadio(complexityGroup);
  const innovationLevel = innovationSelect.value;
  const demoSpace = demoSelect.value;

  let enhancedPrompt = `
User idea/constraints: ${prompt}
Budget range: $${budgetMin} – $${budgetMax}
Preferred technologies: ${selectedTechs.join(", ") || "N/A"}
Industry focus: ${selectedIndustries.join(", ") || "N/A"}
Expected timeframe: ${timeframeMin}–${timeframeMax} months
Complexity level: ${selectedComplexity}
Innovation level: ${innovationLevel}
Demo space: ${demoSpace}
`;

  if (mode === "normal") {
    enhancedPrompt += `
Generate 3–5 computer engineering project ideas. For each, provide:
- General Description
- Required Technologies
- Budget Breakdown
- Timeframe Breakdown (research, development, hardware setup, final prototype)
- Complexity & Challenges
- Similar Products
- Novel Elements
- Demo Considerations`;
  } else {
    enhancedPrompt += `
Provide a highly detailed technical project proposal, including:
- Architecture diagrams (described textually)
- Step-by-step implementation plan
- Hardware/software requirements
- Potential pitfalls & debugging strategies
- Scalability and future improvements`;
  }

  resultsDiv.textContent = "⏳ Generating ideas...";
  
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5",
        messages: [{ role: "user", content: enhancedPrompt }]
      })
    });

    const data = await response.json();
    resultsDiv.textContent = data.choices?.[0]?.message?.content || "⚠️ No response.";
  } catch (err) {
    resultsDiv.textContent = "❌ Error: " + err.message;
  }
}

document.getElementById("generate-normal").addEventListener("click", () => generateIdeas("normal"));
document.getElementById("generate-advanced").addEventListener("click", () => generateIdeas("advanced"));
