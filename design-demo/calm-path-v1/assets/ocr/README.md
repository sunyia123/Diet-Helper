# Local OCR resources

- `tesseract.min.js`, `worker.min.js`: tesseract.js 6.0.1 from the npm registry. Apache-2.0; see LICENSE-tesseract.txt.
- `core/*.wasm.js`: tesseract.js-core 6.1.2 from the npm registry. Apache-2.0; see LICENSE-core.txt. The four variants allow runtime CPU feature selection.
- `lang/*.traineddata`: `chi_sim` and `eng` from https://github.com/tesseract-ocr/tessdata_fast, fetched 2026-09-05. Apache-2.0; see LICENSE-tessdata.txt.

Resources are served from the app origin and loaded only when recognition starts. Images stay in browser memory. No cloud OCR, external model CDN or persistent model cache is used. No Harmony resources are included or changed in this Web preview.
