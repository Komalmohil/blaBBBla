async function geocode(query) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Geocoding request failed");

    let data = await res.json();
    data = data.filter(item => ["city", "town", "village", "administrative"].includes(item.type));
    return data;
  } catch (err) {
    console.error("Geocoding error:", err.message);
    return [];
  }
}

function setupAutocomplete(inputId, suggestionsId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionsId);

  input.addEventListener("input", async () => {
    const query = input.value.trim();
    box.innerHTML = "";

    if (query.length < 3) {
      box.classList.add("hidden");
      return;
    }

    const results = await geocode(query);

    results.forEach(result => {
      const addr = result.address;
      const parts = [];

      if (addr.city) parts.push(addr.city);
      else if (addr.town) parts.push(addr.town);
      else if (addr.village) parts.push(addr.village);

      if (addr.state_district) parts.push(addr.state_district);
      if (addr.state) parts.push(addr.state);

      const short = parts.join(", ");
      const full = result.display_name;

      const div = document.createElement("div");
      div.classList.add("suggestion-item");

      div.innerHTML = `
        <div class="text-content">
          <div class="title">${short}</div>
          <div class="subtitle">${full}</div>
        </div>
      `;

      div.addEventListener("click", () => {
            let city = addr.city || addr.town || addr.village || '';
            input.value = city;
            box.classList.add("hidden");
      });

      box.appendChild(div);
    });

    box.classList.remove("hidden");
  });
}


setupAutocomplete("location", "locSugg");
setupAutocomplete("destination", "desSugg");
