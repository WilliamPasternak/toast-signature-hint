# Signature Hint

An independent proof-of-concept exploring a proposed feature enhancement for Toast handheld POS: a handwriting animation on the signature line that shows guests where and how to sign.

> This is an unofficial, independently developed prototype. It is not affiliated with, endorsed by, or made by Toast, Inc. "Toast" and the Toast logo are trademarks of Toast, Inc.

## The Concept

At the end of a card payment on a handheld device, guests are presented with a tip and signature screen. Not everyone immediately recognizes that they're expected to sign. Guests may hesitate, hand the device back, or ask the server where to sign, creating unnecessary interruptions during service.

This concept introduces a short handwriting animation, inspired by the introductory "hello" screens on a new iPhone, that demonstrates the act of signing directly on the signature line.

By showing the motion rather than relying solely on written instructions, the animation communicates the expected action visually. As soon as the guest touches the signature area, the hint disappears and they can sign normally.

The goal is to create a more intuitive guest experience while reducing interruptions for staff.

## What the Prototype Demonstrates

A clickable, portrait-mode simulation of a handheld payment experience, presented in three steps:

1. **Tap to pay.** Click the card reader to simulate a card tap.
2. **Tip and sign.** The signature animation plays on the signature line and disappears when the guest interacts with it. Continue remains disabled until both a signature and tip selection are present. Tip options include 18%, 20%, and 22%, with 20% pre-selected, plus No Tip. Custom is a placeholder in this demo.
3. **Thank you.** The prototype concludes with a thank-you screen addressed to the Toast team, rather than continuing to a simulated receipt.

Use the **Signature Hint** switch above the device to disable the animation and compare the experience with the existing interaction. **Restart** returns the prototype to its initial state.

## Development & Attribution

This project originated from my own experience using hospitality technology and identifying an opportunity to improve an existing product's functionality and user experience.

The concept, feature requirements, user flow, and visual direction were developed independently. AI-assisted development tools were used to generate the prototype's code and visual implementation, with iterative human feedback guiding refinements to the functionality, presentation, and overall experience.

**My contributions included:**

- **Ideation:** Identifying the problem and developing the original feature concept, informed by nearly two decades of hospitality experience.
- **Product direction:** Defining the intended functionality, user flow, interaction requirements, and acceptance criteria.
- **Design direction:** Establishing the visual layout, device presentation, screen composition, and overall user experience.
- **Testing and iteration:** Reviewing the generated implementation, identifying shortcomings, and providing feedback to refine the animation, timing, layout, tip selections, instructions, and copy.

The implementation was primarily generated using AI development tools, working from my specifications and ongoing feedback.

This repository documents an independent product concept and AI-assisted prototyping exercise. The code is presented as a functional demonstration, not production-ready software. Testing has been limited to Chrome, and no formal accessibility review has been conducted.

## Technologies

- HTML
- CSS
- JavaScript

## Running Locally

Download or clone the repository and open `index.html` in your browser. No build process, dependencies, or installation required.

Roboto is loaded through Google Fonts, with a system font fallback.

## Credits & Licensing

- **Mrs Saint Delafield:** The signature on the thank-you screen uses the typeface's letterforms, © 2004 Alejandro Paul, licensed under the [SIL Open Font License 1.1](https://openfontlicense.org), converted to vector outlines.
- **Roboto:** UI typography uses Roboto, licensed under Apache License 2.0 and loaded through Google Fonts.