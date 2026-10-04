import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

test("tap updater uses published checksums, preserves Burr, and rejects bad releases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "possible-tap-test-"));
  const fixture = join(directory, "fixture");
  await mkdir(fixture); await mkdir(join(directory, "Formula"));
  const burr = join(directory, "Formula/burr.rb");
  await writeFile(burr, "Burr fixture\n");
  const names = ["darwin-arm64", "darwin-x64", "linux-arm64", "linux-x64"].map(platform => `possible-v0.5.1-${platform}.tar.gz`);
  const release = { tag_name: "v0.5.1", assets: [{ name: "SHA256SUMS" }, ...names.map(name => ({ name }))] };
  await writeFile(join(fixture, "release.json"), JSON.stringify(release));
  const valid = names.map((name, index) => `${String(index + 1).repeat(64)}  ${name}`).join("\n") + "\n";
  await writeFile(join(fixture, "SHA256SUMS"), valid);
  const run = () => execFileSync(process.execPath, [fileURLToPath(new URL("update-possible.mjs", import.meta.url)), "--fixture", fixture], { cwd: directory, encoding: "utf8", stdio: "pipe" });
  try {
    assert.match(run(), /Updated Possible to 0.5.1/);
    const before = await readFile(join(directory, "Formula/possible.rb"), "utf8");
    for (const name of names) assert.ok(before.includes(name));
    assert.ok(before.includes('sha256 "' + "4".repeat(64) + '"'));
    assert.match(run(), /is current/);
    for (const bad of [valid.split("\n").slice(1).join("\n"), valid + valid.split("\n")[0] + "\n", valid.replace("1".repeat(64), "oops")]) {
      await writeFile(join(fixture, "SHA256SUMS"), bad);
      assert.throws(run);
      assert.equal(await readFile(join(directory, "Formula/possible.rb"), "utf8"), before);
    }
    await writeFile(join(fixture, "SHA256SUMS"), valid.replace("1".repeat(64), "a".repeat(64)));
    assert.throws(run, /Published checksums changed/);
    await writeFile(join(fixture, "release.json"), JSON.stringify({ ...release, tag_name: "v0.4.0" }));
    assert.match(run(), /is newer/);
    assert.equal(await readFile(burr, "utf8"), "Burr fixture\n");
  } finally { await rm(directory, { recursive: true, force: true }); }
});
