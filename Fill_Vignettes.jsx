#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Откройте PSD шаблон!");
        return;
    }

    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите общую папку с папками детей");
    if (!rootFolder) return;

    // Получаем список всех папок первого уровня (папки детей)
    var items = rootFolder.getFiles(function(f) { return f instanceof Folder; });
    items.sort();

    var studentIndex = 1;

    for (var i = 0; i < items.length; i++) {
        var folderChild = items[i];
        var rootFolderName = decodeURI(folderChild.name);
        
        // РЕКУРСИВНЫЙ ПОИСК ФОТО (ищет даже в глубоких подпапках)
        var photoFile = findFirstImageRecursive(folderChild);
        
        if (!photoFile) continue; // Если в папке и подпапках нет фото, пропускаем

        var baseID; // Для слоя Фото_
        var textID; // Для слоя Имя_
        var labelText;

        // ЛОГИКА ДЛЯ УЧИТЕЛЯ (по метке УЧ_)
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

        processVignette(doc, photoFile, labelText, baseID, textID);
    }

    alert("Готово! Все найденные фото привязаны к слоям.");
}

function processVignette(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        // 1. ЗАПОЛНЕНИЕ ТЕКСТА (Имя_N)
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
        }

        // 2. ВСТАВКА ФОТО (Фото_N)
        var placeholder = findLayer(doc, baseLayerName);
        if (placeholder) {
            doc.activeLayer = placeholder;

            // Используем метод вставки из скрипта обложек
            placeFile(file);

            var photoLayer = doc.activeLayer;
            photoLayer.name = "IMG_" + nameText;
            
            // Ставим фото точно над подложкой
            photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
            
            // Подгоняем размер
            fitToTarget(photoLayer, placeholder);

            // ПРИВЯЗКА (Clipping Mask) - Метод из рабочего скрипта обложек
            createClippingMask();
        }
    } catch (err) {
        $.writeln("Ошибка: " + nameText + " - " + err);
    }
}

// Рекурсивный поиск первого изображения
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

// Команда создания обтравочной маски (аналог Ctrl+Alt+G)
function createClippingMask() {
    try {
        var idGrpP = charIDToTypeID("GrpP");
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(idGrpP, desc, DialogModes.NO);
    } catch (e) {}
}

function placeFile(path) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(path));
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

function fitToTarget(layer, target) {
    var b = target.bounds;
    var tw = b[2].as("px") - b[0].as("px");
    var th = b[3].as("px") - b[1].as("px");
    
    var lb = layer.bounds;
    var lw = lb[2].as("px") - lb[0].as("px");
    var lh = lb[3].as("px") - lb[1].as("px");

    var scale = Math.max(tw / lw, th / lh) * 100;
    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    var dx = (b[0].as("px") + tw/2) - (layer.bounds[0].as("px") + (layer.bounds[2].as("px") - layer.bounds[0].as("px"))/2);
    var dy = (b[1].as("px") + th/2) - (layer.bounds[1].as("px") + (layer.bounds[3].as("px") - layer.bounds[1].as("px"))/2);
    layer.translate(dx, dy);
}

main();
