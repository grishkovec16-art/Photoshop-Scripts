#target photoshop

/**
 * Функция поиска ключа в памяти Photoshop
 */
function getStoredLicenseKey() {
    // 1. Проверка в глобальной переменной
    if (typeof app.vignetteKey !== 'undefined' && app.vignetteKey !== null) {
        return app.vignetteKey;
    }
    // 2. Проверка в ActionDescriptor
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
            alert("ОШИБКА АКТИВАЦИИ: Ключ не найден в памяти Photoshop. Пожалуйста, перезапустите панель.");
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

        for (var i = 0; i < folders.length; i++) {
            var personFolder = folders[i];
            var rootFolderName = decodeURI(personFolder.name);
            var photoFile = findFirstImageRecursive(personFolder);
            if (!photoFile) continue;

            var baseID, textID, labelText;

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

        applyClippingMasks(doc);
        alert("Готово! Виньетки заполнены.");

    } catch (globalErr) {
        alert("Критическая ошибка: " + globalErr);
    }
}

function processPerson(doc, file, nameText, baseLayerName, textLayerName) {
    try {
        var txtLayer = findLayer(doc, textLayerName);
        if (txtLayer && txtLayer.kind === LayerKind.TEXT) {
            txtLayer.textItem.contents = nameText;
            txtLayer.name = nameText;
        }

        var placeholder = findLayer(doc, baseLayerName);
        if (!placeholder) return;

        doc.activeLayer = placeholder;
        
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), new File(file));
        executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);

        var photoLayer = doc.activeLayer;
        photoLayer.name = "IMG_" + nameText;
        photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);

        fitToTarget(photoLayer, placeholder);
    } catch (err) {}
}

function applyClippingMasks(container) {
    for (var i = 0; i < container.layers.length; i++) {
        var lyr = container.layers[i];
        if (lyr.typename === "LayerSet") {
            applyClippingMasks(lyr);
            continue;
        }
        if (lyr.name.indexOf("IMG_") !== 0) continue;
        
        var idx = -1;
        for(var j=0; j<container.layers.length; j++) { if(container.layers[j] == lyr) idx = j; }
        
        if (idx !== -1 && idx + 1 < container.layers.length) {
            var below = container.layers[idx+1];
            if (below.name.indexOf("Фото_") === 0 || below.name.indexOf("Учитель_") === 0) {
                lyr.grouped = true; 
            }
        }
    }
}

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
        var scale = Math.max(tw / lw, th / lh) * 100;
        layer.resize(scale, scale, AnchorPosition.MIDDLECENTER);
        var nb = layer.bounds;
        layer.translate((b[0].as("px") + tw/2) - (nb[0].as("px") + (nb[2].as("px")-nb[0].as("px"))/2), 
                        (b[1].as("px") + th/2) - (nb[1].as("px") + (nb[3].as("px")-nb[1].as("px"))/2));
    } catch (e) {}
}

main();
