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
- 1:1 audio and video calls in the browser (WebRTC, signaling through Firestore)

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

## Audio and video calls

1:1 calls use WebRTC for media, which goes directly between the two browsers. Firestore only carries signaling (offer, answer and ICE candidates) and the call lifecycle. No server code or paid Firebase plan is needed.

How it works:

- `calls/{callId}` holds one call (`ringing` → `accepted` → `ended`/`declined`/`missed`/`cancelled`/`busy`/`failed`). ICE candidates go to its `callerCandidates` and `calleeCandidates` subcollections.
- `conversations/{id}.activeCall` allows one call per conversation at a time. This also handles two people calling each other at the same moment.
- With no backend, clients enforce timeouts. A call rings for 30 seconds. Active calls refresh `expiresAt`, and a call past it counts as abandoned.
- A WebRTC data channel carries hang-up and mute/camera state between the two peers. When one side closes its tab, the other side notices within seconds.
- When a call ends, a `call` message is written to the conversation (missed call, duration). Its id is the call id, so a call is logged once even if both sides end it.
- Incoming calls ring in every open FireVerse tab. The first tab to answer wins, and the user's other tabs stop ringing. Nothing rings while no FireVerse tab is open.

### NAT traversal

By default, only Google's public STUN servers are used. This works on most home and office networks. Some networks (strict corporate firewalls, some mobile carriers) block direct connections, and the call then ends with "Couldn't connect". To fix that later, add a TURN server through `VITE_ICE_SERVERS` (see `.env.example`). No code changes are needed.

### Firestore rules

The project's security rules are in [`firestore.rules`](./firestore.rules). They cover users, conversations, messages and calls. Paste the file's contents into the Firebase console (**Firestore → Rules**) and publish, or deploy it with the Firebase CLI. Rules are OR'd, so don't keep a catch-all `match /{document=**}` rule alongside them: it would override them.

The incoming-call listener queries `calls` by `participants` (array-contains) and `status`. If Firestore asks for a composite index, open the link in the browser console error to create it.

## Previews

![Preview 1](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-1_yujhpl.png)
![Preview 2](https://res.cloudinary.com/naptest/image/upload/v1644039987/fireverse/preview-2_qlxjjf.png)
![Preview 3](https://res.cloudinary.com/naptest/image/upload/v1644039986/fireverse/preview-3_tgqahb.png)

## Summary

👉 If you like this project, give it a star ✨ and share 👨🏻‍💻 it to your friends 👈
