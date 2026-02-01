/**
 * VIGNETTE FILLER PRO
 * Совместим с UXP-планином и обычным запуском
 */

(function() {
    // 1. ОПРЕДЕЛЕНИЕ ПУТИ
    // Если переменная folderPath передана из плагина — используем её
    var selectedPath = (typeof folderPath !== 'undefined') ? folderPath : null;
    var rootFolder;

    if (selectedPath) {
        rootFolder = new Folder(selectedPath);
    } else {
        rootFolder = Folder.selectDialog("Выберите папку с классами");
    }

    if (!rootFolder || !rootFolder.exists) return;

    var doc = app.activeDocument;
    if (!doc) {
        alert("Ошибка: Откройте PSD шаблон!");
        return;
    }

    // 2. ПОЛУЧЕНИЕ СПИСКА ПАПОК (Безопасный перебор)
    var allEntries = rootFolder.getFiles();
    var folders = [];
    for (var i = 0; i < allEntries.length; i++) {
        if (allEntries[i] instanceof Folder) {
            folders.push(allEntries[i]);
        }
    }
    
    // Сортировка по имени
    folders.sort(function(a, b) { 
        return a.name.localeCompare(b.name); 
    });

    var studentIndex = 1;

    // 3. ЦИКЛ ОБРАБОТКИ
    for (var i = 0; i < folders.length; i++) {
        var personFolder = folders[i];
        var folderName = decodeURI(personFolder.name);

        // Пропускаем скрытые папки
        if (folderName.indexOf(".") === 0) continue;

        // Поиск фото (jpg, png, tif, psd)
        var photoFile = null;
        var subFiles = personFolder.getFiles();
        for (var j = 0; j < subFiles.length; j++) {
            if (subFiles[j] instanceof File && subFiles[j].name.match(/\.(jpg|jpeg|png|tif|psd)$/i)) {
                photoFile = subFiles[j];
                break;
            }
        }

        if (!photoFile) continue;

        // Определяем слои
        var baseID, textID, labelText;
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

        // ПРИМЕНЕНИЕ В PHOTOSHOP
        try {
            // Имя
            var txtLayer = findLayer(doc, textID);
            if (txtLayer && txtLayer.kind == LayerKind.TEXT) {
                txtLayer.textItem.contents = labelText;
            }

            // Фото
            var placeholder = findLayer(doc, baseID);
            if (placeholder) {
                doc.activeLayer = placeholder;
                
                // Вставка фото
                placeFileAsSmartObject(photoFile);

                var photoLayer = doc.activeLayer;
                photoLayer.name = "IMG_" + labelText;
                
                // Создание Clipping Mask
                photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
                photoLayer.grouped = true; 
            }
        } catch (e) {
            // Ошибку пишем в консоль, чтобы не прерывать цикл
            $.writeln("Ошибка в папке " + folderName + ": " + e);
        }
    }

    alert("Готово! Обработано человек: " + folders.length);

    // --- ФУНКЦИИ-ПОМОЩНИКИ ---

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

    function placeFileAsSmartObject(file) {
        var idPlc = charIDToTypeID("Plc ");
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), new File(file));
        desc.putBoolean(charIDToTypeID("Lnkd"), true); 
        executeAction(idPlc, desc, DialogModes.NO);
    }
})();
