const WIDTH = 1080;
const PADDING = 64;
const COLUMN_GAP = 48;
const MAX_COLUMN_HEIGHT = 1700;
const FONT_FAMILY = "Inter, system-ui, sans-serif";
const COLORS = { background: "#ffffff", text: "#101828", section: "#4f57c6", box: "#98a2b3", divider: "#e4e7ec" };

export function parseList(text) {
  return String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^([-*•]|\[ ?\]|☐)\s*/, "").trim())
    .filter(Boolean)
    .map((line) => (line.endsWith(":") && line.length > 1
      ? { type: "section", text: line.slice(0, -1).trim() }
      : { type: "item", text: line }));
}

export function toWhatsAppText(title, entries) {
  const lines = [];
  if (title.trim()) lines.push(`*${title.trim()}*`, "");
  entries.forEach((entry, index) => {
    if (entry.type === "section") {
      if (index > 0) lines.push("");
      lines.push(`*${entry.text}*`);
    } else {
      lines.push(`☐ ${entry.text}`);
    }
  });
  return lines.join("\n");
}

export function getFileName(title) {
  const slug = title.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "lista";
}

function getSizes(columns) {
  const scale = columns === 2 ? 0.8 : 1;
  const item = Math.round(42 * scale);
  const section = Math.round(36 * scale);
  return {
    title: 56,
    titleLine: 70,
    item,
    itemLine: Math.round(item * 1.3),
    itemGap: Math.round(16 * scale),
    box: Math.round(item * 0.8),
    boxGap: Math.round(20 * scale),
    section,
    sectionLine: Math.round(section * 1.3),
    sectionGap: Math.round(28 * scale),
  };
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let current = "";
  text.split(/\s+/).forEach((word) => {
    let rest = word;
    while (ctx.measureText(rest).width > maxWidth && rest.length > 1) {
      let size = rest.length - 1;
      while (size > 1 && ctx.measureText(rest.slice(0, size)).width > maxWidth) size -= 1;
      if (current) lines.push(current);
      lines.push(rest.slice(0, size));
      current = "";
      rest = rest.slice(size);
    }
    const candidate = current ? `${current} ${rest}` : rest;
    if (current && ctx.measureText(candidate).width > maxWidth) {
      lines.push(current);
      current = rest;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function measureBlocks(ctx, entries, sizes, columnWidth) {
  return entries.map((entry) => {
    if (entry.type === "section") {
      ctx.font = `700 ${sizes.section}px ${FONT_FAMILY}`;
      const lines = wrapText(ctx, entry.text.toUpperCase(), columnWidth);
      return { ...entry, lines, height: lines.length * sizes.sectionLine + sizes.itemGap };
    }
    ctx.font = `400 ${sizes.item}px ${FONT_FAMILY}`;
    const lines = wrapText(ctx, entry.text, columnWidth - sizes.box - sizes.boxGap);
    return { ...entry, lines, height: lines.length * sizes.itemLine + sizes.itemGap };
  });
}

function paginate(blocks, columns, sizes) {
  const pages = [];
  let page = [[]];
  let y = 0;
  let section = null;
  blocks.forEach((block, index) => {
    const gap = block.type === "section" && y > 0 ? sizes.sectionGap : 0;
    const next = block.type === "section" ? blocks[index + 1]?.height ?? 0 : 0;
    if (y > 0 && y + gap + block.height + next > MAX_COLUMN_HEIGHT) {
      if (page.length < columns) {
        page.push([]);
      } else {
        pages.push(page);
        page = [[]];
      }
      y = 0;
      if (block.type === "item" && section) {
        page[page.length - 1].push({ ...section, y: 0 });
        y = section.height;
      }
    }
    if (block.type === "section") section = block;
    const top = y + (y > 0 && block.type === "section" ? sizes.sectionGap : 0);
    page[page.length - 1].push({ ...block, y: top });
    y = top + block.height;
  });
  pages.push(page);
  return pages;
}

function drawCheckbox(ctx, x, y, size) {
  const radius = size * 0.18;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.box;
  ctx.stroke();
}

function toBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("blob"))), "image/png");
  });
}

export async function renderListImages(title, entries, columns) {
  const sizes = getSizes(columns);
  await Promise.all([
    document.fonts.load(`700 ${sizes.title}px Inter`),
    document.fonts.load(`400 ${sizes.item}px Inter`),
  ]);

  const measureCtx = document.createElement("canvas").getContext("2d");
  const columnWidth = (WIDTH - PADDING * 2 - COLUMN_GAP * (columns - 1)) / columns;
  const pages = paginate(measureBlocks(measureCtx, entries, sizes, columnWidth), columns, sizes);
  const headerText = title.trim() || (pages.length > 1 ? "Lista" : "");

  return Promise.all(pages.map((page, pageIndex) => {
    const pageTitle = pages.length > 1 ? `${headerText} (${pageIndex + 1}/${pages.length})` : headerText;
    measureCtx.font = `700 ${sizes.title}px ${FONT_FAMILY}`;
    const titleLines = pageTitle ? wrapText(measureCtx, pageTitle, WIDTH - PADDING * 2) : [];
    const headerHeight = titleLines.length ? titleLines.length * sizes.titleLine + 40 : 0;
    const contentHeight = Math.max(...page.map((column) => {
      const last = column[column.length - 1];
      return last ? last.y + last.height : 0;
    }));

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = Math.ceil(PADDING * 2 + headerHeight + contentHeight - sizes.itemGap);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = "top";

    if (titleLines.length) {
      ctx.font = `700 ${sizes.title}px ${FONT_FAMILY}`;
      ctx.fillStyle = COLORS.text;
      titleLines.forEach((line, index) => ctx.fillText(line, PADDING, PADDING + index * sizes.titleLine));
      ctx.fillStyle = COLORS.divider;
      ctx.fillRect(PADDING, PADDING + headerHeight - 22, WIDTH - PADDING * 2, 3);
    }

    page.forEach((column, columnIndex) => {
      const x = PADDING + columnIndex * (columnWidth + COLUMN_GAP);
      column.forEach((block) => {
        const top = PADDING + headerHeight + block.y;
        if (block.type === "section") {
          ctx.font = `700 ${sizes.section}px ${FONT_FAMILY}`;
          ctx.fillStyle = COLORS.section;
          block.lines.forEach((line, index) => ctx.fillText(line, x, top + index * sizes.sectionLine));
          return;
        }
        drawCheckbox(ctx, x, top + (sizes.itemLine - sizes.box) / 2, sizes.box);
        ctx.font = `400 ${sizes.item}px ${FONT_FAMILY}`;
        ctx.fillStyle = COLORS.text;
        block.lines.forEach((line, index) => ctx.fillText(line, x + sizes.box + sizes.boxGap, top + (sizes.itemLine - sizes.item) / 2 + index * sizes.itemLine));
      });
    });

    return toBlob(canvas);
  }));
}
