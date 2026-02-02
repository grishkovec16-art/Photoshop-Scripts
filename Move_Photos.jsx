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

function flattenPhotosFolder() {
    // --- ПРОВЕРКА ЗАЩИТЫ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }

    // Выбор корневой папки (например, "Обложка" или "сюжет и портреты")
    var rootFolder = Folder.selectDialog("Выберите папку, в которой лежат папки учеников");
    
    if (rootFolder == null) return; // Если нажали "Отмена"

    // Получаем все подпапки (папки учеников)
    var studentFolders = rootFolder.getFiles();

    var count = 0;

    for (var i = 0; i < studentFolders.length; i++) {
        if (studentFolders[i] instanceof Folder) {
            
            // Ищем папку "Photos" внутри папки ученика
            var photosFolder = Folder(studentFolders[i].fsName + "/Photos");
            
            if (photosFolder.exists) {
                var files = photosFolder.getFiles();
                
                for (var j = 0; j < files.length; j++) {
                    if (files[j] instanceof File) {
                        // Путь назначения (в папку ученика)
                        var destinationPath = studentFolders[i].fsName + "/" + files[j].name;
                        
                        // Перемещаем файл
                        if (files[j].copy(destinationPath)) {
                            files[j].remove();
                        }
                    }
                }
                
                // Удаляем теперь уже пустую папку "Photos"
                photosFolder.remove();
                count++;
            }
        }
    }
    
    alert("Готово! Обработано папок: " + count);
}

// Запуск функции
flattenPhotosFolder();
