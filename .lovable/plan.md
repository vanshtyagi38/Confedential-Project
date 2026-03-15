

## Fix: Update `assetlinks.json` with Google Play Signing Fingerprint

The issue is confirmed. Your `assetlinks.json` currently only has the **upload key** fingerprint (`3E:3C:65:...`), but Google Play re-signs the app with the **app signing key** (`EA:8D:A8:...`). The installed app's certificate doesn't match, so TWA verification fails and it falls back to Chrome Custom Tab.

### Change

Update `public/.well-known/assetlinks.json` to include **both** fingerprints:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.singletape.app",
      "sha256_cert_fingerprints": [
        "EA:8D:A8:83:21:09:58:56:1C:4A:A7:16:3D:89:20:22:E2:04:0F:B7:58:7C:D8:39:16:94:18:E5:F6:3D:45:3A",
        "3E:3C:65:15:E2:37:24:9A:41:0B:80:D7:37:66:F4:E4:66:3B:5E:BA:0A:63:40:7F:69:1F:94:E3:50:D3:71:71"
      ]
    }
  }
]
```

- First fingerprint = **App signing key** (Google Play uses this for installed apps)
- Second fingerprint = **Upload key** (your local debug/upload builds)

After publishing, clear Chrome cache on your phone or wait for re-verification, then the app will open in standalone mode (no URL bar).

