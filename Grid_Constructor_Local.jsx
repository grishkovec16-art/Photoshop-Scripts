#target photoshop

function main() {
    var library = {
        "vignette_8": { name: "8 Учеников (без уч.)", total: 8, cols: 4, teacher: "none", file: "vignette_8.jpg" },
        "vignette_24_teach_center": { name: "24 Уч. + Учитель Центр", total: 24, cols: 6, teacher: "center", file: "vignette_24_teach_center.jpg" },
        "vignette_30_classic": { name: "30 Учеников (5х6)", total: 30, cols: 5, teacher: "none", file: "vignette_30_classic.jpg" }
    };

    // Окно диалога
    var dlg = new Window("dialog", "Конструктор Виньеток PRO");
    dlg.orientation = "column";
    dlg.alignChildren = "fill";

    // Блок выбора
    var pSelect = dlg.add("panel", undefined, "Выберите макет");
    pSelect.orientation = "row";
    var drop = pSelect.add("dropdownlist", undefined);
    for (var key in library) { drop.add("item", library[key].name); }
    drop.selection = 0;

    // Блок превью (Путь к папке assets/previews относительно папки плагина)
    var imgPanel = dlg.add("panel", undefined, "Превью");
    var previewImg = imgPanel.add("image", [0, 0, 200, 150]); 
    
    // Функция обновления превью
    function updatePreview() {
        var selectedKey = getSelectedKey(drop.selection.text, library);
        var imgPath = Folder(app.path).parent + "/Common Files/Adobe/CEP/extensions/com.vignette.cloud/assets/previews/" + library[selectedKey].file;
        var f = new File(imgPath);
        if (f.exists) { previewImg.image = f; }
    }
    
    drop.onChange = updatePreview;
    updatePreview(); // Показать первое при открытии

    // Кнопки
    var btnGroup = dlg.add("group");
    btnGroup.alignment = "center";
    var btnOk = btnGroup.add("button", undefined, "ГЕНЕРИРОВАТЬ", {name: "ok"});
    var btnCancel = btnGroup.add("button", undefined, "ОТМЕНА", {name: "cancel"});

    if (dlg.show() == 1) {
        var finalKey = getSelectedKey(drop.selection.text, library);
        executeGrid(library[finalKey]);
    }
}

function getSelectedKey(name, lib) {
    for (var k in lib) { if (lib[k].name === name) return k; }
    return null;
}

function executeGrid(cfg) {
    if (app.documents.length === 0) { alert("Сначала создайте документ!"); return; }
    var doc = app.activeDocument;
    doc.suspendHistory("Создание " + cfg.name, "drawProcess(doc, cfg)");
}

function drawProcess(doc, cfg) {
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    var margin = w * 0.08; 
    var curY = margin;

    if (cfg.teacher === "center") {
        var tW = (w / cfg.cols) * 1.4;
        var tH = tW * 1.35;
        drawBox(doc, "Учитель_1", "Учитель", (w/2-tW/2), curY, tW, tH, true);
        curY += tH + (h * 0.08);
    }

    var cellW = (w - margin * 2) / cfg.cols;
    var boxW = cellW * 0.82;
    var boxH = boxW * 1.35;

    for (var i = 0; i < cfg.total; i++) {
        var r = Math.floor(i / cfg.cols);
        var c = i % cfg.cols;
        drawBox(doc, "Фото_" + (i+1), "Имя_" + (i+1), margin + (c * cellW) + (cellW - boxW)/2, curY + (r * (boxH * 1.45)), boxW, boxH, false);
    }
}

function drawBox(doc, bName, tName, x, y, w, h, isT) {
    var g = doc.layerSets.add();
    g.name = isT ? "УЧИТЕЛЬ" : "Ученик_" + bName.split('_')[1];
    var s = g.artLayers.add(); s.name = bName;
    doc.selection.select([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
    var c = new SolidColor(); c.rgb.hex = "000000"; doc.selection.fill(c);
    doc.selection.deselect();
    var txt = g.artLayers.add(); txt.kind = LayerKind.TEXT;
    var ti = txt.textItem; ti.contents = isT ? "УЧИТЕЛЬ" : "ИМЯ ФАМИЛИЯ";
    ti.size = h * 0.11; ti.justification = Justification.CENTER;
    ti.position = [x + w/2, y + h + (ti.size * 1.6)];
}

main();
