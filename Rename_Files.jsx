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

function renameJpegsWithIndex() {
    // --- ПРОВЕРКА ЗАЩИТЫ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }

    // Выбор корневой папки (например, "Обложка")
    var rootFolder = Folder.selectDialog("Выберите корневую папку (например, 'Обложка')");
    if (rootFolder == null) return; 

    var items = rootFolder.getFiles();
    var folderCount = 0;
    var fileCount = 0;

    for (var i = 0; i < items.length; i++) {
        if (items[i] instanceof Folder) {
            var currentFolder = items[i];
            var folderName = currentFolder.name;
            
            // Получаем список только JPG файлов
            var allFiles = currentFolder.getFiles();
            var jpgFiles = [];
            
            for (var f = 0; f < allFiles.length; f++) {
                if (allFiles[f] instanceof File && allFiles[f].name.match(/\.(jpg|jpeg)$/i)) {
                    jpgFiles.push(allFiles[f]);
                }
            }

            // Сортируем файлы по имени перед переименованием
            jpgFiles.sort();

            // Переименовываем найденные файлы
            for (var j = 0; j < jpgFiles.length; j++) {
                var file = jpgFiles[j];
                var ext = file.name.split('.').pop();
                var newName;

                if (jpgFiles.length > 1) {
                    // Если файлов несколько, добавляем _1, _2 и т.д.
                    newName = folderName + "_" + (j + 1) + "." + ext;
                } else {
                    // Если файл один, оставляем только имя папки
                    newName = folderName + "." + ext;
                }

                var newFile = new File(file.parent + "/" + newName);
                
                // Проверка, чтобы не переименовать в то же самое имя (избежать ошибок)
                if (file.fsName !== newFile.fsName) {
                    file.rename(newName);
                    fileCount++;
                }
            }
            folderCount++;
        }
    }
    
    alert("Готово!\nОбработано папок: " + folderCount + "\nПереименовано файлов: " + fileCount);
}

// Запуск функции
renameJpegsWithIndex();
