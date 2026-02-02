#target photoshop

/**
 * Ультра-надежный поиск ключа
 */
function getStoredLicenseKey() {
    if (typeof app.vignetteKey !== 'undefined' && app.vignetteKey !== null) {
        return app.vignetteKey;
    }
    try {
        var ref = new ActionReference();
        ref.putProperty(charIDToTypeID('Prpt'), stringIDToTypeID('vignette_license_key'));
        ref.putEnumerated(charIDToTypeID('capp'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        var result = executeActionGet(ref);
        return result.getString(stringIDToTypeID('vignette_license_key'));
    } catch (e) { return null; }
}

function main() {
    try {
        var key = getStoredLicenseKey();
        if (!key) {
            alert("ОШИБКА АКТИВАЦИИ: Ключ не найден. Запустите панель.");
            return;
        }

        if (app.documents.length === 0) {
            alert("Откройте PSD шаблон обложки!");
            return;
        }

        var doc = app.activeDocument;
        
        // Выбор папки с готовыми ПНГ/ДЖПЕГ файлами или папками детей
        var sourceFolder = Folder.selectDialog("Выберите папку с фотографиями для обложек");
        if (!sourceFolder) return;

        var saveFolder = Folder.selectDialog("Выберите папку для СОХРАНЕНИЯ готовых обложек");
        if (!saveFolder) return;

        var files = sourceFolder.getFiles(/\.(jpg|jpeg|png|tif|psd)$/i);
        if (files.length === 0) {
            alert("В выбранной папке не найдено подходящих изображений!");
            return;
        }

        // Ищем слой-подложку, куда вставлять фото (обычно называется "Фото_Обложка" или "Placeholder")
        var targetLayer = findLayer(doc, "Фото_Обложка") || findLayer(doc, "Placeholder") || doc.activeLayer;

        for (var i = 0; i < files.length; i++) {
            var currentFile = files[i];
            var fileName = decodeURI(currentFile.name).split('.')[0];

            // 1. Вставляем фото
            doc.activeLayer = targetLayer;
            placeSmartObject(currentFile);
            var photoLayer = doc.activeLayer;
            photoLayer.name = "Cover_Photo_" + fileName;

            // 2. Подгоняем под размер и центрируем
            fitToTarget(photoLayer, targetLayer);
            
            // 3. Если нужно привязываем маской (clipping mask)
            try { photoLayer.grouped = true; } catch(e) {}

            // 4. Обновляем имя на обложке (если есть слой "Имя")
            var nameLayer = findLayer(doc, "Имя_Обложка") || findLayer(doc, "Имя");
            if (nameLayer && nameLayer.kind === LayerKind.TEXT) {
                nameLayer.textItem.contents = fileName.replace(/_/g, " ");
            }

            // 5. Сохраняем в JPG
            var saveFile = new File(saveFolder + "/" + fileName + "_Cover.jpg");
            saveAsJpeg(saveFile, 10);

            // 6. Удаляем слой с фото, чтобы подготовить шаблон для следующего
            photoLayer.remove();
        }

        alert("Готово! Все обложки сохранены в: " + saveFolder.fsName);

    } catch (err) {
        alert("Ошибка в скрипте обложек: " + err);
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

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

function placeSmartObject(file) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(file));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
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
    var nb = layer.bounds;
    layer.translate((b[0].as("px") + tw/2) - (nb[0].as("px") + (nb[2].as("px")-nb[0].as("px"))/2), 
                    (b[1].as("px") + th/2) - (nb[1].as("px") + (nb[3].as("px")-nb[1].as("px"))/2));
}

function saveAsJpeg(file, quality) {
    var opts = new JPEGSaveOptions();
    opts.quality = quality;
    opts.embedColorProfile = true;
    opts.formatOptions = FormatOptions.PROGRESSIVE;
    opts.scans = 3;
    app.activeDocument.saveAs(file, opts, true, Extension.LOWERCASE);
}

main();
