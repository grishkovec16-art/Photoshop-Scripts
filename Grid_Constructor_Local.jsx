#target photoshop

function main() {
    // 1. ОПРЕДЕЛЕНИЕ ПУТЕЙ (для превью)
    var extensionPath = Folder.userData + "/Adobe/CEP/extensions/com.vignette.cloud/assets/previews/";
    
    var presets = [
        {id: "vignette_8", name: "8 Учеников (4х2)", file: "vignette_8.jpg", rows: 2, cols: 4, count: 8},
        {id: "vignette_24", name: "24 Уч. + Учитель", file: "vignette_24_teach_center.jpg", rows: 4, cols: 6, count: 24},
        {id: "vignette_30", name: "30 Учеников (5х6)", file: "vignette_30_classic.jpg", rows: 6, cols: 5, count: 30}
    ];

    // 2. СОЗДАНИЕ ДИАЛОГА
    var win = new Window("dialog", "Конструктор Виньеток");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 20;

    var head = win.add("statictext", undefined, "ВЫБЕРИТЕ МАКЕТ СЕТКИ");
    head.graphics.font = ScriptUI.newFont("Tahoma", "BOLD", 16);

    // Группа контента
    var contentGrp = win.add("group");
    contentGrp.orientation = "row";
    contentGrp.alignChildren = ["left", "top"];

    // Список
    var list = contentGrp.add("dropdownlist", [0, 0, 180, 30]);
    for (var i = 0; i < presets.length; i++) {
        list.add("item", presets[i].name);
    }
    list.selection = 0;

    // Превью панель
    var imgPnl = contentGrp.add("panel", undefined, "Превью");
    var preview = imgPnl.add("image", [0, 0, 220, 150]);

    // Функция обновления превью
    function updatePreview() {
        var imgFile = new File(extensionPath + presets[list.selection.index].file);
        if (imgFile.exists) {
            preview.image = imgFile;
        }
    }

    list.onChange = updatePreview;
    updatePreview();

    // Опции
    var opts = win.add("panel", undefined, "Дополнительно");
    opts.alignChildren = "left";
    var checkTeacher = opts.add("checkbox", undefined, "Добавить место для учителя в центре");
    checkTeacher.value = true;

    // Кнопки
    var btnGrp = win.add("group");
    btnGrp.alignment = "right";
    var btnCancel = btnGrp.add("button", undefined, "Отмена", {name: "cancel"});
    var btnOk = btnGrp.add("button", undefined, "СОЗДАТЬ СЕТКУ", {name: "ok"});

    // 3. ОБРАБОТКА НАЖАТИЯ
    if (win.show() == 1) {
        var selected = presets[list.selection.index];
        var config = {
            count: selected.count,
            cols: selected.cols,
            teacher: checkTeacher.value
        };
        
        // Запускаем отрисовку только здесь!
        runGridGeneration(config);
    }
}

function runGridGeneration(cfg) {
    if (app.documents.length === 0) {
        alert("Сначала создайте документ!");
        return;
    }
    
    var doc = app.activeDocument;
    doc.suspendHistory("Генерация сетки", "drawLogic(doc, cfg)");
}

function drawLogic(doc, cfg) {
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    var margin = w * 0.08;
    var curY = margin;

    // Рисуем учителя
    if (cfg.teacher) {
        var tW = (w / cfg.cols) * 1.4;
        var tH = tW * 1.35;
        createBox(doc, "Учитель", (w/2 - tW/2), curY, tW, tH);
        curY += tH + (h * 0.08);
    }

    // Рисуем учеников
    var cellW = (w - margin * 2) / cfg.cols;
    var boxW = cellW * 0.85;
    var boxH = boxW * 1.35;

    for (var i = 0; i < cfg.count; i++) {
        var r = Math.floor(i / cfg.cols);
        var c = i % cfg.cols;
        var x = margin + (c * cellW) + (cellW - boxW) / 2;
        var y = curY + (r * (boxH * 1.45));
        createBox(doc, "Ученик_" + (i + 1), x, y, boxW, boxH);
    }
}

function createBox(doc, name, x, y, w, h) {
    var layer = doc.artLayers.add();
    layer.name = name;
    doc.selection.select([[x,y], [x+w,y], [x+w,y+h], [x,y+h]]);
    var color = new SolidColor(); color.rgb.hex = "888888";
    doc.selection.fill(color);
    doc.selection.deselect();
}

// ЗАПУСК ТОЛЬКО ЧЕРЕЗ ФУНКЦИЮ
main();
