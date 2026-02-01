#target photoshop

function main() {
    if (app.documents.length === 0) { 
        alert("Ошибка: Откройте PSD шаблон!"); 
        return; 
    }
    
    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку проекта");
    if (!rootFolder) return;

    var photosFolder = new Folder(rootFolder + "/ФОТО");
    if (!photosFolder.exists) { 
        alert("Папка ФОТО не найдена по пути: " + photosFolder.fsName); 
        return; 
    }

    var photos = photosFolder.getFiles(/\.(jpg|jpeg|png|tif)$/i);
    photos.sort();

    for (var i = 0; i < photos.length; i++) {
        var layerIndex = i + 1;
        var targetName = "Фото_" + layerIndex;
        
        try {
            // 1. Ищем слой-подложку (например, Фото_18)
            var baseLayer = doc.layers.getByName(targetName);
            doc.activeLayer = baseLayer;

            // 2. Помещаем фотографию строго над этим слоем
            placeFile(photos[i]);
            var photoLayer = doc.activeLayer;
            photoLayer.name = "IMG_" + photos[i].name.split(".")[0];

            // 3. ПРИКРЕПЛЯЕМ К СЛОЮ (Создаем обтравочную маску)
            // Это действие создает "стрелочку" в палитре слоев
            createClippingMask();

            // 4. Масштабируем под размер подложки
            autoFit(photoLayer, baseLayer);

        } catch (e) {
            // Если слой с таким номером не найден, идем дальше
            continue;
        }
    }
    alert("Готово! Все фото прикреплены к слоям-основам.");
}

function placeFile(path) {
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(path));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
}

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

function autoFit(photo, base) {
    var pB = photo.bounds; var bB = base.bounds;
    var pW = pB[2] - pB[0]; var pH = pB[3] - pB[1];
    var bW = bB[2] - bB[0]; var bH = bB[3] - bB[1];
    var ratio = Math.max(bW / pW, bH / pH) * 100;
    photo.resize(ratio, ratio, AnchorPosition.MIDDLECENTER);
    var pNewB = photo.bounds;
    var pCenter = [pNewB[0] + (pNewB[2]-pNewB[0])/2, pNewB[1] + (pNewB[3]-pNewB[1])/2];
    var bCenter = [bB[0] + bW/2, bB[1] + bH/2];
    photo.translate(bCenter[0] - pCenter[0], bCenter[1] - pCenter[1]);
}

main();
