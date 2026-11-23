#!/usr/bin/env bash
#
# Build the Gomoku Android APK with a plain JDK + Android SDK (no Gradle).
#
# Requirements:
#   - JDK 8+ (JAVA_HOME or `java`/`javac` on PATH)
#   - Android SDK build-tools 34.0.0 and platforms;android-34 (ANDROID_HOME or
#     ANDROID_SDK_ROOT). The `aapt2`, `d8`, `zipalign` and `apksigner` binaries
#     come from build-tools; `android.jar` from the platform.
#
# Usage: ./build.sh   -> writes ./dist/gomoku-android.apk
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
if [ -z "$SDK" ]; then
  echo "error: set ANDROID_HOME (or ANDROID_SDK_ROOT) to your Android SDK" >&2
  exit 1
fi

PLATFORM="$SDK/platforms/android-34/android.jar"
BT="$SDK/build-tools/34.0.0"
for f in "$PLATFORM" "$BT/aapt2" "$BT/d8" "$BT/zipalign" "$BT/apksigner"; do
  [ -e "$f" ] || { echo "error: missing $f" >&2; exit 1; }
done

WORK="$ROOT/.build/apk-work"
DIST="$HERE/dist"
rm -rf "$WORK"
mkdir -p "$WORK" "$DIST"

KS="$ROOT/.build/keystore/gomoku-release.jks"
KS_PASS="gomoku123"
KS_ALIAS="gomoku"

# --- keystore (self-signed; keep it to ship updates) -----------------------
if [ ! -f "$KS" ]; then
  mkdir -p "$(dirname "$KS")"
  keytool -genkeypair -v \
    -keystore "$KS" \
    -storepass "$KS_PASS" \
    -keypass "$KS_PASS" \
    -alias "$KS_ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Gomoku, OU=YRIT, O=YRIT, L=City, ST=State, C=CN" \
    >/dev/null 2>&1
fi

# --- compile resources ------------------------------------------------------
"$BT/aapt2" compile --dir "$HERE/res" -o "$WORK/res.zip"
"$BT/aapt2" link \
  -o "$WORK/base.apk" \
  -I "$PLATFORM" \
  --manifest "$HERE/AndroidManifest.xml" \
  -R "$WORK/res.zip" \
  --java "$WORK/gen"

# --- compile Java -----------------------------------------------------------
mkdir -p "$WORK/classes"
find "$WORK/gen" "$HERE/src" -name '*.java' > "$WORK/sources.txt"
javac --release 8 -classpath "$PLATFORM" -d "$WORK/classes" @"$WORK/sources.txt"

# --- dex --------------------------------------------------------------------
mkdir -p "$WORK/dex"
"$BT/d8" --release --lib "$PLATFORM" --output "$WORK/dex" \
  $(find "$WORK/classes" -name '*.class')

# --- assemble ---------------------------------------------------------------
APK="$WORK/base.apk"
python3 "$HERE/tools/apk-add.py" "$APK" \
  "$WORK/dex/classes.dex=classes.dex" \
  "$HERE/assets=assets"

"$BT/zipalign" -f 4 "$APK" "$WORK/aligned.apk"
"$BT/apksigner" sign \
  --ks "$KS" --ks-pass "pass:$KS_PASS" --ks-key-alias "$KS_ALIAS" \
  --out "$DIST/gomoku-android.apk" "$WORK/aligned.apk"

# --- verify -----------------------------------------------------------------
"$BT/apksigner" verify --print-certs "$DIST/gomoku-android.apk" >/dev/null
"$BT/aapt2" dump badging "$DIST/gomoku-android.apk" | grep -E "^package|application-label:|launchable-activity"

echo "OK: $DIST/gomoku-android.apk"
