#target photoshop

function main() {
    if (app.documents.length === 0) {
        alert("Сначала откройте PSD шаблон!");
        return;
    }

    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку с материалами (папки учеников)");
    if (!rootFolder) return;

    var folders = rootFolder.getFiles(function(f) { return f instanceof Folder; });
    folders.sort(); 

    var studentIndex = 1;

    for (var i = 0; i < folders.length; i++) {
        var folderName = decodeURI(folders[i].name);
        
        var imgFiles = folders[i].getFiles(/\.(jpg|jpeg|png|tif)$/i);
        if (imgFiles.length === 0) continue;
        var photoFile = imgFiles[0];

        var baseID;    // Слой-рамка (Фото_N)
        var textID;    // Текстовый слой (Имя_N)
        var labelText;

        // ЛОГИКА ОПРЕДЕЛЕНИЯ РОЛИ (Учитель или Ученик)
        if (folderName.indexOf("УЧ_") === 0) {
            baseID = "Учитель_1"; 
            textID = "Учитель_Имя_1"; // Согласно вашей новой структуре
            labelText = folderName.replace("УЧ_", ""); 
        } else {
            baseID = "Фото_" + studentIndex;
            textID = "Имя_" + studentIndex; // Согласно вашей новой структуре
            labelText = folderName;
            studentIndex++;
        }

        processVignette(doc, photoFile, labelText, baseID, textID);
    }

    alert("Готово! Фотографии привязаны к слоям масками.");
}

function processVignette(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        // 1. ЗАПОЛНЕНИЕ ТЕКСТА
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
        }

        // 2. ВСТАВКА ФОТО И ПРИВЯЗКА К СЛОЮ (CLIPPING MASK)
        var placeholder = findLayer(doc, baseLayerName);
        if (placeholder) {
            doc.activeLayer = placeholder;

            // Вставляем файл как Smart Object
            placeSmartObject(file);

            var photoLayer = doc.activeLayer;
            photoLayer.name = "IMG_" + nameText;
            
            // Перемещаем слой строго НАД подложкой перед созданием маски
            photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
            
            // Масштабируем фото под размер ячейки
            fitLayerSafely(photoLayer, placeholder);

            // ТЕХНОЛОГИЯ ПРИВЯЗКИ (как в скрипте обложек)
            makeClippingMask();
        }
    } catch (err) {
        $.writeln("Ошибка при обработке " + nameText + ": " + err);
    }
}

// Надежный метод создания обтравочной маски через ActionDescriptor
function makeClippingMask() {
    try {
        var idGrpP = charIDToTypeID("GrpP"); // Команда "Create Clipping Mask"
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(idGrpP, desc, DialogModes.NO);
    } catch (e) {
        $.writeln("Не удалось создать маску: " + e);
    }
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

function fitLayerSafely(layer, target) {
    var b = target.bounds;
    var tw = b[2].as("px") - b[0].as("px");
    var th = b[3].as("px") - b[1].as("px");
    
    var lb = layer.bounds;
    var lw = lb[2].as("px") - lb[0].as("px");
    var lh = lb[3].as("px") - lb[1].as("px");

    if (lw == 0 || lh == 0) return;

    var scale = Math.max(tw / lw, th / lh) * 100;
    layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);

    var dx = (b[0].as("px") + tw/2) - (layer.bounds[0].as("px") + (layer.bounds[2].as("px") - layer.bounds[0].as("px"))/2);
    var dy = (b[1].as("px") + th/2) - (layer.bounds[1].as("px") + (layer.bounds[3].as("px") - layer.bounds[1].as("px"))/2);
    layer.translate(dx, dy);
}

main();
