/**
 * VIGNETTE FILLER PRO (Cloud & Legacy Compatible)
 * Исправленная версия для работы через UXP-плагин
 */

(function() {
    // 1. ИНИЦИАЛИЗАЦИЯ ПУТИ
    // Если скрипт запущен через плагин, переменная folderPath уже будет существовать
    var selectedPath = (typeof folderPath !== 'undefined') ? folderPath : null;
    var rootFolder;

    if (selectedPath) {
        rootFolder = new Folder(selectedPath);
    } else {
        // Если запущен вручную как .jsx
        rootFolder = Folder.selectDialog("Выберите папку с классами");
    }

    if (!rootFolder || !rootFolder.exists) return;

    var doc = app.activeDocument;
    if (!doc) {
        alert("Ошибка: Откройте PSD шаблон виньетки!");
        return;
    }

    // 2. ПОЛУЧЕНИЕ СПИСКА ПАПОК (Безопасный метод для UXP)
    // В UXP мы имитируем работу через массив, переданный из плагина, если это возможно
    var folders = [];
    var allFiles = rootFolder.getFiles();
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof Folder) {
            folders.push(allFiles[i]);
        }
    }
    
    folders.sort(function(a, b) { return a.name.localeCompare(b.name); });

    var studentIndex = 1;

    // 3. ОСНОВНОЙ ЦИКЛ ОБРАБОТКИ
    for (var i = 0; i < folders.length; i++) {
        var personFolder = folders[i];
        var folderName = decodeURI(personFolder.name);

        // Пропускаем системные папки
        if (folderName.match(/^(\.|__)/)) continue;

        // Поиск первого изображения в папке (jpg, png, tif)
        var photoFile = null;
        var subFiles = personFolder.getFiles();
        for (var j = 0; j < subFiles.length; j++) {
            if (subFiles[j].name.match(/\.(jpg|jpeg|png|tif|psd)$/i)) {
                photoFile = subFiles[j];
                break;
            }
        }

        if (!photoFile) continue;

        // Определение целевых слоев
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

        // ВЫПОЛНЕНИЕ ДЕЙСТВИЙ В PHOTOSHOP
        try {
            // Обновляем текст
            var txtLayer = findLayer(doc, textID);
            if (txtLayer && txtLayer.kind == LayerKind.TEXT) {
                txtLayer.textItem.contents = labelText;
            }

            // Вставляем фото
            var placeholder = findLayer(doc, baseID);
            if (placeholder) {
                doc.activeLayer = placeholder;
                
                // Вставка файла
                placeFile(photoFile);

                var photoLayer = doc.activeLayer;
                photoLayer.name = "IMG_" + labelText;
                
                // Создаем обтравочную маску (Clipping Mask)
                photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
                photoLayer.grouped = true; 
            }
        } catch (e) {
            $.writeln("Ошибка папки " + folderName + ": " + e);
        }
    }

    alert("Завершено!\nОбработано папок: " + folders.length);

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

    function placeFile(file) {
        var idPlc = charIDToTypeID("Plc ");
        var desc = new ActionDescriptor();
        desc.putPath(charIDToTypeID("null"), new File(file));
        desc.putBoolean(charIDToTypeID("Lnkd"), true); // Вставить как связанный
        executeAction(idPlc, desc, DialogModes.NO);
    }
})();
