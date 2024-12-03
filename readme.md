
# MMM-BirdOfTheDay

A MagicMirror² module to display a random bird with an image and optional information such as its name, region, scientific name, and conservation status. Powered by the **Nuthatch API** by Last Elm Software.

## Features
- Displays a random bird with an image.
- Configurable rotation: **Hourly**, **Daily**, or **Weekly**.
- Optional details: Name, scientific name, region, and conservation status.
- Customizable styles for images and text.

## Powered By
**Bird of the Day** uses the [Nuthatch API by Last Elm Software](https://nuthatch.lastelm.software/). A big thanks to them for providing this free resource! 🌟

## Installation
1. Navigate to your MagicMirror's `modules` directory:
   ```bash
   cd ~/MagicMirror/modules
   ```
2. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/MMM-BirdOfTheDay.git
   ```
3. Navigate into the module's directory:
   ```bash
   cd MMM-BirdOfTheDay
   ```
4. Install the required dependencies:
   ```bash
   npm install
   ```

## Configuration
1. **Get Your Free API Key**:
   - Visit [Nuthatch API's key generation page](https://nuthatch.lastelm.software/getKey.html).
   - Follow the instructions to generate your free API key.

2. **Add the Module to `config.js`**:
   Edit your `MagicMirror/config/config.js` file and add the following configuration:
   ```javascript
   {
       module: "MMM-BirdOfTheDay",
       position: "top_center", // Choose your preferred position
       config: {
           apiKey: "YOUR_API_KEY_HERE", // Replace with your Nuthatch API key
           rotation: "Hourly", // Options: "Hourly", "Daily", "Weekly"
           imageWidth: "300px", // Customize the image size
           fontSize: "medium", // Font size for text
           showName: true, // Display the bird's common name
           showSciName: false, // Hide the scientific name
           showRegion: true, // Display the region(s) where the bird is found
           showStatus: false, // Hide the conservation status
       },
   },
   ```

## Example Configuration
- **Bird of the Hour**: Updates every hour.
- **Bird of the Day**: Updates daily.
- **Bird of the Week**: Updates weekly.

## Customization
You can further customize the styles by editing the `MMM-BirdOfTheDay.css` file, located in the module's folder.

## License
This project is licensed under the MIT License.

---

### Credits
This module uses the [Nuthatch API](https://nuthatch.lastelm.software/) by Last Elm Software to fetch bird data. All rights for the bird data and images belong to the respective contributors.

---

Happy birdwatching! 🐦
