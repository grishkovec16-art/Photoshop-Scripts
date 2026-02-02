#target photoshop

function main() {
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
        alert("Слои не найдены.");
        return;
    }

    // 2. Диалог выбора
    var win = new Window("dialog", "ОБМЕН (PROGRESS MODE)");
    var g = win.add("group");
    var l1 = g.add("listbox", [0, 0, 220, 350]);
    var l2 = g.add("listbox", [0, 0, 220, 350]);

    for (var j = 0; j < students.length; j++) {
        l1.add("item", students[j].id + ". " + students[j].name);
        l2.add("item", students[j].id + ". " + students[j].name);
    }
    l1.selection = 0; l2.selection = 1;

    var btn = win.add("button", undefined, "ВЫПОЛНИТЬ ОБМЕН");
    btn.onClick = function() {
        var s1 = students[l1.selection.index];
        var s2 = students[l2.selection.index];
        
        win.close();

        // Показываем прогресс при самом обмене
        var runWin = new Window("palette", "Обмен...", undefined, {closeButton: false});
        runWin.add("statictext", undefined, "Перемещение слоев и замена текста...");
        runWin.center();
        runWin.show();

        doc.suspendHistory("Обмен: " + s1.name + " <-> " + s2.name, "doSwap(s1, s2)");
        
        runWin.close();
        alert("Готово!");
    };
    win.show();
}

function doSwap(s1, s2) {
    // Текст
    if (s1.textLayer && s2.textLayer) {
        var t1 = s1.textLayer.textItem.contents;
        var t2 = s2.textLayer.textItem.contents;
        s1.textLayer.textItem.contents = t2;
        s2.textLayer.textItem.contents = t1;
    }

    // Фото
    if (s1.photoLayer && s2.photoLayer) {
        var c1 = getCenter(s1.frameLayer);
        var c2 = getCenter(s2.frameLayer);

        s1.photoLayer.translate(c2[0] - c1[0], c2[1] - c1[1]);
        s2.photoLayer.translate(c1[0] - c2[0], c1[1] - c2[1]);

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
    for (var i = 0; i < p.layers.length; i++) {
        if (p.layers[i] == frame) {
            for (var k = i + 1; k < p.layers.length; k++) {
                if (p.layers[k].kind == LayerKind.TEXT) return p.layers[k];
                if (p.layers[k].name.indexOf("Фото_") !== -1) break;
            }
        }
    }
    return null;
}

main();