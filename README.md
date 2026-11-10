# FireVerse

A full-feature messenger clone built with React and Firebase

<p align="center">
  <img alt="Stars" src="https://badgen.net/github/stars/napthedev/fireverse">
  <img alt="Forks" src="https://badgen.net/github/forks/napthedev/fireverse">
  <img alt="Issues" src="https://badgen.net/github/issues/napthedev/fireverse">
  <img alt="Commits" src="https://badgen.net/github/commits/napthedev/fireverse">
</p>

## Live demo

Official Website: [https://fireverse.pages.dev](https://fireverse.pages.dev)

## Main technology used

- react 19, typescript, tailwind 4, vite
- tanstack router
- firebase (auth, firestore, storage)
- zustand
- emoji-mart

## Features

- Sign in with Google, Facebook
- Create conversations (personally, group)
- Allow sending
  - Text
  - Image
  - File
  - Stickers (from zalo)
  - Gif (from giphy)
  - Emoji (emoji-mart)
- Show if user has seen message
- Drop file to upload
- Paste image from clipboard
- Send reactions to message (like, love, care, haha, wow, sad, angry)
- Unsent message
- Reply message
- Change conversation settings
  - Change group theme, image
  - Change theme
- View conversation images, files
- Detect link an add an anchor to it

## Installation

- Clone the project
- Run `npm install`
- Create your own firebase project
  - Enable auth (google, facebook)
  - Enable cloud firestore
  - (Optional) Enable firebase storage, only needed if you turn uploads on
- Create your own giphy developer account
- Example .env file:

```env
VITE_FIREBASE_CONFIG={"apiKey":"","authDomain":"","projectId":"","storageBucket":"","messagingSenderId":"","appId":""}
VITE_GIPHY_API_KEY=your_api_key
# Optional: image/file upload needs Firebase Storage (Blaze plan). Off by default.
VITE_ENABLE_UPLOADS=false
```

- Run `npm run dev` to start the dev server, `npm run build` for a production build

## Previews

![Preview 1](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-1_yujhpl.png)
![Preview 2](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-2_qlxjjf.png)
![Preview 3](https://res.cloudinary.com/naptest/image/upload/v1644039986/fireverse/preview-3_tgqahb.png)

## Summary

👉 If you like this project, give it a star ✨ and share 👨🏻‍💻 it to your friends 👈
