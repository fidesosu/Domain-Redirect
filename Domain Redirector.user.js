// ==UserScript==
// @author			 fides
// @name         Domain Redirector
// @namespace    https://github.com/fidesosu/Domain-Redirect
// @version      1.0
// @description  Redirect specified domains to their replacements
// @match        http://*/*
// @match        https://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
	// Function to redirect the browser to the replacement URL
	function redirect(originalURL, replacementURL) {
		const newURL = originalURL.replace(window.location.href, replacementURL);
		if (newURL !== originalURL) {
			window.location.href = newURL;
		}
	}

	// Retrieve domain replacements from storage
	function getDomainReplacements() {
		const replacementsStr = GM_getValue("domainReplacements", "{}");
		return JSON.parse(replacementsStr);
	}

	// Save domain replacements to storage
	function saveDomainReplacements(replacements) {
		const replacementsStr = JSON.stringify(replacements);
		GM_setValue("domainReplacements", replacementsStr);
	}

	// Add domain replacement to the list
	function addDomainReplacement(domain, replacement) {
		const replacements = getDomainReplacements();
		replacements[domain] = replacement;
		saveDomainReplacements(replacements);
		checkDomain(); // Call checkDomain() after adding domain replacement
	}

	// Remove domain replacement from the list
	function removeDomainReplacement(domain) {
		const replacements = getDomainReplacements();
		delete replacements[domain];
		saveDomainReplacements(replacements);
		checkDomain(); // Call checkDomain() after removing domain replacement
	}

	// Check if the current domain needs to be replaced
	function checkDomain() {
		const currentURL = window.location.href;
		const currentDomain = window.location.hostname;
		const currentPath = window.location.pathname;
		const replacements = getDomainReplacements();
		const whitelist = GM_getValue("whitelist", []);
		const blacklist = GM_getValue("blacklist", []);
		const isWhitelisted = whitelist.includes(currentDomain);
		const isBlacklisted = blacklist.includes(currentDomain);

		if (isWhitelisted && !isBlacklisted) { // Changed && to ||
			return;
		}

		const currentSubdomain = currentDomain.split(".")[0];
		let replacementURL = null;

		// Check if the current domain is in the replacements
		if (currentDomain in replacements) {
			replacementURL = replacements[currentDomain];
		}

		if (replacementURL) { // This is a problem that needs fixing...
			const newURL = currentURL.replace(currentDomain, replacementURL); // If 'currentDomain' is changed to currentURL the code adds the 'replacementURL' at the end of the URL.
			if (newURL !== currentURL) {																			// This needs a way to change the whole url if necessary while remembering the path/arguments in the url or simply just the whole URL.
				redirect(currentURL, newURL);
			}
		}
	}

	// Call checkDomain() when the page loads
	checkDomain();

	// Add event listener to check the domain on every URL change
	window.addEventListener("hashchange", checkDomain, false);
	window.addEventListener("popstate", checkDomain, false);
	window.addEventListener("pushState", checkDomain, false);

	// User Interface
	function createUI() {
		const container = document.createElement("div");
		container.classList.add("domain-redirector-ui"); // Add a unique class for the container
		container.style.position = "fixed";
		container.style.top = "40px";
		container.style.right = "20px";
		container.style.zIndex = "9999";
		container.style.background = "#222";
		container.style.padding = "10px";
		container.style.borderRadius = "5px";
		container.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
		container.style.color = "#fff";
		container.style.width = "250px"; // Adjust the width as needed
		container.style.maxHeight = "80%";
		container.style.overflowY = "auto";

		const closeButton = document.createElement("button");
		closeButton.textContent = "X";
		closeButton.style.position = "absolute";
		closeButton.style.top = "5px";
		closeButton.style.right = "5px";
		closeButton.style.background = "transparent";
		closeButton.style.border = "none";
		closeButton.style.color = "#999";
		closeButton.style.fontWeight = "bold";
		closeButton.addEventListener("click", () => {
			document.body.removeChild(container);
		});

		closeButton.style.transition = "color 0.15s ease"; // Add transition for smooth effect

		// Add hover effect using inline CSS
		closeButton.style.cursor = "pointer";
		closeButton.addEventListener("mouseenter", () => {
			closeButton.style.color = "#fff"; // Change color on hover
		});
		closeButton.addEventListener("mouseleave", () => {
			closeButton.style.color = "#999"; // Change color back to default
		});

		const title = document.createElement("h2");
		title.textContent = "Domain Redirector";
		title.style.marginTop = "0";
		title.style.marginBottom = "10px";
		title.style.fontSize = "16px";
		title.style.fontWeight = "bold";

		const list = document.createElement("ul");
		list.style.listStyle = "none";
		list.style.padding = "0";
		list.style.margin = "0";
		list.style.fontSize = "12px";

		const addButton = document.createElement("button");
		addButton.textContent = "Add Domain";
		addButton.style.marginTop = "10px";
		addButton.style.backgroundColor = "#007bff";
		addButton.style.color = "#fff";
		addButton.style.border = "none";
		addButton.style.padding = "5px 10px";
		addButton.style.borderRadius = "3px";
		addButton.addEventListener("click", () => {
			const domain = prompt("Enter the domain to redirect:");
			if (domain == null || "") {
				return;
			}
			const replacement = prompt("Enter the replacement URL:");
			if (domain && replacement) {
				addDomainReplacement(domain, replacement);
				createListItem(domain, replacement);
			}
		});

		addButton.style.transition = "color 0.15s ease"; // Add transition for smooth effect

		// Add hover effect using inline CSS
		addButton.style.cursor = "pointer";
		addButton.addEventListener("mouseenter", () => {
			addButton.style.backgroundColor = "#0000ff"; // Change color on hover
		});
		addButton.addEventListener("mouseleave", () => {
			addButton.style.backgroundColor = "#007bff"; // Change color back to default
		});

		const exportButton = document.createElement("button");
		exportButton.textContent = "Export";
		exportButton.style.marginTop = "10px";
		exportButton.style.backgroundColor = "#007bff";
		exportButton.style.color = "#fff";
		exportButton.style.border = "none";
		exportButton.style.padding = "5px 10px";
		exportButton.style.marginLeft = "5px";
		exportButton.style.borderRadius = "3px";
		exportButton.addEventListener("click", () => {
			const replacements = getDomainReplacements();
			const json = JSON.stringify(replacements);
			const dataURI = `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
			const link = document.createElement("a");
			link.setAttribute("href", dataURI);
			link.setAttribute("download", "domain_replacements.json");
			link.click();
		});

		exportButton.style.transition = "color 0.15s ease"; // Add transition for smooth effect

		// Add hover effect using inline CSS
		exportButton.style.cursor = "pointer";
		exportButton.addEventListener("mouseenter", () => {
			exportButton.style.backgroundColor = "#0000ff"; // Change color on hover
		});
		exportButton.addEventListener("mouseleave", () => {
			exportButton.style.backgroundColor = "#007bff"; // Change color back to default
		});

		const importButton = document.createElement("button");
		importButton.textContent = "Import";
		importButton.style.marginTop = "10px";
		importButton.style.backgroundColor = "#007bff";
		importButton.style.color = "#fff";
		importButton.style.border = "none";
		importButton.style.padding = "5px 10px";
		importButton.style.marginLeft = "5px";
		importButton.style.borderRadius = "3px";
		importButton.addEventListener("click", () => {
			const fileInput = document.createElement("input");
			fileInput.setAttribute("type", "file");
			fileInput.addEventListener("change", (event) => {
				const file = event.target.files[0];
				const reader = new FileReader();
				reader.onload = (event) => {
					const contents = event.target.result;
					try {
						const replacements = JSON.parse(contents);
						saveDomainReplacements(replacements);
						refreshList();
					} catch (error) {
						alert("Failed to import domain replacements. Please ensure the file is valid JSON.");
					}
				};
				reader.readAsText(file);
			});
			fileInput.click();
		});

		importButton.style.transition = "color 0.15s ease"; // Add transition for smooth effect

		// Add hover effect using inline CSS
		importButton.style.cursor = "pointer";
		importButton.addEventListener("mouseenter", () => {
			importButton.style.backgroundColor = "#0000ff"; // Change color on hover
		});
		importButton.addEventListener("mouseleave", () => {
			importButton.style.backgroundColor = "#007bff"; // Change color back to default
		});

		function createListItem(domain, replacement) {
			const item = document.createElement("li");
			item.style.display = "flex";
			item.style.flexDirection = "column"; // Display items in a column layout
			item.style.maxHeight = "250px"; // Set your desired maximum height
			item.style.overflowY = "auto"; // Enable vertical scrolling if the content overflows

			const domainContainer = document.createElement("div");
			domainContainer.textContent = `Domain: ${domain}`;
			domainContainer.style.paddingTop = "5px";
			domainContainer.style.paddingBottom = "5px";
			domainContainer.style.minHeight = "20px"; // Set your desired minimum height
			domainContainer.style.overflow = "hidden"; // Hide overflowing content
			domainContainer.style.borderBottom = "2px solid #fff"

			const replacementContainer = document.createElement("div");
			replacementContainer.textContent = `Replacement: ${replacement}`;
			replacementContainer.style.paddingTop = "5px";
			replacementContainer.style.marginBottom = "5px";
			replacementContainer.style.minHeight = "20px"; // Set your desired minimum height
			replacementContainer.style.overflow = "hidden"; // Hide overflowing content

			const removeButton = document.createElement("button");
			removeButton.textContent = "Remove";
			removeButton.style.backgroundColor = "#dc3545";
			removeButton.style.color = "#fff";
			removeButton.style.border = "none";
			removeButton.style.padding = "2px 5px";
			removeButton.style.borderRadius = "3px";
			removeButton.style.marginTop = "5px"; // Add margin to separate from textContainer
			removeButton.style.height = "30px";
			removeButton.addEventListener("click", () => {
				removeDomainReplacement(domain);
				list.removeChild(item);
			});

			removeButton.style.transition = "color 0.15s ease"; // Add transition for a smooth effect

			// Add hover effect using inline CSS
			removeButton.style.cursor = "pointer";
			removeButton.addEventListener("mouseenter", () => {
				removeButton.style.backgroundColor = "#ff0000"; // Change color on hover
			});
			removeButton.addEventListener("mouseleave", () => {
				removeButton.style.backgroundColor = "#dc3545"; // Change color back to default
			});

			item.appendChild(domainContainer);
			item.appendChild(replacementContainer);
			item.appendChild(removeButton);
			list.appendChild(item);
		}

		const settingsButton = document.createElement("button");
		settingsButton.textContent = "Add Domain";
		settingsButton.style.marginTop = "10px";
		settingsButton.style.backgroundColor = "#007bff";
		settingsButton.style.color = "#fff";
		settingsButton.style.border = "none";
		settingsButton.style.padding = "5px 10px";
		settingsButton.style.borderRadius = "3px";
		settingsButton.addEventListener("click", () => {
			const settings = document.createElement("div");

		});

		function refreshList() {
			list.innerHTML = "";
			const replacements = getDomainReplacements();
			for (const domain in replacements) {
				createListItem(domain, replacements[domain]);
			}
		}

		refreshList();

		container.appendChild(closeButton);
		container.appendChild(title);
		container.appendChild(list);
		container.appendChild(addButton);
		container.appendChild(exportButton);
		container.appendChild(importButton);
		container.appendChild(settingsButton);

		document.body.appendChild(container);
	}

	// Register user menu command to open the UI
	GM_registerMenuCommand("GUI", () => {
		createUI();
	});
})();