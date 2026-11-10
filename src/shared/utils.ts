import dayjs from "dayjs";

const kebabCase = (value: string) =>
  (value.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]+|[0-9]+/g) || [])
    .map((word) => word.toLowerCase())
    .join("-");

export const formatFileName = (name: string) => {
  const splitted = name.split(".");

  const extension = splitted.slice(-1)[0];
  const baseName = splitted.slice(0, -1).join(".");

  return `${Date.now()}-${kebabCase(
    baseName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
  )}.${extension}`;
};

export const formatFileSize = (size: number) => {
  let i = Math.floor(Math.log(size) / Math.log(1024));

  return `${(size / Math.pow(1024, i)).toFixed(1)} ${
    ["B", "KB", "MB", "GB", "TB"][i]
  }`;
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

export const splitLinkFromMessage = (message: string) => {
  const URL_REGEX =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_\+.~#?&\/\/=]*)/gm;

  const result = message.split(" ").reduce((acc, item) => {
    const isURL = URL_REGEX.test(item);
    if (isURL) acc.push({ link: item });
    else {
      if (typeof acc.slice(-1)[0] === "string") {
        acc = [...acc.slice(0, -1), `${acc.slice(-1)[0]} ${item}`];
      } else {
        acc.push(item);
      }
    }

    return acc;
  }, [] as ({ link: string } | string)[]);

  return result;
};
