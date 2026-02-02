#target photoshop

function main() {
    var presets = [
        {id: "vignette_8", name: "8 Учеников (4х2)", rows: 2, cols: 4, count: 8},
        {id: "vignette_24", name: "24 Уч. + Учитель", rows: 4, cols: 6, count: 24},
        {id: "vignette_30", name: "30 Учеников (5х6)", rows: 6, cols: 5, count: 30}
    ];

    var win = new Window("dialog", "Конструктор Виньеток PRO");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 20;

    win.add("statictext", undefined, "ВЫБЕРИТЕ ШАБЛОН:");
    var list = win.add("dropdownlist", [0, 0, 220, 30]);
    for (var i = 0; i < presets.length; i++) list.add("item", presets[i].name);
    list.selection = 0;

    var checkTeacher = win.add("checkbox", undefined, "Добавить слой Учителя");
    checkTeacher.value = true;

    var btnGrp = win.add("group");
    btnGrp.alignment = "right";
    btnGrp.add("button", undefined, "Отмена", {name: "cancel"});
    var btnOk = btnGrp.add("button", undefined, "СОЗДАТЬ", {name: "ok"});

    if (win.show() == 1) {
        var sel = presets[list.selection.index];
        drawGrid(sel.count, sel.cols, checkTeacher.value);
    }
}

function drawGrid(count, cols, hasTeacher) {
    if (app.documents.length === 0) {
        alert("Нет активного документа!");
        return;
    }

    var doc = app.activeDocument;
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    
    // Параметры сетки
    var marginX = w * 0.08;
    var startY = h * 0.1;
    var cellW = (w - (marginX * 2)) / cols;
    var boxW = cellW * 0.8;
    var boxH = boxW * 1.3;
    var verticalGap = boxH * 0.5; // Место под текст и отступ

    doc.suspendHistory("Создание сетки", "execute()");

    function execute() {
        var currentIdx = 1;

        // 1. Создание Учителя (если нужно)
        if (hasTeacher) {
            var tX = (w / 2) - (boxW / 2);
            var tY = startY;
            createStudentElements(doc, "Учитель", tX, tY, boxW, boxH);
            startY += boxH + verticalGap;
        }

        // 2. Создание Учеников
        for (var i = 0; i < count; i++) {
            var row = Math.floor(i / cols);
            var col = i % cols;
            
            var posX = marginX + (col * cellW) + (cellW - boxW) / 2;
            var posY = startY + (row * (boxH + verticalGap));
            
            createStudentElements(doc, currentIdx, posX, posY, boxW, boxH);
            currentIdx++;
        }
    }
}

function createStudentElements(doc, id, x, y, w, h) {
    // Важно: в Photoshop новые слои создаются СВЕРХУ. 
    // Чтобы Фото было под Именем в списке слоев, сначала создаем Фото, потом Имя.

    // 1. Создаем слой ФОТО (черный прямоугольник)
    var photoLayer = doc.artLayers.add();
    photoLayer.name = (id === "Учитель") ? "Учитель" : "Фото_" + id;
    
    doc.selection.select([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
    var black = new SolidColor();
    black.rgb.red = 0; black.rgb.green = 0; black.rgb.blue = 0;
    doc.selection.fill(black);
    doc.selection.deselect();

    // 2. Создаем слой ИМЯ (текст) поверх фото в списке слоев
    var nameLayer = doc.artLayers.add();
    nameLayer.kind = LayerKind.TEXT;
    nameLayer.name = (id === "Учитель") ? "Учитель_текст" : "Имя_" + id;
    
    var ti = nameLayer.textItem;
    ti.contents = (id === "Учитель") ? "Учитель" : "Имя Фамилия";
    ti.size = w * 0.12;
    ti.justification = Justification.CENTER;
    
    // Позиция текста: центр по X, чуть ниже прямоугольника по Y
    ti.position = [x + (w / 2), y + h + (ti.size * 1.5)];
}

main();
