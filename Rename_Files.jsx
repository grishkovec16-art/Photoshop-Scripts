#target photoshop

/**
 * Ультра-надежный поиск ключа
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
        var key = getStoredLicenseKey();
        if (!key) {
            alert("ОШИБКА АКТИВАЦИИ: Ключ не найден. Перезапустите панель.");
            return;
        }

        var rootFolder = Folder.selectDialog("Выберите папку с папками детей для переименования");
        if (!rootFolder) return;

        var folders = rootFolder.getFiles(function(f) { return f instanceof Folder; });
        
        if (folders.length === 0) {
            alert("В выбранной папке нет подпапок!");
            return;
        }

        var count = 0;
        for (var i = 0; i < folders.length; i++) {
            var currentFolder = folders[i];
            var folderName = decodeURI(currentFolder.name);
            var files = currentFolder.getFiles(/\.(jpg|jpeg|png|tif)$/i);

            for (var j = 0; j < files.length; j++) {
                var file = files[j];
                var extension = file.name.split('.').pop();
                var newName = folderName + (files.length > 1 ? "_" + (j + 1) : "") + "." + extension;
                file.rename(newName);
                count++;
            }
        }

        alert("Готово! Переименовано файлов: " + count);

    } catch (err) {
        alert("Ошибка в скрипте переименования: " + err);
    }
}

main();
