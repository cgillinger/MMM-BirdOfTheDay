Module.register("MMM-BirdOfTheDay", {
    defaults: {
        apiKey: "",
        endpoint: "https://nuthatch.lastelm.software/v2/birds",
        rotation: "Daily",
        fadeSpeed: 2000,
        imageWidth: "400px",
        fontSize: "medium",
        showName: true,
        showSciName: true,
        showRegion: true,
        showStatus: true,
        maxHistory: 50,
        textPosition: "below",
        showTitleLine: true
    },

    requiresVersion: "2.1.0",

    start: function () {
        this.bird = null;
        this.imageUrl = null;
        this.expiresAt = null;
        this.error = null;
        this.rotationTimer = null;

        if (!this.config.apiKey) {
            this.error = "ERROR_NO_KEY";
            return;
        }
        this.requestBird();
    },

    requestBird: function () {
        this.sendSocketNotification("BOTD_GET_BIRD", {
            identifier: this.identifier,
            config: {
                endpoint: this.config.endpoint,
                apiKey: this.config.apiKey,
                rotation: this.config.rotation,
                maxHistory: this.config.maxHistory
            }
        });
    },

    socketNotificationReceived: function (notification, payload) {
        if (payload.identifier !== this.identifier) {
            return;
        }
        if (notification === "BOTD_BIRD") {
            this.error = null;
            this.bird = payload.bird;
            this.imageUrl = payload.imageUrl;
            this.expiresAt = payload.expiresAt;
            this.updateDom(this.config.fadeSpeed);
            this.scheduleNextRotation();
        } else if (notification === "BOTD_ERROR") {
            Log.error(`MMM-BirdOfTheDay: ${payload.message}`);
            if (!this.bird) {
                this.error = "ERROR_LOADING";
                this.updateDom();
            }
        }
    },

    scheduleNextRotation: function () {
        clearTimeout(this.rotationTimer);
        if (!this.expiresAt) {
            return;
        }
        const delay = Math.max(this.expiresAt - Date.now(), 0) + 2000;
        this.rotationTimer = setTimeout(() => this.requestBird(), delay);
    },

    suspend: function () {
        clearTimeout(this.rotationTimer);
        this.rotationTimer = null;
    },

    resume: function () {
        if (!this.config.apiKey) {
            return;
        }
        if (this.expiresAt && Date.now() >= this.expiresAt) {
            this.requestBird();
        } else {
            this.scheduleNextRotation();
        }
    },

    getStyles: function () {
        return ["MMM-BirdOfTheDay.css"];
    },

    getTranslations: function () {
        return {
            en: "translations/en.json",
            sv: "translations/sv.json"
        };
    },

    getTitle: function () {
        switch (this.config.rotation) {
            case "Weekly":
                return this.translate("TITLE_WEEKLY");
            case "Hourly":
                return this.translate("TITLE_HOURLY");
            default:
                return this.translate("TITLE_DAILY");
        }
    },

    getDom: function () {
        const wrapper = document.createElement("div");
        wrapper.className = `bird-wrapper bird-text-${this.config.textPosition}`;

        if (this.error) {
            const error = document.createElement("div");
            error.className = "bird-error dimmed light small";
            error.textContent = this.translate(this.error);
            wrapper.appendChild(error);
            return wrapper;
        }

        if (!this.bird) {
            wrapper.textContent = this.translate("LOADING");
            return wrapper;
        }

        const titleContainer = document.createElement("div");
        titleContainer.className = "bird-title-container";

        const title = document.createElement("h2");
        title.className = "bird-title";
        title.textContent = this.getTitle();
        titleContainer.appendChild(title);

        if (this.config.showTitleLine) {
            const line = document.createElement("hr");
            line.className = "bird-title-line";
            titleContainer.appendChild(line);
        }

        const contentWrapper = document.createElement("div");
        contentWrapper.className = "bird-content";

        const imageContainer = document.createElement("div");
        imageContainer.className = "bird-image-container";
        const image = document.createElement("img");
        image.className = "bird-image";
        image.src = this.imageUrl || (this.bird.images && this.bird.images[0]) || "";
        image.alt = this.bird.name || "";
        image.style.maxWidth = this.config.imageWidth;
        imageContainer.appendChild(image);

        const info = document.createElement("div");
        info.className = "bird-info";

        if (this.config.showName && this.bird.name) {
            const birdName = document.createElement("h3");
            birdName.className = "bird-name";
            birdName.textContent = this.bird.name;
            info.appendChild(birdName);
        }

        if (this.config.showSciName && this.bird.sciName) {
            const sciName = document.createElement("p");
            const italic = document.createElement("i");
            italic.textContent = this.bird.sciName;
            sciName.appendChild(italic);
            sciName.style.fontSize = this.config.fontSize;
            info.appendChild(sciName);
        }

        if (this.config.showRegion && Array.isArray(this.bird.region) && this.bird.region.length > 0) {
            const region = document.createElement("p");
            region.textContent = `${this.translate("REGION")}: ${this.bird.region.join(", ")}`;
            region.style.fontSize = this.config.fontSize;
            info.appendChild(region);
        }

        if (this.config.showStatus && this.bird.status) {
            const status = document.createElement("p");
            status.textContent = `${this.translate("STATUS")}: ${this.bird.status}`;
            status.style.fontSize = this.config.fontSize;
            info.appendChild(status);
        }

        wrapper.appendChild(titleContainer);
        contentWrapper.appendChild(imageContainer);
        contentWrapper.appendChild(info);
        wrapper.appendChild(contentWrapper);

        return wrapper;
    }
});
