import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const projectRoot = process.cwd();
const imagesRoot = path.join(projectRoot, "IMAGENES");
const refExtensions = new Set([".html", ".js", ".css"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const smallFileThreshold = 50 * 1024;
const pngOptimizeThreshold = 200 * 1024;
const minSavingsRatio = 0.2;
const maxWidth = 1920;
const webpQuality = 82;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(fullPath);
      return fullPath;
    }),
  );
  return files.flat();
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function collectReferenceFiles(rootDir) {
  const allFiles = await walk(rootDir);
  return allFiles.filter((filePath) => refExtensions.has(path.extname(filePath).toLowerCase()));
}

async function collectImageFiles(rootDir) {
  const allFiles = await walk(rootDir);
  return allFiles.filter((filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()));
}

async function directorySize(rootDir) {
  const allFiles = await walk(rootDir);
  let total = 0;
  for (const filePath of allFiles) {
    const stat = await fs.stat(filePath);
    total += stat.size;
  }
  return total;
}

function formatBytes(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

async function updateReferences(referenceFiles, oldRef, newRef, modifiedFiles) {
  const escapedOldRef = oldRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(escapedOldRef, "g");
  let replaced = false;

  for (const filePath of referenceFiles) {
    const original = await fs.readFile(filePath, "utf8");
    if (!matcher.test(original)) continue;
    const updated = original.replace(matcher, newRef);
    if (updated !== original) {
      await fs.writeFile(filePath, updated, "utf8");
      modifiedFiles.add(path.relative(projectRoot, filePath));
      replaced = true;
    }
  }

  return replaced;
}

async function gatherReferenceMatches(referenceFiles, targetRef) {
  const escaped = targetRef.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = new RegExp(escaped, "g");
  const matches = [];

  for (const filePath of referenceFiles) {
    const content = await fs.readFile(filePath, "utf8");
    if (matcher.test(content)) matches.push(path.relative(projectRoot, filePath));
  }

  return matches;
}

async function main() {
    const beforeSize = await directorySize(imagesRoot);
    const referenceFiles = await collectReferenceFiles(projectRoot);
    const imageFiles = await collectImageFiles(imagesRoot);

  const processed = [];
  const skipped = [];
  const failures = [];
  const modifiedFiles = new Set();

  for (const imagePath of imageFiles) {
    const relPath = toPosix(path.relative(projectRoot, imagePath));
    const ext = path.extname(imagePath).toLowerCase();

    try {
      const stat = await fs.stat(imagePath);
      if (stat.size < smallFileThreshold) {
        skipped.push({ path: relPath, reason: "small-file-under-50KB" });
        continue;
      }

      const metadata = await sharp(imagePath).metadata();
      const width = metadata.width ?? 0;
      const resizeWidth = width > maxWidth ? maxWidth : null;
      const targetPath =
        ext === ".webp"
          ? imagePath
          : path.join(path.dirname(imagePath), `${path.basename(imagePath, ext)}.webp`);
      const newRelPath = toPosix(path.relative(projectRoot, targetPath));

      if (ext !== ".webp") {
        const refs = await gatherReferenceMatches(referenceFiles, relPath);
        if (refs.length === 0) {
          skipped.push({ path: relPath, reason: "no-local-html-js-css-reference" });
          continue;
        }
      }

      const transformer = sharp(imagePath);
      if (resizeWidth) transformer.resize({ width: resizeWidth, withoutEnlargement: true });

      const tempPath = `${targetPath}.tmp`;
      await transformer.webp({ quality: webpQuality }).toFile(tempPath);

      if (ext === ".webp") {
        await fs.rename(tempPath, imagePath);
      } else {
        const oldRelPath = relPath;
        const didReplace = await updateReferences(referenceFiles, oldRelPath, newRelPath, modifiedFiles);
        if (!didReplace) {
          await fs.rm(tempPath, { force: true });
          skipped.push({ path: relPath, reason: "failed-to-update-local-references" });
          continue;
        }

        if (await fileExists(targetPath)) await fs.rm(targetPath, { force: true });
        await fs.rename(tempPath, targetPath);
        await fs.rm(imagePath, { force: true });
      }

      const finalStat = await fs.stat(ext === ".webp" ? imagePath : targetPath);
      processed.push({
        original: relPath,
        final: ext === ".webp" ? relPath : newRelPath,
        before: stat.size,
        after: finalStat.size,
        resized: resizeWidth !== null,
      });
    } catch (error) {
      failures.push({ path: relPath, reason: error.message });
    }
  }

  const afterSize = await directorySize(imagesRoot);
  const remainingLarge = (await collectImageFiles(imagesRoot))
    .map(async (filePath) => {
      const stat = await fs.stat(filePath);
      return {
        path: toPosix(path.relative(projectRoot, filePath)),
        size: stat.size,
      };
    });

  const largeImages = (await Promise.all(remainingLarge))
    .filter((item) => item.size > 500 * 1024)
    .sort((a, b) => b.size - a.size);

  const report = {
    processedCount: processed.length,
    skippedCount: skipped.length,
    failureCount: failures.length,
    beforeSizeBytes: beforeSize,
    afterSizeBytes: afterSize,
    savingsBytes: beforeSize - afterSize,
    savingsPercent: beforeSize === 0 ? 0 : ((beforeSize - afterSize) / beforeSize) * 100,
    processed,
    skipped,
    failures,
    modifiedFiles: [...modifiedFiles].sort(),
    remainingLargeImages: largeImages,
  };

  const secondPassBeforeSize = afterSize;
  const pngProcessed = [];
  const pngSkipped = [];
  const pngFailures = [];

  const pngFiles = (await collectImageFiles(imagesRoot))
    .filter((filePath) => path.extname(filePath).toLowerCase() === ".png");

  for (const imagePath of pngFiles) {
    const relPath = toPosix(path.relative(projectRoot, imagePath));

    try {
      const beforeStat = await fs.stat(imagePath);
      if (beforeStat.size <= pngOptimizeThreshold) {
        pngSkipped.push({ path: relPath, reason: "under-200KB" });
        continue;
      }

      const beforeMeta = await sharp(imagePath).metadata();
      const resizeWidth = (beforeMeta.width ?? 0) > maxWidth ? maxWidth : null;
      const tempPath = `${imagePath}.pngopt`;

      let transformer = sharp(imagePath);
      if (resizeWidth) transformer = transformer.resize({ width: resizeWidth, withoutEnlargement: true });

      await transformer.png({
        compressionLevel: 9,
        palette: true,
        quality: 80,
        effort: 10,
      }).toFile(tempPath);

      const afterStat = await fs.stat(tempPath);
      const savingsRatio = beforeStat.size === 0 ? 0 : (beforeStat.size - afterStat.size) / beforeStat.size;

      if (savingsRatio < minSavingsRatio) {
        await fs.rm(tempPath, { force: true });
        pngSkipped.push({ path: relPath, reason: "savings-under-20%" });
        continue;
      }

      const afterMeta = await sharp(tempPath).metadata();
      const hadTransparency = Boolean(beforeMeta.hasAlpha);
      const hasTransparency = Boolean(afterMeta.hasAlpha);
      if (hadTransparency && !hasTransparency) {
        await fs.rm(tempPath, { force: true });
        pngFailures.push({ path: relPath, reason: "transparency-lost-restored" });
        continue;
      }

      await fs.rename(tempPath, imagePath);
      pngProcessed.push({
        path: relPath,
        before: beforeStat.size,
        after: afterStat.size,
        resized: resizeWidth !== null,
        hadTransparency,
      });
    } catch (error) {
      pngFailures.push({ path: relPath, reason: error.message });
    }
  }

  const secondPassAfterSize = await directorySize(imagesRoot);
  const postLargeImages = (await Promise.all(
    (await collectImageFiles(imagesRoot)).map(async (filePath) => {
      const stat = await fs.stat(filePath);
      return {
        path: toPosix(path.relative(projectRoot, filePath)),
        size: stat.size,
      };
    }),
  ))
    .filter((item) => item.size > 300 * 1024)
    .sort((a, b) => b.size - a.size);

  report.secondPass = {
    pngProcessedCount: pngProcessed.length,
    pngSkippedCount: pngSkipped.length,
    pngFailureCount: pngFailures.length,
    beforeSizeBytes: secondPassBeforeSize,
    afterSizeBytes: secondPassAfterSize,
    savingsBytes: secondPassBeforeSize - secondPassAfterSize,
    savingsPercent: secondPassBeforeSize === 0 ? 0 : ((secondPassBeforeSize - secondPassAfterSize) / secondPassBeforeSize) * 100,
    pngProcessed,
    pngSkipped,
    pngFailures,
    topSavings: [...pngProcessed]
      .sort((a, b) => (b.before - b.after) - (a.before - a.after))
      .slice(0, 5),
    remainingLargeImagesOver300KB: postLargeImages.slice(0, 5),
  };

  await fs.writeFile(
    path.join(projectRoot, "image-optimization-report.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );

  console.log(`Processed: ${processed.length}`);
  console.log(`Skipped: ${skipped.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Before: ${formatBytes(beforeSize)}`);
  console.log(`After: ${formatBytes(afterSize)}`);
  console.log(`Savings: ${formatBytes(beforeSize - afterSize)} (${report.savingsPercent.toFixed(2)}%)`);
  console.log(`Second pass PNG processed: ${pngProcessed.length}`);
  console.log(`Second pass PNG skipped: ${pngSkipped.length}`);
  console.log(`Second pass PNG failures: ${pngFailures.length}`);
  console.log(`Second pass before: ${formatBytes(secondPassBeforeSize)}`);
  console.log(`Second pass after: ${formatBytes(secondPassAfterSize)}`);
  console.log(`Second pass savings: ${formatBytes(secondPassBeforeSize - secondPassAfterSize)} (${report.secondPass.savingsPercent.toFixed(2)}%)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
