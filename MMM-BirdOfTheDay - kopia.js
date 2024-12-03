/**
 * MagicMirror² Module: MMM-BirdOfTheDay
 * Displays a random bird with its name, image, and optional details (region, scientific name, conservation status).
 * Supports configurable rotation (hourly, daily, weekly).
 *
 * Author: Your Name
 * License: MIT
 */

Module.register("MMM-BirdOfTheDay", {
    // Default configuration options
    defaults: {
        apiKey: "YOUR_API_KEY_HERE", // API key from the bird API provider
        endpoint: "https://nuthatch.lastelm.software/v2/birds?hasImg=true", // API endpoint
        rotation: "Daily", // Options: "Hourly", "Daily", "Weekly"
        updateInterval: 24 * 60 * 60 * 1000, // Update interval in milliseconds (default: daily)
        fadeSpeed: 2000, // Speed for fade-in effect (milliseconds)
        imageWidth: "400px", // Width of the bird image
        fontSize: "medium", // Font size for text
        showName: true, // Display bird name
        showSciName: true, // Display scientific name
        showRegion: true, // Display region
        showStatus: true, // Display conservation status
    },

    bird: null, // Object to store the current bird data

    /**
     * Module initialization
     */
    start: function () {
        this.updateIntervalFromRotation(); // Set the update interval based on rotation
        this.getBird(); // Fetch bird data immediately upon starting
        setInterval(() => {
            this.getBird(); // Fetch a new bird at the configured interval
        }, this.config.updateInterval);
    },

    /**
     * Dynamically adjust the update interval based on the rotation setting
     */
    updateIntervalFromRotation: function () {
        switch (this.config.rotation) {
            case "Weekly":
                this.config.updateInterval = 7 * 24 * 60 * 60 * 1000; // One week
                break;
            case "Daily":
                this.config.updateInterval = 24 * 60 * 60 * 1000; // One day
                break;
            case "Hourly":
                this.config.updateInterval = 60 * 60 * 1000; // One hour
                break;
            default:
                console.warn("Invalid rotation value. Defaulting to 'Daily'.");
                this.config.updateInterval = 24 * 60 * 60 * 1000;
        }
    },

    /**
     * Fetch a random bird from the API
     */
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
                    const randomIndex = Math.floor(Math.random() * birdsWithImages.length);
                    this.bird = birdsWithImages[randomIndex];
                    this.updateDom(this.config.fadeSpeed); // Update the DOM
                }
            })
            .catch((error) => console.error("Error fetching bird data:", error));
    },

    /**
     * Define additional CSS styles
     */
    getStyles: function () {
        return ["MMM-BirdOfTheDay.css"];
    },

    /**
     * Generate the DOM elements for the module
     */
    getDom: function () {
        const wrapper = document.createElement("div");

        if (!this.bird) {
            wrapper.innerHTML = "Loading Bird...";
            return wrapper;
        }

        // Dynamic header based on rotation
        const title = document.createElement("h2");
        title.className = "bird-title";
        title.innerHTML =
            this.config.rotation === "Weekly"
                ? "Bird of the Week"
                : this.config.rotation === "Hourly"
                ? "Bird of the Hour"
                : "Bird of the Day";
        wrapper.appendChild(title);

        // Bird image
        const image = document.createElement("img");
        image.className = "bird-image";
        image.src = this.bird.images[0];
        image.style.maxWidth = this.config.imageWidth;
        wrapper.appendChild(image);

        // Bird name (if enabled)
        if (this.config.showName) {
            const birdName = document.createElement("h3");
            birdName.className = "bird-name";
            birdName.innerHTML = this.bird.name;
            wrapper.appendChild(birdName);
        }

        // Additional information
        const info = document.createElement("div");
        info.className = "bird-info";

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

        wrapper.appendChild(info);

        return wrapper;
    },
});
