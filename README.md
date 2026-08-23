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

## Running with Docker

The app is a static site (no backend), so the Docker image builds it with Vite and serves the output with nginx.

Build and run directly:

```bash
docker build -t screen-pricing-app .
docker run -p 8080:80 screen-pricing-app
```

Or with Docker Compose:

```bash
docker compose up -d --build
```

Then open **http://localhost:8080**.

To host it online, deploy the image to any container host (Fly.io, Render, a VPS, ECS, Cloud Run, etc.) and point it at port `80` inside the container.
