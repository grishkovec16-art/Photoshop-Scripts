#target photoshop

/**
 * Функция получения ключа из памяти Photoshop, 
 * который туда записывает ваша панель (index.html)
 */
function getStoredLicenseKey() {
    try {
        var ref = new ActionReference();
        ref.putProperty(charIDToTypeID('Prpt'), stringIDToTypeID('vignette_license_key'));
        ref.putEnumerated(charIDToTypeID('capp'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        var result = executeActionGet(ref);
        return result.getString(stringIDToTypeID('vignette_license_key'));
    } catch (e) { 
        return null; 
    }
}

function main() {
    // --- ПРОВЕРКА ЗАЩИТЫ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }

    if (app.documents.length === 0) return;
    var doc = app.activeDocument;
    var students = [];

    // --- ОКНО ЗАГРУЗКИ ---
    var progressWin = new Window("palette", "Выполнение операции...", undefined, {closeButton: false});
    progressWin.pBar = progressWin.add("progressbar", [0, 0, 300, 20], 0, 100);
    progressWin.stText = progressWin.add("statictext", undefined, "Сканирование слоев...");
    progressWin.center();
    progressWin.show();

    // 1. Сбор данных
    for (var i = 1; i <= 100; i++) {
        progressWin.pBar.value = i;
        progressWin.update();

        var frame = findLayer(doc, "Фото_" + i);
        if (frame) {
            var photo = getClippedLayer(frame);
            var textLyr = findTextBelow(frame);
            var currentName = (textLyr) ? textLyr.textItem.contents.replace(/\r/g, " ") : "Ученик " + i;

            students.push({
                id: i,
                name: currentName,
                textLayer: textLyr,
                frameLayer: frame,
                photoLayer: photo
            });
        }
    }
    progressWin.close();

    if (students.length < 2) {
        alert("Найдено меньше 2 учеников (Фото_X). Проверьте имена слоев.");
        return;
    }

    // 2. Интерфейс выбора
    var win = new Window("dialog", "УМНЫЙ ОБМЕН МЕСТАМИ");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 15;

    var listsGroup = win.add("group");
    listsGroup.spacing = 10;

    var g1 = listsGroup.add("group");
    g1.orientation = "column";
    g1.add("statictext", undefined, "Кого меняем:");
    var list1 = g1.add("listbox", [0, 0, 220, 350]);

    var g2 = listsGroup.add("group");
    g2.orientation = "column";
    g2.add("statictext", undefined, "На кого:");
    var list2 = g2.add("listbox", [0, 0, 220, 350]);

    for (var j = 0; j < students.length; j++) {
        var itemText = students[j].id + ". " + students[j].name;
        list1.add("item", itemText);
        list2.add("item", itemText);
    }

    list1.selection = 0;
    list2.selection = 1;

    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    var btnOk = btnGroup.add("button", undefined, "ПОМЕНЯТЬ МЕСТАМИ", {name: "ok"});
    var btnCancel = btnGroup.add("button", undefined, "ОТМЕНА", {name: "cancel"});

    if (win.show() == 1) {
        var s1 = students[list1.selection.index];
        var s2 = students[list2.selection.index];

        if (s1.id === s2.id) {
            alert("Выберите разных учеников!");
            return;
        }

        // Выполняем обмен в одной истории (History State)
        doc.suspendHistory("Обмен: " + s1.name + " <-> " + s2.name, "executeSwap(s1, s2)");
    }
}

function executeSwap(s1, s2) {
    // 1. Меняем текст
    if (s1.textLayer && s2.textLayer) {
        var name1 = s1.textLayer.textItem.contents;
        var name2 = s2.textLayer.textItem.contents;
        
        s1.textLayer.textItem.contents = name2;
        s2.textLayer.textItem.contents = name1;

        // Также меняем имена слоев для удобства
        s1.textLayer.name = name2;
        s2.textLayer.name = name1;
    }

    // 2. Меняем фото (координаты и вложенность)
    if (s1.photoLayer && s2.photoLayer) {
        var c1 = getCenter(s1.frameLayer);
        var c2 = getCenter(s2.frameLayer);

        // Перемещаем физически
        s1.photoLayer.translate(c2[0] - c1[0], c2[1] - c1[1]);
        s2.photoLayer.translate(c1[0] - c2[0], c1[1] - c2[1]);

        // Перемещаем в иерархии слоев (чтобы Clipping Mask не слетел)
        s1.photoLayer.move(s2.frameLayer, ElementPlacement.PLACEBEFORE);
        s2.photoLayer.move(s1.frameLayer, ElementPlacement.PLACEBEFORE);
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function getCenter(lyr) {
    var b = lyr.bounds;
    return [(Number(b[0]) + Number(b[2])) / 2, (Number(b[1]) + Number(b[3])) / 2];
}

function findLayer(container, name) {
    try { return container.layers.getByName(name); } catch (e) {
        for (var i = 0; i < container.layers.length; i++) {
            if (container.layers[i].typename == "LayerSet") {
                var res = findLayer(container.layers[i], name);
                if (res) return res;
            }
        }
    }
    return null;
}

function getClippedLayer(frame) {
    var p = frame.parent;
    for (var i = 0; i < p.layers.length; i++) {
        if (p.layers[i] == frame && i > 0) {
            if (p.layers[i-1].grouped) return p.layers[i-1];
        }
    }
    return null;
}

function findTextBelow(frame) {
    var p = frame.parent;
    var foundFrame = false;
    for (var i = 0; i < p.layers.length; i++) {
        if (p.layers[i] == frame) {
            foundFrame = true;
            continue;
        }
        if (foundFrame) {
            if (p.layers[i].kind == LayerKind.TEXT) return p.layers[i];
            if (p.layers[i].name.indexOf("Фото_") !== -1) break; 
        }
    }
    return null;
}

main();
