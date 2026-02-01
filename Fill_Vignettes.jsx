#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Откройте PSD шаблон!");
        return;
    }

    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку с именами детей");
    if (!rootFolder) return;

    var folders = rootFolder.getFiles(function (f) { return f instanceof Folder; });
    folders.sort();

    var studentIndex = 1;

    // --- ЭТАП 1: РАССТАНОВКА ФОТО И ИМЕН ---
    for (var i = 0; i < folders.length; i++) {
        var personFolder = folders[i];
        var rootFolderName = decodeURI(personFolder.name);

        var photoFile = findFirstImageRecursive(personFolder);
        if (!photoFile) continue;

        var baseID, textID, labelText;

        // Логика Учитель / Ученик
        if (rootFolderName.indexOf("УЧ_") === 0) {
            baseID = "Учитель_1";
            textID = "Учитель_Имя_1";
            labelText = rootFolderName.replace("УЧ_", "");
        } else {
            baseID = "Фото_" + studentIndex;
            textID = "Имя_" + studentIndex;
            labelText = rootFolderName;
            studentIndex++;
        }

        processPerson(doc, photoFile, labelText, baseID, textID);
    }

    // --- ЭТАП 2: НАДЁЖНАЯ ПРИВЯЗКА (Clipping Mask) ---
    applyClippingMasks(doc);

    alert("Готово! Фотографии кадрированы по верхнему краю и привязаны.");
}

// =================================================
// ================== ОСНОВНАЯ ЛОГИКА =================
// =================================================

function processPerson(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        // 1. Текст имени
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
            txtLayer.name = nameText;
        }

        // 2. Фотография
        var placeholder = findLayer(doc, baseLayerName);
        if (!placeholder) return;

        doc.activeLayer = placeholder;
        placeSmartObject(file);

        var photoLayer = doc.activeLayer;
        photoLayer.name = "IMG_" + nameText;

        // Помещаем строго НАД подложкой
        photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);

        // Умное кадрирование по ВЕРХНЕМУ краю
        fitToTargetTop(photoLayer, placeholder);

    } catch (err) {
        $.writeln("Ошибка: " + nameText + " → " + err);
    }
}

// =================================================
// ============ КАДРИРОВАНИЕ ПО ВЕРХУ =============
// =================================================

function fitToTargetTop(layer, target) {
    var b = target.bounds;
    var tw = b[2].as("px") - b[0].as("px"); // Ширина рамки
    var th = b[3].as("px") - b[1].as("px"); // Высота рамки

    var lb = layer.bounds;
    var lw = lb[2].as("px") - lb[0].as("px"); // Ширина фото
    var lh = lb[3].as("px") - lb[1].as("px"); // Высота фото

    // Вычисляем масштаб так, чтобы заполнить ВСЮ область (по максимальному коэффициенту)
    var scale = Math.max(tw / lw, th / lh) * 100;
    
    // Масштабируем относительно ВЕРХНЕГО центра
    layer.resize(scale, scale, AnchorPosition.TOPCENTER);

    // Выравниваем горизонтально по центру рамки
    var dx = (b[0].as("px") + tw / 2) - 
             (layer.bounds[0].as("px") + (layer.bounds[2].as("px") - layer.bounds[0].as("px")) / 2);

    // Прижимаем к ВЕРХНЕЙ границе рамки
    var dy = b[1].as("px") - layer.bounds[1].as("px");

    layer.translate(dx, dy);
}

// =================================================
// =============== ПРИВЯЗКА (MASKING) ================
// =================================================

function applyClippingMasks(container) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];

        if (lyr.typename === "LayerSet") {
            applyClippingMasks(lyr);
            continue;
        }

        if (lyr.name.indexOf("IMG_") !== 0) continue;

        var below = getLayerBelow(container, i);
        if (!below) continue;

        if (below.typename === "ArtLayer" &&
            (below.name.indexOf("Фото_") === 0 || below.name.indexOf("Учитель_") === 0)) {
            lyr.grouped = true; // Создание обтравочной маски
        }
    }
}

function getLayerBelow(container, index) {
    if (index + 1 >= container.layers.length) return null;
    return container.layers[index + 1];
}

// =================================================
// ================= ВСПОМОГАТЕЛЬНЫЕ =================
// =================================================

function findFirstImageRecursive(folder) {
    var files = folder.getFiles();
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        if (f instanceof Folder) {
            var res = findFirstImageRecursive(f);
            if (res) return res;
        } else if (f.name.match(/\.(jpg|jpeg|png|tif)$/i)) {
            return f;
        }
    }
    return null;
}

function placeSmartObject(file) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(file));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
}

function findLayer(container, name) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];
        if (lyr.name === name) return lyr;
        if (lyr.typename === "LayerSet") {
            var res = findLayer(lyr, name);
            if (res) return res;
        }
    }
    return null;
}

main();
