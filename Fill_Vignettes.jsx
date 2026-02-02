#target photoshop

/**
 * Функция получения ключа из памяти Photoshop
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
    try {
        // --- ПРОВЕРКА ЗАЩИТЫ ---
        var key = getStoredLicenseKey();
        if (!key) {
            alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
            return;
        }

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

        // --- ЭТАП 2: ПРИВЯЗКА МАСОК ---
        applyClippingMasks(doc);

        alert("Готово! Все фотографии расставлены и привязаны.");

    } catch (globalErr) {
        alert("Критическая ошибка выполнения: " + globalErr);
    }
}

// ================== ЛОГИКА ОБРАБОТКИ УЧЕНИКА =================

function processPerson(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        // Обновление текста
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
        }

        // Поиск подложки
        var placeholder = findLayer(doc, baseLayerName);
        if (!placeholder) return;

        doc.activeLayer = placeholder;
        
        // Вставка фото
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), new File(file));
        executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);

        var photoLayer = doc.activeLayer;
        photoLayer.name = "IMG_" + nameText;
        
        // Перемещение над подложку
        photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);

        // Масштабирование
        fitToTarget(photoLayer, placeholder);

    } catch (err) {
        $.writeln("Ошибка обработки " + nameText + ": " + err);
    }
}

// =============== ЛОГИКА CLIPPING MASK ===================

function applyClippingMasks(container) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];
        
        // Рекурсия для групп
        if (lyr.typename === "LayerSet") {
            applyClippingMasks(lyr);
            continue;
        }
        
        // Проверка: это вставленное фото?
        if (lyr.name.indexOf("IMG_") !== 0) continue;
        
        var below = getLayerBelow(container, i);
        if (!below) continue;
        
        // Если слой ниже - это подложка, создаем обтравочную маску
        if (below.name.indexOf("Фото_") === 0 || below.name.indexOf("Учитель_") === 0) {
            lyr.grouped = true; 
        }
    }
}

function getLayerBelow(container, index) {
    if (index + 1 >= container.layers.length) return null;
    return container.layers[index + 1];
}

// ================= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =================

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

function fitToTarget(layer, target) {
    try {
        var b = target.bounds;
        var tw = b[2].as("px") - b[0].as("px");
        var th = b[3].as("px") - b[1].as("px");
        
        var lb = layer.bounds;
        var lw = lb[2].as("px") - lb[0].as("px");
        var lh = lb[3].as("px") - lb[1].as("px");
        
        if (lw === 0 || lh === 0) return;

        var scale = Math.max(tw / lw, th / lh) * 100;
        layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);
        
        // Центрирование
        var pBounds = layer.bounds;
        var pCenter = [
            pBounds[0].as("px") + (pBounds[2].as("px") - pBounds[0].as("px")) / 2,
            pBounds[1].as("px") + (pBounds[3].as("px") - pBounds[1].as("px")) / 2
        ];
        var tCenter = [
            b[0].as("px") + tw / 2,
            b[1].as("px") + th / 2
        ];
        
        layer.translate(tCenter[0] - pCenter[0], tCenter[1] - pCenter[1]);
    } catch (e) {}
}

main();
