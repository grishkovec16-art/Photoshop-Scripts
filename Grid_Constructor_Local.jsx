#target photoshop

function main() {
    // 1. ПУТЬ К ПРЕВЬЮ (автоматически находим папку плагина)
    var scriptFile = new File($.fileName);
    var pluginFolder = scriptFile.parent; 
    // Если скрипт в корне, ищем в assets/previews
    var previewFolder = new Folder(Folder.userData + "/Adobe/CEP/extensions/com.vignette.cloud/assets/previews");
    
    // Если папка не найдена по стандартному пути, пробуем относительный путь
    if (!previewFolder.exists) {
        previewFolder = new Folder(pluginFolder + "/assets/previews");
    }

    // 2. Сбор списка файлов из папки превью
    var files = previewFolder.getFiles(/\.(jpg|jpeg|png)$/i);
    if (files.length === 0) {
        alert("Папка с превью пуста или не найдена: " + previewFolder.fsName);
        // Для теста добавим хотя бы один пункт, если папка пуста
        var displayNames = ["vignette_8", "vignette_24_teach_center"];
    } else {
        var displayNames = [];
        for (var i = 0; i < files.length; i++) {
            displayNames.push(decodeURI(files[i].name));
        }
    }

    // 3. СОЗДАНИЕ ДИАЛОГОВОГО ОКНА
    var dlg = new Window("dialog", "Конструктор Виньеток PRO");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.spacing = 15;
    dlg.margins = 20;

    // Группа параметров
    var mainGroup = dlg.add("group");
    mainGroup.orientation = "row";
    mainGroup.alignChildren = ["left", "center"];

    // Левая часть: Выбор и настройки
    var leftGroup = mainGroup.add("group");
    leftGroup.orientation = "column";
    leftGroup.alignChildren = "left";

    leftGroup.add("statictext", undefined, "Выберите шаблон из папки:");
    var list = leftGroup.add("dropdownlist", [0, 0, 250, 30], displayNames);
    list.selection = 0;

    var checkTeacher = leftGroup.add("checkbox", undefined, "Добавить УЧИТЕЛЯ (крупный бокс)");
    checkTeacher.value = true;

    // Правая часть: Превью
    var rightGroup = mainGroup.add("group");
    var previewBox = rightGroup.add("image", [0, 0, 180, 120]);
    
    // Функция обновления превью при смене выбора
    list.onChange = function() {
        if (files.length > 0) {
            var selectedFile = files[list.selection.index];
            if (selectedFile.exists) previewBox.image = selectedFile;
        }
    };
    // Инициализация первого превью
    if (files.length > 0) previewBox.image = files[0];

    // Кнопки управления
    var btnGroup = dlg.add("group");
    btnGroup.alignment = "center";
    var btnOk = btnGroup.add("button", undefined, "ГЕНЕРИРОВАТЬ СЕТКУ", {name: "ok"});
    var btnCancel = btnGroup.add("button", undefined, "ОТМЕНА", {name: "cancel"});

    // 4. ОБРАБОТКА НАЖАТИЯ "ОК"
    if (dlg.show() === 1) {
        var selectedName = list.selection.text;
        // Извлекаем количество детей из имени файла (например "vignette_24" -> 24)
        var kidsCount = parseInt(selectedName.replace(/\D/g, "")) || 20;
        
        var config = {
            total: kidsCount,
            cols: kidsCount > 30 ? 8 : 6, // Примерная логика колонок
            teacher: checkTeacher.value ? "center" : "none"
        };

        executeGridConstruction(config);
    }
}

function executeGridConstruction(cfg) {
    if (app.documents.length === 0) {
        alert("Пожалуйста, сначала создайте документ (Файл -> Новый)");
        return;
    }
    
    app.activeDocument.suspendHistory("Генерация сетки", "drawVignette(app.activeDocument, cfg)");
    alert("Макет успешно построен!");
}

// Функция отрисовки (остается без изменений в логике)
function drawVignette(doc, cfg) {
    var w = doc.width.as("px");
    var h = doc.height.as("px");
    var margin = w * 0.08; 
    var curY = margin;

    if (cfg.teacher === "center") {
        var tW = (w / cfg.cols) * 1.4;
        var tH = tW * 1.35;
        createLayerBox(doc, "Учитель_1", (w/2 - tW/2), curY, tW, tH, true);
        curY += tH + (h * 0.08);
    }

    var cellW = (w - margin * 2) / cfg.cols;
    var boxW = cellW * 0.85;
    var boxH = boxW * 1.35;

    for (var i = 0; i < cfg.total; i++) {
        var r = Math.floor(i / cfg.cols);
        var c = i % cfg.cols;
        var x = margin + (c * cellW) + (cellW - boxW) / 2;
        var y = curY + (r * (boxH * 1.45));
        createLayerBox(doc, "Фото_" + (i + 1), x, y, boxW, boxH, false);
    }
}

function createLayerBox(doc, name, x, y, w, h, isT) {
    var layer = doc.artLayers.add();
    layer.name = name;
    doc.selection.select([[x,y], [x+w,y], [x+w,y+h], [x,y+h]]);
    var color = new SolidColor(); color.rgb.hex = "CCCCCC";
    doc.selection.fill(color);
    doc.selection.deselect();
}

main();
