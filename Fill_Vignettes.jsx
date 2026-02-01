#target photoshop

function main() {
    if (app.documents.length === 0) { 
        alert("Ошибка: Откройте PSD шаблон с виньетками!"); 
        return; 
    }
    
    var doc = app.activeDocument;
    
    // 1. Выбор корневой папки проекта
    var rootFolder = Folder.selectDialog("Выберите папку проекта (где лежат папки УЧ_ и ФОТО)");
    if (!rootFolder) return;

    var photosFolder = new Folder(rootFolder + "/ФОТО");
    if (!photosFolder.exists) { 
        alert("Папка ФОТО не найдена по пути: " + photosFolder.fsName); 
        return; 
    }

    // Получаем список файлов
    var photos = photosFolder.getFiles(/\.(jpg|jpeg|png|tif)$/i);
    photos.sort();

    if (photos.length === 0) {
        alert("В папке ФОТО нет подходящих изображений!");
        return;
    }

    // 2. Цикл по фотографиям и слоям "Фото_N"
    for (var i = 0; i < photos.length; i++) {
        var layerIndex = i + 1;
        var targetLayerName = "Фото_" + layerIndex;
        
        try {
            // Ищем слой-основу
            var baseLayer = doc.layers.getByName(targetLayerName);
            doc.activeLayer = baseLayer;

            // Вставляем фотографию как Smart Object (Place Embedded)
            placeImage(photos[i]);

            var photoLayer = doc.activeLayer;
            photoLayer.name = "Photo_" + photos[i].name;

            // --- СОЗДАНИЕ ОБТРАВОЧНОЙ МАСКИ (Clipping Mask) ---
            // Команда аналогична Ctrl+Alt+G
            makeClippingMask();

            // Масштабируем и центрируем фото внутри маски
            fitToTarget(photoLayer, baseLayer);

        } catch (e) {
            // Если слой "Фото_N" не найден, скрипт просто идет к следующему фото
            continue;
        }
    }
    
    alert("Готово! Все фото вставлены и прикреплены к слоям.");
}

function placeImage(filePath) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(filePath));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
}

function makeClippingMask() {
    try {
        var idGrpP = charIDToTypeID("GrpP"); // Group Previous (Clipping Mask)
        var desc = new ActionDescriptor();
        var ref = new ActionReference();
        ref.putEnumerated(charIDToTypeID("Lyr "), charIDToTypeID("Ordn"), charIDToTypeID("Trgt"));
        desc.putReference(charIDToTypeID("null"), ref);
        executeAction(idGrpP, desc, DialogModes.NO);
    } catch (e) {
        // Ошибка может возникнуть, если слой уже в маске
    }
}

function fitToTarget(photo, base) {
    var pB = photo.bounds; 
    var bB = base.bounds;
    
    var pW = pB[2] - pB[0]; 
    var pH = pB[3] - pB[1];
    var bW = bB[2] - bB[0]; 
    var bH = bB[3] - bB[1];
    
    // Расчет коэффициента для заполнения (Fill)
    var ratio = Math.max(bW / pW, bH / pH) * 100;
    photo.resize(ratio, ratio, AnchorPosition.MIDDLECENTER);
    
    // Центрирование
    var pNewB = photo.bounds;
    var pCenter = [pNewB[0] + (pNewB[2]-pNewB[0])/2, pNewB[1] + (pNewB[3]-pNewB[1])/2];
    var bCenter = [bB[0] + bW/2, bB[1] + bH/2];
    
    photo.translate(bCenter[0] - pCenter[0], bCenter[1] - pCenter[1]);
}

main();
