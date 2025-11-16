
<div align="center">
    <img src="assets/img/logo.png" width="200">
</div>

<h1 align="center">LiftIt</h1>

<div align="center">
   <p>Lightweight web application to configure and estimate a simracing setup (bundles, cockpits, seats and accessories).</p>
   <img src="https://m3-markdown-badges.vercel.app/stars/9/3/LoupesDEV/LiftIt">
   <img src="https://ziadoua.github.io/m3-Markdown-Badges/badges/HTML/html3.svg">
   <img src="https://ziadoua.github.io/m3-Markdown-Badges/badges/CSS/css3.svg">
   <img src="https://ziadoua.github.io/m3-Markdown-Badges/badges/Javascript/javascript3.svg">
   <img src="https://ziadoua.github.io/m3-Markdown-Badges/badges/JSON/json3.svg">
</div>

## Table of contents

- [Overview](#overview)
- [How to use](#how-to-use)
- [Features](#features)
- [Local demo](#local-demo)
- [Project structure](#project-structure)
- [Contributing](#contributing)

## Overview

LiftIt is a simple client-side interface to build a simracing configuration by selecting a bundle, a cockpit, a seat, and accessories. The app calculates the estimated total, persists the selection in the browser (`localStorage`), and provides a clear summary.

The interface is designed to run directly in the browser without any backend.

## How to use

1. Clone the repository:

```bash
git clone https://github.com/LoupesDEV/LiftIt.git
```

2. Open the application:

- With **VSCode**: right-click `index.html` → *Open with Live Server* (extension recommended).
- With **Python** (simple local server):

```bash
python -m http.server 8000
# then open http://localhost:8000
```

3. Browse the interface, select the desired items and check the summary in the right-hand panel.

## Features

- **Simple selection**: Choose a bundle, a cockpit, a seat and accessories.
- **Multiple accessory selection**: Add/remove multiple accessories.
- **Dynamic summary**: Instant preview of the selection (names and prices).
- **Total calculation**: Automatic sum of selected items.
- **Client-side persistence**: Save the configuration in `localStorage` for later.
- **Reset**: Button to reset the configuration to zero.
- **Product links**: Cards may include a link to the product page (opens in a new tab).

## Local demo

You can try the app [here](https://www.matheo-pichotmoise.fr/LiftIt).

<div align="center">
    <table>
        <tr>
            <td><img src="assets/img/welcome.png" alt="Welcome modal"/></td>
            <td><img src="assets/img/home.png" alt="Home page"/></td>
        </tr>
        <tr>
            <td><img src="assets/img/search.png" alt="Search example"/></td>
            <td><img src="assets/img/config.png" alt="Config summary"/></td>
        </tr>
    </table>
</div>

## Project structure

```
LiftIt
├─ assets/img/                # Folder containing media
├─ CODE_OF_CONDUCT.md     # Code of conduct for contributors
├─ CONTRIBUTING.md        # Contribution guide
├─ data.json              # Equipment data
├─ index.html             # Main application page
├─ LICENSE                # License file
├─ README.md              # Project documentation
├─ script.js              # Script file
└─ styles.css             # Styles file
```

## Contributors

Thanks to the people and resources that contributed to the project:

- [LoupesDEV](https://github.com/LoupesDEV) — Main development, design and maintenance.

Want to contribute? Check the [contribution guide](CONTRIBUTING.md) or open an *issue* to propose improvements.

<p align="center">
    <img alt="Footer" src="https://i.imgur.com/fnZRNIn.png">
    <br><br>
    <img src="https://ziadoua.github.io/m3-Markdown-Badges/badges/LicenceGPLv3/licencegplv33.svg">
</p>
