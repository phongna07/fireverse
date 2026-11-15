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
- firebase (auth, firestore)
- cloudinary (image uploads)
- zustand
- emoji-mart

## Features

- Sign in with Google, Facebook
- Create conversations (personally, group)
- Allow sending
  - Text
  - Image
  - Stickers (from zalo)
  - Gif (from giphy)
  - Emoji (emoji-mart)
- Show if user has seen message
- Drop an image to upload (JPEG, PNG, WebP, GIF; max 2 MB)
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
- Use Node.js 24 LTS and run `npm install`
- Create your own firebase project
  - Enable auth (google, facebook)
  - Enable cloud firestore
- Create your own giphy developer account
- Example .env file:

```env
VITE_FIREBASE_CONFIG={"apiKey":"","authDomain":"","projectId":"","storageBucket":"","messagingSenderId":"","appId":""}
VITE_GIPHY_API_KEY=your_api_key
# Cloudinary unsigned image uploads (max 2 MB). No API secret in the frontend.
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

- Copy `.env.example` to `.env` and fill in your Firebase configuration and Giphy key.
- Run `npm run dev` to start the dev server, `npm run typecheck` to check TypeScript, and `npm run build` for a production build.
- Image uploads turn on automatically when both Cloudinary settings are filled in. See [Cloudinary setup](#cloudinary-setup). General file uploads are removed; existing file messages can still be viewed.
- Production hosting must serve `index.html` for application routes such as `/sign-in` and conversation URLs.
- See [MODERNIZATION.md](./MODERNIZATION.md) for validation and remaining manual checks.

## Cloudinary setup

This Vite app uploads directly to Cloudinary using an **unsigned upload preset**. You only need the **cloud name** and **preset name**, not an API key or API secret.

1. Create a free account at [Cloudinary](https://cloudinary.com/users/register/free), verify your email, and open the Console. Select the product environment you want to use.
2. Copy its **Cloud name** from the Dashboard. You can also find credentials under **Settings → API Keys**. Do not copy an API secret or a `CLOUDINARY_URL` into this app: all `VITE_` variables are public.
3. Open **Settings → Upload → Upload presets**, then **Add upload preset**. Name it, for example, `fireverse_images`, and set **Signing mode** to **Unsigned**.
4. Restrict **Allowed formats** to `jpg,jpeg,png,webp,gif`. Set an asset folder such as `fireverse` and use generated unique public IDs. Save the preset. It must belong to the same product environment as your cloud name.
5. Set these values in your existing `.env` (keep your Firebase and Giphy values):

   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=fireverse_images
   ```

6. Restart `npm run dev`. For production, set both variables in the hosting build environment and rebuild/redeploy. The old `VITE_ENABLE_UPLOADS` variable is no longer used.
7. Sign in and upload a small image using the image button, paste, or drag-and-drop. Try changing a group photo too. Non-images, empty files, and images larger than **2 MB (2,097,152 bytes)** are rejected before the app sends an upload request.

The 2 MB check is a **client-side limit**, not a quota/security boundary. Anyone who learns an unsigned preset can upload outside this app, and uploaded image URLs are public. Configure the format restriction in Cloudinary too, monitor usage, and disable the preset if abused. For restricted upload access, hard server-enforced size limits, or private chat media, use an authenticated backend to validate files and authorize uploads/delivery; keep API secrets there.

Official references: [Find credentials](https://cloudinary.com/documentation/developer_onboarding_faq_find_credentials), [manage upload presets](https://cloudinary.com/documentation/upload_presets), and [client-side uploads](https://cloudinary.com/documentation/client_side_uploading).

## Previews

![Preview 1](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-1_yujhpl.png)
![Preview 2](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-2_qlxjjf.png)
![Preview 3](https://res.cloudinary.com/naptest/image/upload/v1644039986/fireverse/preview-3_tgqahb.png)

## Summary

👉 If you like this project, give it a star ✨ and share 👨🏻‍💻 it to your friends 👈
