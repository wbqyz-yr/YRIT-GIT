#!/usr/bin/env python3
"""
Append files to an existing APK (zip) archive in place, preserving the
entries that are already there. Used because a plain `zip` CLI is not
guaranteed to be present.

Usage:
  python3 apk-add.py APK FILE=ARCNAME [FILE=ARCNAME ...]

If FILE is a directory, it is added recursively under ARCNAME/.
"""
import os
import sys
import zipfile


def collect(arg):
    src, arc = arg.split("=", 1)
    if os.path.isdir(src):
        for root, _dirs, files in os.walk(src):
            for fn in files:
                full = os.path.join(root, fn)
                rel = os.path.relpath(full, src).replace(os.sep, "/")
                yield full, arc.rstrip("/") + "/" + rel
    else:
        yield src, arc


def main():
    if len(sys.argv) < 3:
        sys.exit("usage: apk-add.py APK FILE=ARCNAME [...]")

    apk = sys.argv[1]
    additions = []
    for arg in sys.argv[2:]:
        additions.extend(collect(arg))

    tmp = apk + ".tmp"
    with zipfile.ZipFile(apk, "r") as zin, \
            zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            zout.writestr(item, zin.read(item.filename))
        for src, arc in additions:
            zout.write(src, arc)

    os.replace(tmp, apk)
    print(f"apk-add: added {len(additions)} entries to {apk}")


if __name__ == "__main__":
    main()
