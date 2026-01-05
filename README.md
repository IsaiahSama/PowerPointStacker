# PowerPoint Stacker

PowerPoint Stacker (PP Stacker) is a desktop application built with Electron that simplifies presenting multiple PowerPoint presentations consecutively. It allows users to preload and order a series of presentations and seamlessly transition between them.

## The Problem

When presenting multiple slide decks, presenters often have to interrupt their flow to find and open the next file. This can look unprofessional and waste time. PP Stacker solves this by creating a single, continuous presentation experience from multiple files.

## Features

*   **Load Multiple Presentations:** Add a series of `.pptx` or `.odp` files to your presentation queue.
*   **Organize Your Flow:** Easily add, remove, and reorder presentations in the list.
*   **Seamless Presenting:** Enter a fullscreen presentation mode where you can navigate through all your slide decks as if they were one.
*   **Intuitive Navigation:** Use arrow keys or on-screen buttons to move between slides.
*   **Presentation Hotkeys:** Use `Ctrl+PageUp` to jump to the next presentation and `Ctrl+PageDown` to return to the previous one.
*   **Clean Finish:** After the last slide of the final presentation, you can choose to return to the setup screen or close the application.

## Requirements

To run this application, you will need:
*   **LibreOffice:** This is essential for converting presentation files. Please ensure it is installed on your system.
*   **Node.js:** Required for development and running the project from source.

## Getting Started

To run the application locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/IsaiahSama/PowerPointStacker
    cd PowerPointStacker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```

## Building the Application

To create a distributable package for your operating system, run:

```bash
npm run make
```

This will generate an installer in the `out` directory.
