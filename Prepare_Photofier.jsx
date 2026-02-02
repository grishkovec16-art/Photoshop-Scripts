#target photoshop

/**
 * Функция получения ключа из памяти Photoshop, 
 * который туда записывает ваша панель (index.html)
 */
function getStoredLicenseKey() {
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
    // --- ПРОВЕРКА ЗАЩИТЫ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }

    // 1. Выбор папки с исходными JPG (где имена детей)
    var inputFolder = Folder.selectDialog("Выберите папку с JPG (например, Output_Ready)");
    if (!inputFolder) return;

    // 2. Создание папки для типографии (рядом с папкой Output_Ready)
    var outputFolder = new Folder(inputFolder.parent + "/Печать фотофиера");
    if (!outputFolder.exists) outputFolder.create();

    // 3. Поиск всех JPG
    var files = inputFolder.getFiles(/\.(jpg|jpeg)$/i);
    
    // Сортировка по имени, чтобы порядок 001, 002 соответствовал алфавиту фамилий
    files.sort();

    if (files.length === 0) {
        alert("В выбранной папке не найдено JPG файлов!");
        return;
    }

    // 4. Процесс копирования и переименования
    var successCount = 0;
    for (var i = 0; i < files.length; i++) {
        var sourceFile = files[i];
        var index = i + 1;
        
        // Форматирование номера: 1 -> 001, 10 -> 010
        var padIndex = ("000" + index).slice(-3);
        var newName = "00-" + padIndex + ".jpg";
        
        var destFile = new File(outputFolder + "/" + newName);
        
        // ВАЖНО: Используем копирование, чтобы исходники остались на месте
        if (sourceFile.copy(destFile)) {
            successCount++;
        }
    }

    alert("Успешно!\nСкопировано файлов: " + successCount + "\nПапка: " + outputFolder.fsName);
    outputFolder.execute();
}

main();
