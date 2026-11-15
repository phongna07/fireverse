import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_IMAGE_BYTES,
  validateImage,
  uploadCloudinaryImage,
} from "../src/shared/cloudinary.ts";

const image = (size = 10, type = "image/png") =>
  new File([new Uint8Array(size)], "photo.png", { type });

test("accept supported images up to exactly 2 MB", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/gif"])
    assert.doesNotThrow(() => validateImage(image(MAX_IMAGE_BYTES, type)));
});

test("reject empty, oversized, and unsupported files before any network call", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Must not upload");
  });
  for (const file of [
    image(0),
    image(MAX_IMAGE_BYTES + 1),
    image(10, "application/pdf"),
    image(10, "image/svg+xml"),
    image(10, ""),
  ])
    await assert.rejects(uploadCloudinaryImage(file, "test", "preset"));
  assert.equal(fetch.mock.callCount(), 0);
});

test("upload multipart image with unsigned preset and return HTTPS URL", async (t) => {
  const file = image();
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.cloudinary.com/v1_1/test/image/upload");
    assert.equal(options.method, "POST");
    assert.equal(options.body.get("upload_preset"), "preset");
    assert.equal(options.body.get("file"), file);
    assert.equal(options.body.has("api_secret"), false);
    return Response.json({
      resource_type: "image",
      secure_url: "https://res.cloudinary.com/test/image/upload/photo.png",
    });
  });
  assert.equal(
    await uploadCloudinaryImage(file, "test", "preset"),
    "https://res.cloudinary.com/test/image/upload/photo.png",
  );
});

test("surface provider rejection, network failure, and invalid responses", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch");
  fetch.mock.mockImplementation(
    async () => new Response("Bad preset", { status: 400 }),
  );
  await assert.rejects(
    uploadCloudinaryImage(image(), "test", "preset"),
    /rejected/,
  );
  fetch.mock.mockImplementation(async () => {
    throw new TypeError("offline");
  });
  await assert.rejects(
    uploadCloudinaryImage(image(), "test", "preset"),
    /connection/,
  );
  for (const result of [
    {},
    {
      resource_type: "image",
      secure_url: "http://res.cloudinary.com/photo.png",
    },
    { resource_type: "raw", secure_url: "https://res.cloudinary.com/file.pdf" },
  ]) {
    fetch.mock.mockImplementation(async () => Response.json(result));
    await assert.rejects(
      uploadCloudinaryImage(image(), "test", "preset"),
      /valid image URL/,
    );
  }
});
