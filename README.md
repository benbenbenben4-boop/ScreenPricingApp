# Screen Pricing App

An LED screen configuration and quoting tool. Build screen layouts, configure panels and rigging, and generate cost breakdowns — all stored locally in your browser.

## Requirements

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

## Setup

Install dependencies once after cloning:

```bash
npm install
```

## Starting the app

```bash
npm run dev
```

Vite will print two URLs — open either in your browser:

- **http://localhost:5173** — on this machine
- **http://&lt;your-ip&gt;:5173** — from any device on the same network

The app runs with hot-reload — any changes you make to the code are reflected instantly without restarting.

## Stopping the app

In the terminal where the app is running, press **Ctrl + C**.

## Building for production

To create an optimised production build:

```bash
npm run build
```

Output goes to the `dist/` folder. To preview the production build locally:

```bash
npm run preview
```

Then open **http://localhost:4173**

## Data storage

All project data is saved to your browser's **localStorage**. No server or database is required. Data persists between sessions but is tied to the browser — clearing site data will remove all projects.
