# Opioid Conversion Calculator

A client-side web tool to calculate equianalgesic doses for various opioid medications. This application runs entirely in the browser and provides a user-friendly interface for healthcare professionals to perform safe and accurate opioid conversions.

## Features

-   **Static & Serverless**: Runs entirely in the browser. No backend required, ensuring privacy and offline availability.
-   **Multiple Opioids**: Calculate the total Oral Morphine Equivalent (OME) from multiple current opioid medications.
-   **Dose Reduction**: Applies a 25% dose reduction when switching between opioids (50% for elderly or frail patients) to ensure safety.
-   **Convenient Dosing**: Rounds the final calculated dose to the nearest available dosage form.
-   **Detailed Breakdown**: Shows a step-by-step breakdown of the entire calculation process.
-   **Important Clinical Notes**: Provides relevant clinical warnings and considerations for certain opioids like Methadone and Fentanyl.

## Tech Stack

-   **Frontend**: Vanilla JavaScript, HTML, CSS
-   **Styling**: Bootstrap 5

## Usage

To use the calculator, simply open the `index.html` file in any modern web browser.

Alternatively, you can host the entire folder on a static web hosting service like GitHub Pages or Netlify.

```bash
uv run pytest
```

## Important Note on Conversion Factors

The equianalgesic conversion factors used in this application are hard-coded in `app/services/conversion_service.py`. These are based on standard clinical guidelines, but **it is crucial to review and verify them against your institution's protocols or the most current pharmacological resources.** 