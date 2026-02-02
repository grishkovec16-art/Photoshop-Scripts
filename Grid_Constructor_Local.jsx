#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Создайте пустой документ!");
        return;
    }

    // Получаем ID от панели (по умолчанию vignette_8)
    var presetId = (typeof selectedPreset !== 'undefined') ? selectedPreset : "vignette_8";
    var doc = app.activeDocument;
    
    // БАЗА ШАБЛОНОВ
    var library = {
        "vignette_8": { total: 8, cols: 4, teacher: "none", tScale: 1.0 },
        "vignette_24_teach_center": { total: 24, cols: 6, teacher: "center", tScale: 1.4 },
        "vignette_30_classic": { total: 30, cols: 5, teacher: "none", tScale: 1.0 }
    };

    var cfg = library[presetId];
    if (!cfg) { alert("Макет не найден."); return; }

    doc.suspendHistory("Строим макет: " + presetId, "drawVignette(doc, cfg)");
}

function drawVignette(doc, cfg) {
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    var margin = w * 0.08; 
    var curY = margin;

    // Отрисовка учителя
    if (cfg.teacher === "center") {
        var tW = (w / cfg.cols) * cfg.tScale;
        var tH = tW * 1.35;
        createBox(doc, "Учитель_1", "Учитель_Имя_1", (w/2-tW/2), curY, tW, tH, true);
        curY += tH + (h * 0.08);
    }

    // Отрисовка учеников
    var cellW = (w - margin * 2) / cfg.cols;
    var boxW = cellW * 0.82;
    var boxH = boxW * 1.35;

    for (var i = 0; i < cfg.total; i++) {
        var r = Math.floor(i / cfg.cols);
        var c = i % cfg.cols;
        var x = margin + (c * cellW) + (cellW - boxW) / 2;
        var y = curY + (r * (boxH * 1.45));
        createBox(doc, "Фото_" + (i + 1), "Имя_" + (i + 1), x, y, boxW, boxH, false);
    }
}

function createBox(doc, bName, tName, x, y, w, h, isT) {
    var g = doc.layerSets.add();
    g.name = isT ? "УЧИТЕЛЬ" : "Ученик_" + bName.split('_')[1];
    
    var s = g.artLayers.add();
    s.name = bName;
    doc.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    var color = new SolidColor(); color.rgb.hex = "000000";
    doc.selection.fill(color);
    doc.selection.deselect();

    var txt = g.artLayers.add();
    txt.kind = LayerKind.TEXT;
    txt.name = tName;
    var ti = txt.textItem;
    ti.contents = isT ? "КЛАССНЫЙ РУКОВОДИТЕЛЬ" : "ФАМИЛИЯ ИМЯ";
    ti.size = h * 0.11;
    ti.justification = Justification.CENTER;
    ti.position = [x + w / 2, y + h + (ti.size * 1.6)];
}

main();