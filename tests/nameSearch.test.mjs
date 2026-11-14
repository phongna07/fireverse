import assert from "node:assert/strict";
import test from "node:test";
import {
  indexName,
  matchesName,
  normalizeName,
} from "../src/shared/nameSearch.ts";

const matches = (name, query) =>
  matchesName(indexName(name), normalizeName(query));

test("Vietnamese accents, đ, case, and Unicode composition", () => {
  assert.ok(matches("Đặng Phong Nguyễn", "DANG phong nguyen"));
  assert.ok(matches("Dang Phong Nguyen", "đặng"));
  assert.ok(matches("Đặng Phong Nguyễn".normalize("NFD"), "nguyễn"));
});

test("initials with optional spaces, punctuation, and omitted middle names", () => {
  for (const query of ["PN", "pn", "P N", "P.N."]) {
    assert.ok(matches("Phong Nguyen", query), query);
    assert.ok(matches("Phong Văn Nguyễn", query), query);
  }
  assert.ok(matches("Đặng Phong Nguyễn", "ĐPN"));
  assert.ok(matches("Đặng Phong Nguyễn", "dpn"));
  assert.equal(matches("Phong Nguyen", "NP"), false);
});

test("partial names, reordered words, joined names, and extra whitespace", () => {
  for (const query of [
    "phong",
    "nguy",
    "nguyen phong",
    "PhongNguyen",
    "  PHONG   NGUYEN ",
  ]) {
    assert.ok(matches("Phong Nguyen", query), query);
  }
  assert.ok(matches("Jean-Luc O’Neill", "jean luc o neill"));
});

test("empty and missing names and unrelated queries", () => {
  assert.ok(matches("Phong Nguyen", "  "));
  assert.ok(matches(null, ""));
  assert.equal(matches(null, "PN"), false);
  assert.equal(matches("Phong Nguyen", "James"), false);
  assert.equal(matches("Phong Nguyen", "PPN"), false);
  assert.equal(matches("Phong Nguyen", "phong walker"), false);
});
