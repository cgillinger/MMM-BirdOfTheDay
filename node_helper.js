/* MMM-BirdOfTheDay — node helper
 *
 * Owns all Nuthatch API communication and the rotation state, so that
 * the API key never leaves the server and the current bird + history
 * survive restarts of MagicMirror.
 */
const NodeHelper = require("node_helper");
const Log = require("logger");
const fs = require("fs");
const path = require("path");

const RETRY_DELAY = 2 * 60 * 1000;

module.exports = NodeHelper.create({
    start: function () {
        this.config = null;
        this.allBirds = [];
        this.retryTimer = null;
        this.state = this.loadState();
    },

    stop: function () {
        clearTimeout(this.retryTimer);
    },

    statePath: function () {
        return path.join(this.path, ".botd-state.json");
    },

    loadState: function () {
        try {
            return JSON.parse(fs.readFileSync(this.statePath(), "utf8"));
        } catch (e) {
            return { history: [], bird: null, imageUrl: null, expiresAt: 0, rotation: null };
        }
    },

    saveState: function () {
        try {
            fs.writeFileSync(this.statePath(), JSON.stringify(this.state));
        } catch (e) {
            Log.error(`MMM-BirdOfTheDay: could not persist state: ${e.message}`);
        }
    },

    socketNotificationReceived: function (notification, payload) {
        if (notification === "BOTD_GET_BIRD") {
            this.config = payload.config;
            this.deliverBird(payload.identifier);
        }
    },

    deliverBird: async function (identifier) {
        clearTimeout(this.retryTimer);

        if (this.allBirds.length === 0) {
            try {
                this.allBirds = await this.loadAllBirds();
                Log.info(`MMM-BirdOfTheDay: loaded ${this.allBirds.length} birds with images.`);
            } catch (e) {
                Log.error(`MMM-BirdOfTheDay: error loading birds: ${e.message}`);
                this.sendSocketNotification("BOTD_ERROR", { identifier, message: e.message });
                this.retryTimer = setTimeout(() => this.deliverBird(identifier), RETRY_DELAY);
                return;
            }
        }

        const now = Date.now();
        const expired = !this.state.bird || now >= this.state.expiresAt;
        const rotationChanged = this.state.rotation !== this.config.rotation;
        if (expired || rotationChanged) {
            this.pickNewBird();
        }

        this.sendSocketNotification("BOTD_BIRD", {
            identifier,
            bird: this.state.bird,
            imageUrl: this.state.imageUrl,
            expiresAt: this.state.expiresAt
        });
    },

    pickNewBird: function () {
        // Never let the history block every bird: keep it strictly smaller
        // than the pool so at least one fresh pick always exists.
        const cap = Math.max(0, Math.min(this.config.maxHistory, this.allBirds.length - 1));
        let history = this.state.history || [];
        history = history.slice(history.length > cap ? history.length - cap : 0);

        const fresh = this.allBirds.filter((b) => !history.includes(b.sciName));
        const pool = fresh.length > 0 ? fresh : this.allBirds;
        const bird = pool[Math.floor(Math.random() * pool.length)];

        // Vary the picture too when a bird has more than one.
        const images = bird.images || [];
        const imageUrl = images[Math.floor(Math.random() * images.length)] || null;

        history.push(bird.sciName);
        if (history.length > cap) {
            history = history.slice(history.length - cap);
        }

        this.state = {
            history,
            bird,
            imageUrl,
            expiresAt: this.nextBoundary(this.config.rotation),
            rotation: this.config.rotation
        };
        this.saveState();
    },

    /* Rotation follows the calendar rather than the boot time:
     * Hourly at the top of the hour, Daily at midnight, Weekly on
     * Monday at midnight (local time). */
    nextBoundary: function (rotation) {
        const next = new Date();
        switch (rotation) {
            case "Hourly":
                next.setHours(next.getHours() + 1, 0, 0, 0);
                break;
            case "Weekly": {
                const daysUntilMonday = ((8 - next.getDay()) % 7) || 7;
                next.setDate(next.getDate() + daysUntilMonday);
                next.setHours(0, 0, 0, 0);
                break;
            }
            case "Daily":
                next.setDate(next.getDate() + 1);
                next.setHours(0, 0, 0, 0);
                break;
            default:
                Log.warn(`MMM-BirdOfTheDay: invalid rotation "${rotation}", defaulting to Daily.`);
                next.setDate(next.getDate() + 1);
                next.setHours(0, 0, 0, 0);
        }
        return next.getTime();
    },

    loadAllBirds: async function () {
        const all = [];
        let page = 1;
        for (;;) {
            const url = `${this.config.endpoint}?hasImg=true&pageSize=100&page=${page}`;
            const response = await fetch(url, { headers: { "api-key": this.config.apiKey } });
            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? "Unauthorized (401) — check your Nuthatch API key."
                        : `Nuthatch API responded with HTTP ${response.status}.`
                );
            }
            const data = await response.json();
            const entities = data.entities || [];
            all.push(...entities.filter((b) => b.images && b.images.length > 0));
            if (entities.length < 100) {
                break;
            }
            page++;
        }
        if (all.length === 0) {
            throw new Error("Nuthatch API returned no birds with images.");
        }
        return all;
    }
});
