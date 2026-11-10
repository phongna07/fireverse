import { DEFAULT_AVATAR, IMAGE_PROXY } from "./constants";
import { FirestoreTimestamp, MessageData } from "./types";

import dayjs from "dayjs";

const kebabCase = (value: string) =>
  (
    value.match(
      /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g,
    ) || []
  )
    .map((word) => word.toLowerCase())
    .join("-");

export const formatFileName = (name: string) => {
  const splitted = name.split(".");

  const extension = splitted.slice(-1)[0];
  const baseName = splitted.slice(0, -1).join(".");

  return `${Date.now()}-${kebabCase(
    baseName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D"),
  )}.${extension}`;
};

export const getFileExtension = (name?: string) =>
  name?.split(".").slice(-1)[0] || "";

export const formatFileSize = (size?: number) => {
  if (!size || size <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  );

  return `${(size / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const formatter = dayjs(date);
  const now = new Date();

  if (dayjs().isSame(formatter, "date")) return formatter.format("h:mm A");

  if (dayjs().isSame(formatter, "week")) return formatter.format("ddd h:mm A");

  if (now.getFullYear() === date.getFullYear())
    return formatter.format("MMM DD h:mm A");

  return formatter.format("DD MMM YYYY h:mm A");
};

export const formatTimestamp = (timestamp?: FirestoreTimestamp | null) =>
  formatDate(timestamp?.seconds ? timestamp.seconds * 1000 : Date.now());

const URL_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/;

export const splitLinkFromMessage = (message: string) =>
  message.split(" ").reduce(
    (acc, item) => {
      const last = acc[acc.length - 1];

      if (URL_REGEX.test(item)) acc.push({ link: item });
      else if (typeof last === "string")
        acc[acc.length - 1] = `${last} ${item}`;
      else acc.push(item);

      return acc;
    },
    [] as ({ link: string } | string)[],
  );

// Short description of a message, used wherever a message is quoted
export const describeMessage = (
  message?: Pick<MessageData, "type" | "content"> | null,
) => {
  switch (message?.type) {
    case "text":
      return message.content;
    case "image":
      return "An image";
    case "file":
      return "A file";
    case "sticker":
      return "A sticker";
    default:
      return "Message has been removed";
  }
};

export const avatarUrl = (photoURL?: string | null) =>
  photoURL ? IMAGE_PROXY(photoURL) : DEFAULT_AVATAR;

export const getErrorCode = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";
