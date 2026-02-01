/**
 * VIGNETTE FILLER PRO (Cloud Compatible Version)
 * Работает как в старом ExtendScript, так и в новом UXP (через панель)
 */

(function() {
    // 1. ОПРЕДЕЛЕНИЕ ПУТИ (из плагина или вручную)
    var selectedPath = (typeof folderPath !== 'undefined') ? folderPath : null;
    var rootFolder;

    if (selectedPath) {
        // Если путь пришел из плагина
        rootFolder = new Folder(selectedPath);
    } else {
        // Если запущен просто как скрипт
        rootFolder = Folder.selectDialog("Выберите папку с классами/именами");
    }

    if (!rootFolder || !rootFolder.exists) return;

    var doc = app.activeDocument;
    if (!doc) {
        alert("Нет открытого документа!");
        return;
    }

    // 2. ПОЛУЧЕНИЕ СПИСКА ПАПОК ДЕТЕЙ
    var allEntries = rootFolder.getFiles();
    var folders = [];
    for (var i = 0; i < allEntries.length; i++) {
        if (allEntries[i] instanceof Folder) {
            folders.push(allEntries[i]);
        }
    }
    
    // Сортировка по алфавиту
    folders.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });

    var studentIndex = 1;

    // 3. ОСНОВНОЙ ЦИКЛ ОБРАБОТКИ
    for (var i = 0; i < folders.length; i++) {
        var personFolder = folders[i];
        var folderName = decodeURI(personFolder.name);

        // Поиск изображения в папке ребенка
        var photoFile = null;
        var subFiles = personFolder.getFiles();
        for (var j = 0; j < subFiles.length; j++) {
            if (subFiles[j] instanceof File && subFiles[j].name.match(/\.(jpg|jpeg|png|tif|psd)$/i)) {
                photoFile = subFiles[j];
                break;
            }
        }

        if (!photoFile) continue;

        var baseID, textID, labelText;

        // Логика именования (Учитель / Ученик)
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

        // Выполнение действий
        try {
            // Обновление текста
            var txtLayer = findLayer(doc, textID);
            if (txtLayer && txtLayer.kind == LayerKind.TEXT) {
                txtLayer.textItem.contents = labelText;
            }

            // Вставка фото
            var placeholder = findLayer(doc, baseID);
            if (placeholder) {
                doc.activeLayer = placeholder;
                
                // Функция вставки Smart-объекта
                placeFileAsSmartObject(photoFile);

                var photoLayer = doc.activeLayer;
                photoLayer.name = "IMG_" + labelText;
                
                // Перемещаем над подложку и создаем Clipping Mask
                photoLayer.move(placeholder, ElementPlacement.PLACEBEFORE);
                photoLayer.grouped = true; 
            }
        } catch (e) {
            $.writeln("Ошибка при обработке: " + folderName + " - " + e);
        }
    }

    alert("Заполнение завершено!\nОбработано папок: " + (studentIndex - 1 + (folders.length - (studentIndex-1))));

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

    function placeFileAsSmartObject(file) {
        try {
            var idPlc = charIDToTypeID("Plc ");
            var desc = new ActionDescriptor();
            desc.putPath(charIDToTypeID("null"), new File(file));
            desc.putBoolean(charIDToTypeID("Lnkd"), true); // Ссылка
            executeAction(idPlc, desc, DialogModes.NO);
        } catch (e) {
            // Если возникла ошибка вставки
        }
    }
})();
