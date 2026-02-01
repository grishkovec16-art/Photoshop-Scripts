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

        var targetID;
        var labelText;

        if (folderName.indexOf("УЧ_") === 0) {
            targetID = "Учитель_1"; 
            labelText = folderName.replace("УЧ_", ""); 
        } else {
            targetID = "Фото_" + studentIndex;
            labelText = folderName;
            studentIndex++;
        }

        processPersonAsSmartObject(doc, photoFile, labelText, targetID);
    }

    alert("Готово! Фотографии привязаны к слоям масками.");
}

function processPersonAsSmartObject(doc, file, nameText, layerName) {
    try {
        var txtLayer = findSpecificLayer(doc, layerName, true);
        if (txtLayer) {
            txtLayer.textItem.contents = nameText;
        }

        var placeholder = findSpecificLayer(doc, layerName, false);
        if (placeholder) {
            doc.activeLayer = placeholder;

            placeSmartObject(file);

            var newLayer = doc.activeLayer;
            newLayer.name = "IMG_" + nameText;
            
            // Перемещаем слой строго НАД плейсхолдером перед созданием маски
            newLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
            
            fitLayerSafely(newLayer, placeholder);

            // --- ФИКС: ПРИВЯЗКА К СЛОЮ (ОБТРАВОЧНАЯ МАСКА) ---
            makeClippingMask();
        }
    } catch (err) {
        $.writeln("Ошибка: " + nameText + " - " + err);
    }
}

function makeClippingMask() {
    try {
        var idGrpP = charIDToTypeID("GrpP"); // Команда Create Clipping Mask
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

function findSpecificLayer(container, name, isText) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];
        if (lyr.name === name) {
            if (isText && lyr.kind === LayerKind.TEXT) return lyr;
            if (!isText && lyr.kind !== LayerKind.TEXT) return lyr;
        }
        if (lyr.typename === "LayerSet") {
            var res = findSpecificLayer(lyr, name, isText);
            if (res) return res;
        }
    }
    return null;
}

function fitLayerSafely(layer, target) {
    try {
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
    } catch(e) {}
}

main();
