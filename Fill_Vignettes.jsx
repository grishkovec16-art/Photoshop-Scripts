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

        var baseID;    // Имя слоя для фото
        var textID;    // Имя слоя для текста
        var labelText;

        // ЛОГИКА ДЛЯ УЧИТЕЛЯ И УЧЕНИКОВ
        if (folderName.indexOf("УЧ_") === 0) {
            baseID = "Учитель_1"; 
            textID = "Учитель_Имя_1"; 
            labelText = folderName.replace("УЧ_", ""); 
        } else {
            baseID = "Фото_" + studentIndex;
            textID = "Имя_" + studentIndex;
            labelText = folderName;
            studentIndex++;
        }

        processVignette(doc, photoFile, labelText, baseID, textID);
    }

    alert("Готово! Все фото прикреплены к слоям Фото_N, имена заполнены в Имя_N.");
}

function processVignette(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        // 1. ЗАПОЛНЕНИЕ ТЕКСТА (в слой Имя_N)
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
        }

        // 2. ВСТАВКА ФОТО (в слой Фото_N)
        var placeholder = findLayer(doc, baseLayerName);
        if (placeholder) {
            doc.activeLayer = placeholder;

            // Вставляем файл
            placeSmartObject(file);

            var photoLayer = doc.activeLayer;
            photoLayer.name = "IMG_" + nameText;
            
            // Перемещаем строго НАД подложкой Фото_N
            photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
            
            // Масштабируем
            fitToTarget(photoLayer, placeholder);

            // --- ПРИВЯЗКА К СЛОЮ (ОБТРАВОЧНАЯ МАСКА) ---
            makeClippingMask();
        }
    } catch (err) {
        $.writeln("Ошибка в " + nameText + ": " + err);
    }
}

function makeClippingMask() {
    try {
        var idGrpP = charIDToTypeID("GrpP");
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(idGrpP, desc, DialogModes.NO);
    } catch (e) {}
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
