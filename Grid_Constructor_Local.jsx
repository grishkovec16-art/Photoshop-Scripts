#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Пожалуйста, сначала создайте документ!");
        return;
    }

    var presetId = (typeof selectedPreset !== 'undefined') ? selectedPreset : "vignette_8";
    
    var library = {
        "vignette_8": { total: 8, cols: 4, teacher: "none" },
        "vignette_24_teach_center": { total: 24, cols: 6, teacher: "center" },
        "vignette_30_classic": { total: 30, cols: 5, teacher: "none" }
    };

    var cfg = library[presetId];
    if (!cfg) return;

    app.activeDocument.suspendHistory("Генерация сетки", "drawGrid(app.activeDocument, cfg)");
}

function drawGrid(doc, cfg) {
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    var margin = w * 0.08; 
    var curY = margin;

    if (cfg.teacher === "center") {
        var tW = (w / cfg.cols) * 1.4;
        var tH = tW * 1.35;
        createLayerBox(doc, "Учитель_1", (w/2 - tW/2), curY, tW, tH);
        curY += tH + (h * 0.08);
    }

    var cellW = (w - margin * 2) / cfg.cols;
    var boxW = cellW * 0.85;
    var boxH = boxW * 1.35;

    for (var i = 0; i < cfg.total; i++) {
        var r = Math.floor(i / cfg.cols);
        var c = i % cfg.cols;
        createLayerBox(doc, "Фото_" + (i + 1), margin + (c * cellW) + (cellW - boxW) / 2, curY + (r * (boxH * 1.45)), boxW, boxH);
    }
}

function createLayerBox(doc, name, x, y, w, h) {
    var layer = doc.artLayers.add();
    layer.name = name;
    doc.selection.select([[x,y], [x+w,y], [x+w,y+h], [x,y+h]]);
    var color = new SolidColor(); color.rgb.hex = "CCCCCC";
    doc.selection.fill(color);
    doc.selection.deselect();
}

main();
