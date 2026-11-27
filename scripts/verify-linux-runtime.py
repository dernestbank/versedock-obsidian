#!/usr/bin/env python3
"""Run the current candidate in an isolated Linux Node container.

Requires the existing official node:22-alpine image and Docker. No image pull,
host dependency install, personal-vault mount or native Obsidian claim is made.
Only explicit project inputs are mounted read-only. Container writes are temporary.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import time
import uuid

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / ".research/platform-linux"
IMAGE = "node:22-alpine"
FILES = ["package.json", "package-lock.json", "tsconfig.json", "vitest.config.mjs",
         "esbuild.config.mjs", "manifest.json", "versions.json", "styles.css",
         "README.md", "BRAND-GUIDELINES.md", "LICENSE", "main.js"]
DIRECTORIES = ["src", "tests", "scripts", "assets", "library"]
FIXTURES = [".research/modules/" + kind + ".sqlite" for kind in
            ["bible", "commentary", "dictionary", "book", "devotional", "graphics"]]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def inventory():
    entries = {}
    for name in FILES + DIRECTORIES + FIXTURES:
        source = ROOT / name
        assert source.exists(), "Missing explicit QA input: " + name
        assert source.resolve().is_relative_to(ROOT), "QA input leaves the project"
        paths = sorted(source.rglob("*")) if source.is_dir() else [source]
        for path in paths:
            assert not path.is_symlink(), "Unexpected symlink in QA inputs"
            if path.is_file():
                entries[path.relative_to(ROOT).as_posix()] = sha(path.read_bytes())
    return entries


PROGRAM = r"""
set -eu
mkdir -p /tmp/sworddock-linux-qa
cp -R /fixture/. /tmp/sworddock-linux-qa/
cd /tmp/sworddock-linux-qa
npm ci --ignore-scripts --no-fund --audit=false
node -p 'JSON.stringify({platform:process.platform,arch:process.arch,node:process.version})'
npm run check
node scripts/verify-local-imports.mjs
node scripts/verify-module-management.mjs
node scripts/verify-resource-storage.mjs
node --input-type=module <<'JS'
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
assert.equal(process.platform,'linux');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const built=readFileSync('main.js');
assert.equal(sha(built),sha(readFileSync('/fixture/main.js')),'Linux and host production bundles differ');
const read=name=>JSON.parse(readFileSync('.research/modules/'+name,'utf8'));
const local=read('local-import-report.json'),management=read('management-report.json'),storage=read('storage-report.json');
assert.equal(local.complete,true);assert.equal(local.offlineReopened,6);
assert.equal(management.complete,true);assert.equal(storage.complete,true);
console.log('SWORDDOCK_LINUX_RESULT '+JSON.stringify({
 platform:process.platform,arch:process.arch,kernel:os.release(),
 versions:{node:process.version,v8:process.versions.v8,uv:process.versions.uv,openssl:process.versions.openssl},
 productionBundle:{bytes:built.length,sha256:sha(built),matchesHost:true},
 localImports:local,moduleManagement:management,storageRecovery:storage,
 nativeObsidianVerified:false
}));
JS
"""


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    started = time.time()
    before = inventory()
    image_format = '{"id":{{json .Id}},"digests":{{json .RepoDigests}},"os":{{json .Os}},"arch":{{json .Architecture}}}'
    image = json.loads(subprocess.check_output(
        ["docker", "image", "inspect", IMAGE, "--format", image_format], text=True))
    assert image["os"] == "linux"
    name = "sworddock-linux-qa-" + uuid.uuid4().hex[:12]
    report = {"complete": False, "container": name, "image": image,
              "startedUnix": started, "inputFiles": len(before),
              "inputsSha256": sha(json.dumps(before, sort_keys=True).encode()),
              "cpus": 2, "memoryBytes": 2147483648,
              "nativeObsidianVerified": False}
    report_path = OUTPUT / "report.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    command = ["docker", "run", "--rm", "--pull=never", "--name", name,
               "--label", "org.sworddock.qa=linux-runtime", "--user", "1000:1000",
               "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges",
               "--cpus=2", "--memory=2g", "--network=bridge",
               "--tmpfs", "/tmp:rw,exec,size=1g,mode=1777",
               "--env", "NPM_CONFIG_CACHE=/tmp/npm-cache", "--env", "CI=1",
               "--workdir", "/tmp"]
    for path in FILES + DIRECTORIES + FIXTURES:
        command.extend(["--mount", "type=bind,source=" + str(ROOT / path) +
                        ",target=/fixture/" + path + ",readonly"])
    # Use the inspected immutable image ID, never a tag that can move mid-run.
    command.extend(["--entrypoint", "/bin/sh", image["id"], "-c", PROGRAM])
    print("Starting owned container", name, "with", image["id"], flush=True)
    with (OUTPUT / "runtime.log").open("w") as log:
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
    report["exitCode"] = result.returncode
    report["elapsedSeconds"] = round(time.time() - started, 3)
    report["inputsUnchanged"] = before == inventory()
    if result.returncode == 0:
        lines = (OUTPUT / "runtime.log").read_text().splitlines()
        outputs = [line.removeprefix("SWORDDOCK_LINUX_RESULT ") for line in lines
                   if line.startswith("SWORDDOCK_LINUX_RESULT ")]
        assert len(outputs) == 1, "Missing or ambiguous terminal runtime report"
        report["runtime"] = json.loads(outputs[0])
        report["complete"] = report["inputsUnchanged"]
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    assert report["complete"], "Linux QA failed; inspect .research/platform-linux/runtime.log"
    print("PASS: Linux checks and real-source import/management/storage verification; host inputs unchanged.")
    print("Native Linux Obsidian, graphical accessibility and slower-device acceptance remain open.")


if __name__ == "__main__":
    main()
