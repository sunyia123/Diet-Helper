# Pixel food assets

Integrated 2026-09-07. These assets supplement, not replace, OpenMoji and legacy food IDs.

- 84 original 64×64 PNGs: CaioMarcelPixel, https://caiomarcelpixel.itch.io/free-pixel-ingredients-pack . See `caio/LICENSE.txt`. Permits commercial use, modification and distribution within a larger project; prohibits standalone redistribution/repackaging. No asset-file export or tracing from this pack is exposed in the drawing editor. JSON stores icon IDs only.
- 35 original 32×32 PNGs: Darina Grant, https://darinagrant.itch.io/pixel-art-food-icon-pack-32x32 . Author page explicitly permits use and editing in commercial projects. Included original note is `darina/README-author.txt`. One non-UTF8 archive filename was visually identified as fries and given a safe local filename; artwork is unchanged.
- UI: Pixelarticons 2.4.1, https://github.com/halfmage/pixelarticons , MIT; 29 selected SVGs and the original license in `../../pixel-ui/`.

Reproduce food acquisition with `scripts/fetch-pixel-food-packs.ps1`, then run `scripts/build-pixel-icons.mjs`. Original archives, extracted sources and SHA256 checksums are retained in `data/icon-sources/`; they are not deployed as a downloadable asset pack.

The user drawing canvas starts blank, uses the app's fixed `shiyouji32-v1` palette, and stores editable pixels. It does not copy either artist's assets. Drawing palette colors do not change when switching application themes.
