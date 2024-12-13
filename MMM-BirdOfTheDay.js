/**
 * MagicMirror² Module: MMM-BirdOfTheDay
 * Version: 1.1.8
 * 
 * Modifications:
 * - Changed bird identification to use `sciName` instead of `id` for preventing duplicates.
 * - Annotated code for clarity.
 */

Module.register("MMM-BirdOfTheDay", {
    defaults: {
        apiKey: "",
        endpoint: "https://nuthatch.lastelm.software/v2/birds?hasImg=true",
        rotation: "Daily", 
        updateInterval: 24 * 60 * 60 * 1000, 
        fadeSpeed: 2000, 
        imageWidth: "400px", 
        fontSize: "medium", 
        showName: true, 
        showSciName: true, 
        showRegion: true, 
        showStatus: true, 
        maxHistory: 50, 
        textPosition: "below", // Options: "below", "left", "right"
        showTitleLine: true // Toggle to show/hide the line below the title
    },

    bird: null, 
    history: [], // Tracks `sciName` instead of `id`

    start: function () {
        this.updateIntervalFromRotation();
        this.getBird();
        setInterval(() => {
            this.getBird();
        }, this.config.updateInterval);
    },

    updateIntervalFromRotation: function () {
        switch (this.config.rotation) {
            case "Weekly":
                this.config.updateInterval = 7 * 24 * 60 * 60 * 1000;
                break;
            case "Daily":
                this.config.updateInterval = 24 * 60 * 60 * 1000;
                break;
            case "Hourly":
                this.config.updateInterval = 60 * 60 * 1000;
                break;
            default:
                console.warn("Invalid rotation value. Defaulting to 'Daily'.");
                this.config.updateInterval = 24 * 60 * 60 * 1000;
        }
    },

    getBird: function () {
        fetch(this.config.endpoint, {
            headers: { "api-key": this.config.apiKey },
        })
            .then((response) => {
                if (!response.ok) throw new Error("Failed to fetch bird data.");
                return response.json();
            })
            .then((data) => {
                const birdsWithImages = data.entities.filter(
                    (bird) => bird.images && bird.images.length > 0
                );
                if (birdsWithImages.length > 0) {
                    let bird;
                    let attempts = 0;

                    // Pick a bird with a unique sciName
                    do {
                        const randomIndex = Math.floor(Math.random() * birdsWithImages.length);
                        bird = birdsWithImages[randomIndex];
                        attempts++;
                    } while (this.history.includes(bird.sciName) && attempts < 100);

                    if (attempts >= 100) {
                        console.warn("Could not find a unique bird, showing the first available.");
                    }

                    // Add the bird's sciName to history and maintain maxHistory limit
                    this.history.push(bird.sciName);
                    if (this.history.length > this.config.maxHistory) {
                        this.history.shift();
                    }

                    this.bird = bird;
                    this.updateDom(this.config.fadeSpeed);
                }
            })
            .catch((error) => console.error("Error fetching bird data:", error));
    },

    getStyles: function () {
        return ["MMM-BirdOfTheDay.css"];
    },

    getDom: function() {
        const wrapper = document.createElement("div");
        wrapper.className = `bird-wrapper bird-text-${this.config.textPosition}`;

        if (!this.bird) {
            wrapper.innerHTML = "Loading Bird...";
            return wrapper;
        }

        // Title container
        const titleContainer = document.createElement("div");
        titleContainer.className = "bird-title-container";

        // Title
        const title = document.createElement("h2");
        title.className = "bird-title";
        title.innerHTML = this.config.rotation === "Weekly" 
            ? "Bird of the Week" 
            : this.config.rotation === "Hourly"
            ? "Bird of the Hour"
            : "Bird of the Day";
        titleContainer.appendChild(title);

        // Add horizontal line if enabled
        if (this.config.showTitleLine) {
            const line = document.createElement("hr");
            line.className = "bird-title-line";
            titleContainer.appendChild(line);
        }

        // Content wrapper
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "bird-content";

        // Image section
        const imageContainer = document.createElement("div");
        imageContainer.className = "bird-image-container";
        const image = document.createElement("img");
        image.className = "bird-image";
        image.src = this.bird.images[0];
        image.style.maxWidth = this.config.imageWidth;
        imageContainer.appendChild(image);

        // Info section
        const info = document.createElement("div");
        info.className = "bird-info";

        if (this.config.showName) {
            const birdName = document.createElement("h3");
            birdName.className = "bird-name";
            birdName.innerHTML = this.bird.name;
            info.appendChild(birdName);
        }

        if (this.config.showSciName) {
            const sciName = document.createElement("p");
            sciName.innerHTML = `<i>${this.bird.sciName}</i>`;
            sciName.style.fontSize = this.config.fontSize;
            info.appendChild(sciName);
        }

        if (this.config.showRegion) {
            const region = document.createElement("p");
            region.innerHTML = `Region: ${this.bird.region.join(", ")}`;
            region.style.fontSize = this.config.fontSize;
            info.appendChild(region);
        }

        if (this.config.showStatus) {
            const status = document.createElement("p");
            status.innerHTML = `Conservation Status: ${this.bird.status}`;
            status.style.fontSize = this.config.fontSize;
            info.appendChild(status);
        }

        // Assembly
        wrapper.appendChild(titleContainer);
        contentWrapper.appendChild(imageContainer);
        contentWrapper.appendChild(info);
        wrapper.appendChild(contentWrapper);

        return wrapper;
    }
});
